// React Native component: the Libras Translation Player (live v3 architecture).
//
// Task 8.1 — renders the live-avatar architecture (ADR-002):
//   - `react-native-video` is the MASTER CLOCK: it plays the single `original`
//     variant (sole audio source) and its progress/seek events drive the cue
//     scheduler via `controller.onProgress(positionMs)` (Requirements 1.1, 1.3);
//   - when the avatar is enabled AND available, an OVERLAID `react-native-webview`
//     loads the local `assets/vlibras/index.html` page (the official
//     `vlibras-player-webjs` Unity/WebGL player) and animates the avatar live
//     (Requirements 2.1, 8.1);
//   - a `WebViewAvatarBridge` is wired to the WebView: its transport's
//     `postMessage` calls `webViewRef.current.postMessage(json)` and the
//     WebView's `onMessage` feeds `bridge.receive(event.nativeEvent.data)`; the
//     bridge and the SRT cues are handed to the controller
//     (`setAvatarBridge` / `setCues`) so each cue transition fires `sendCue`;
//   - SRT captions render the active cue (from the controller snapshot's
//     `activeCueId`, falling back to position) and stay visible in the fallback
//     (Requirements 2.4, 13.3);
//   - a permanent, readable Disclosure stays visible while the avatar is
//     playing (Requirements 14.1, 14.2);
//   - the avatar toggle is shown ONLY when `avatarAvailable`; enabling/disabling
//     calls `controller.setAutomaticAvatar`. An "avatar indisponível" notice is
//     shown when the avatar is not available (Requirements 2.1, 2.4, 2.5);
//   - the ONLY WebView is the official local player page — the VLibras Widget
//     and Hand Talk are NEVER embedded (Requirement 15.4).
//
// Runtime honesty: whether the WebView actually loads the Unity/WebGL avatar
// and reaches the online VLibras services depends on the device/emulator and
// network; that is NOT verified here. This component only wires the pieces
// correctly and compiles. If the WebView errors, the controller drops the
// avatar to the captions fallback (Requirements 7.4, 8.4, 13.2).
//
// Asset resolution: until the Expo app shell exists (task 10.1) the HTML bundle
// origin is NOT resolved by this component. The caller passes the packaged
// page URI through `manifest.avatarRuntime.playerBundleUri` (e.g. a bundled
// `file://.../assets/vlibras/index.html`, or a dev server URL). The component
// loads exactly that URI into the WebView with a restricted `originWhitelist`.

import {
  parseAndNormalizeSrt,
  type AvatarRuntimeState,
  type Milliseconds,
  type TranscriptCue,
  type TranslationManifest,
} from "@libras/pipeline/client";
import {
  type ComponentType,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Video, {
  type OnLoadData,
  type OnProgressData,
  type OnSeekData,
  type OnVideoErrorData,
  type VideoRef,
} from "react-native-video";
import WebViewImport from "react-native-webview";

/**
 * `react-native-webview` ships typings that, under RN 0.76's generated types,
 * do not satisfy TS's JSX component constraint (the class-component shape is
 * incompatible). We only use a small, well-known subset of its props, so we
 * re-type the imported component as a permissive `ComponentType` over that
 * subset. This keeps the real component (and its runtime behavior) intact
 * while giving the JSX usage a valid element type.
 */
type AvatarWebViewProps = {
  ref?: (ref: WebViewHandle | null) => void;
  source: { uri: string };
  originWhitelist?: readonly string[];
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onError?: () => void;
  onHttpError?: () => void;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  allowFileAccess?: boolean;
  allowFileAccessFromFileURLs?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  style?: unknown;
  containerStyle?: unknown;
  testID?: string;
};
const AvatarWebView = WebViewImport as unknown as ComponentType<AvatarWebViewProps>;

/**
 * Minimal structural handle for the avatar WebView ref. `react-native-webview`
 * types its component as a `FunctionComponent` and does not export an instance
 * type, but the ref it forwards exposes the imperative `postMessage` we use to
 * push app→web messages. Typing only what we call keeps the component decoupled
 * from the library's internal ref shape.
 */
type WebViewHandle = {
  postMessage(data: string): void;
};

import {
  HttpsTranslationPackageRepository,
  type HttpsTranslationPackageRepositoryOptions,
} from "../data/packageRepository";
import {
  WebViewAvatarBridge,
  type WebViewTransport,
} from "./avatarBridge";
import {
  LibrasPlayerController,
  isAvatarAvailable as manifestAvatarAvailable,
} from "./controller";
import { secondsToMs, VideoRefNativeMediaPlayer } from "./videoRefPlayer";

/**
 * Permanent experimental-translation disclosure shown while the avatar is
 * playing (Requirements 14.1, 14.2). Kept verbatim in step with the manifest
 * so the app and the media agree.
 */
export const PLAYER_DISCLOSURE_TEXT =
  "Tradução automática experimental por avatar; não equivale a intérprete humano." as const;

/** Message shown when the automatic avatar is not available (Req 2.4, 2.5, 13.3). */
export const AVATAR_UNAVAILABLE_TEXT =
  "Avatar automático indisponível; exibindo vídeo com legendas." as const;

/**
 * Origin allowlist for the avatar WebView page itself (what the WebView is
 * allowed to navigate to as its document). The HTML page's own CSP further
 * restricts which online VLibras services it may reach (Requirements 8.2,
 * 15.2). `file://`/`about:` cover a bundled local page; `http(s)://` cover the
 * dev package server, which in a monorepo is reached over the host machine's
 * LAN IP (e.g. `http://192.168.0.104:8787`), not just `localhost`. The static
 * server (`serve-package.mjs`) is the only HTTP origin the demo points at, and
 * the page's CSP blocks any third-party script/connect origin regardless.
 */
const AVATAR_ORIGIN_WHITELIST = [
  "file://*",
  "about:*",
  "http://*",
  "https://*",
] as const;

/** A `TranslationPackageRepository` the component can load the manifest from. */
export type ManifestSource = Pick<
  HttpsTranslationPackageRepository,
  "getManifest"
>;

/** Props for {@link LibrasTranslationPlayer}. */
export type LibrasTranslationPlayerProps = Readonly<{
  /** Media id to load from the repository. */
  mediaId: string;
  /**
   * How to obtain the manifest. Provide exactly one of:
   *  - `manifest`: an already-loaded manifest, or
   *  - `repository`: a repository whose `getManifest(mediaId)` is called, or
   *  - `repositoryOptions`: options used to build an
   *    {@link HttpsTranslationPackageRepository} internally.
   */
  manifest?: TranslationManifest;
  repository?: ManifestSource;
  repositoryOptions?: HttpsTranslationPackageRepositoryOptions;
  /**
   * Initial avatar toggle state. Only honored when the manifest actually
   * declares a live-avatar runtime (`avatarAvailable` + `avatarRuntime`);
   * otherwise the player stays on the original with captions (Requirement 2.4).
   */
  initialAutomaticAvatarEnabled?: boolean;
  /**
   * Whether to show SRT captions when the avatar is unavailable. Defaults to
   * `true` (Requirement 13.3).
   */
  showCaptionsWhenAvatarUnavailable?: boolean;
  /**
   * Overrides the HTML bundle URI loaded into the avatar WebView. When omitted
   * the component uses `manifest.avatarRuntime.playerBundleUri`. Useful in dev
   * (e.g. a local server) before the Expo asset pipeline (task 10.1) resolves
   * the bundled `assets/vlibras/index.html`.
   */
  playerBundleUri?: string;
  /**
   * Playback speed forwarded to the live avatar (VLibras `setSpeed`/slider).
   * `1` is normal; higher values sign faster, which helps the live avatar keep
   * up with speech (the translation pipeline has inherent latency). When
   * omitted the manifest's `avatarRuntime.defaultSpeed` is used.
   */
  avatarSpeed?: number;
  /** Injected `fetch` for loading the transcript text (tests / custom hosts). */
  fetch?: (input: string) => Promise<{ ok: boolean; text(): Promise<string> }>;
  /** Called when loading or playback fails. */
  onPlaybackError?: (error: Error) => void;
}>;

type LoadPhase = "loading" | "ready" | "error";

/**
 * Native Libras translation player. See {@link LibrasTranslationPlayerProps}.
 */
export function LibrasTranslationPlayer(
  props: LibrasTranslationPlayerProps,
): ReactElement {
  const {
    mediaId,
    manifest: manifestProp,
    repository,
    repositoryOptions,
    initialAutomaticAvatarEnabled = false,
    showCaptionsWhenAvatarUnavailable = true,
    playerBundleUri: playerBundleUriProp,
    avatarSpeed,
    fetch: fetchImpl,
    onPlaybackError,
  } = props;

  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [manifest, setManifest] = useState<TranslationManifest | undefined>(
    manifestProp,
  );
  const [cues, setCues] = useState<readonly TranscriptCue[]>([]);
  const [sourceUri, setSourceUri] = useState<string | undefined>(undefined);
  const [positionMs, setPositionMs] = useState<Milliseconds>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [avatarEnabled, setAvatarEnabled] = useState(
    initialAutomaticAvatarEnabled,
  );
  const [avatarRuntimeState, setAvatarRuntimeState] =
    useState<AvatarRuntimeState>("idle");
  const [activeCueId, setActiveCueId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const videoRef = useRef<VideoRef | null>(null);
  const webViewRef = useRef<WebViewHandle | null>(null);

  // The native-player adapter re-renders the <Video> by pushing the active
  // source URI into state. Created once and kept across renders.
  const player = useMemo(
    () => new VideoRefNativeMediaPlayer((uri) => setSourceUri(uri)),
    [],
  );

  // The live-avatar bridge: its transport writes to the WebView ref (app→web),
  // and `receive` is fed from the WebView's onMessage (web→app). Created once.
  const bridge = useMemo(() => {
    const transport: WebViewTransport = {
      postMessage: (json: string) => {
        // The ref may be null while the overlay is unmounted (avatar off) — a
        // dropped message is harmless: enabling re-sends `init` and the next
        // cue transition re-fires. Never throw from the transport.
        webViewRef.current?.postMessage(json);
      },
    };
    return new WebViewAvatarBridge(transport);
  }, []);

  const controller = useMemo(
    () =>
      new LibrasPlayerController(player, {
        bridge,
        ...(avatarSpeed !== undefined ? { avatarSpeed } : {}),
      }),
    [player, bridge, avatarSpeed],
  );

  // Apply avatar-speed changes to the live controller without recreating it.
  // (The useMemo above seeds the initial speed; this keeps a later prop change
  // in sync and forwards it to the WebView when the avatar is enabled.)
  useEffect(() => {
    if (avatarSpeed !== undefined) {
      controller.setAvatarSpeed(avatarSpeed);
    }
  }, [controller, avatarSpeed]);

  // Keep the component's view state in sync with the controller snapshot after
  // any interaction that can change avatar/cue/runtime state.
  const syncFromSnapshot = useCallback(() => {
    const snapshot = controller.getSnapshot();
    setAvatarEnabled(snapshot.automaticAvatarEnabled);
    setPositionMs(snapshot.positionMs);
    setActiveCueId(snapshot.activeCueId ?? null);
    setAvatarRuntimeState(snapshot.avatarRuntimeState ?? "idle");
  }, [controller]);

  const reportError = useCallback(
    (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      setErrorMessage(err.message);
      setPhase("error");
      onPlaybackError?.(err);
    },
    [onPlaybackError],
  );

  // Surface controller runtime-state transitions (e.g. WebView load/error) into
  // the component so the UI reacts to the fallback. The controller updates its
  // own state from bridge messages; we additionally subscribe here to refresh
  // the rendered snapshot when those messages arrive.
  useEffect(() => {
    const unsubscribe = bridge.onMessage(() => {
      // A bridge event may change the controller's runtime state / availability
      // (e.g. `error` → captions fallback). Re-read the snapshot to reflect it.
      syncFromSnapshot();
    });
    return unsubscribe;
  }, [bridge, syncFromSnapshot]);

  // --- Load manifest + transcript, then prepare the controller ------------
  useEffect(() => {
    let cancelled = false;

    const resolveManifest = async (): Promise<TranslationManifest> => {
      if (manifestProp !== undefined) {
        return manifestProp;
      }
      if (repository !== undefined) {
        return repository.getManifest(mediaId);
      }
      if (repositoryOptions !== undefined) {
        return new HttpsTranslationPackageRepository(
          repositoryOptions,
        ).getManifest(mediaId);
      }
      throw new Error(
        "LibrasTranslationPlayer: forneça `manifest`, `repository` ou `repositoryOptions`.",
      );
    };

    const loadTranscript = async (
      uri: string,
      durationMs: Milliseconds,
    ): Promise<readonly TranscriptCue[]> => {
      const doFetch =
        fetchImpl ??
        (typeof globalThis.fetch === "function"
          ? (input: string) =>
              (globalThis.fetch as (i: string) => Promise<Response>)(input)
          : undefined);
      if (doFetch === undefined) {
        return [];
      }
      const response = await doFetch(uri);
      if (!response.ok) {
        return [];
      }
      const srt = await response.text();
      try {
        return parseAndNormalizeSrt(srt, durationMs);
      } catch {
        // A malformed transcript must not crash the player; captions simply
        // stay empty while the video still plays (fallback is robust).
        return [];
      }
    };

    (async () => {
      setPhase("loading");
      try {
        const loaded = await resolveManifest();
        if (cancelled) {
          return;
        }
        setManifest(loaded);

        const transcriptCues = await loadTranscript(
          loaded.transcriptUri,
          loaded.durationMs,
        );
        if (cancelled) {
          return;
        }
        setCues(transcriptCues);

        await controller.load(loaded);
        if (cancelled) {
          return;
        }
        // Feed the normalized SRT cues to the controller's scheduler so the
        // video master clock can drive cue transitions and `sendCue`.
        controller.setCues(transcriptCues);

        const available = manifestAvatarAvailable(loaded);
        const enabled = available && initialAutomaticAvatarEnabled;
        await controller.setAutomaticAvatar(enabled);
        if (cancelled) {
          return;
        }
        syncFromSnapshot();
        setPhase("ready");
      } catch (error) {
        if (!cancelled) {
          reportError(error);
        }
      }
    })();

    return () => {
      cancelled = true;
      void controller.dispose();
    };
    // Intentionally keyed on `mediaId` only: re-resolving the manifest on every
    // prop identity change would reload the player mid-playback. The other
    // referenced values are stable (memoized controller/player) or read fresh.
  }, [mediaId]);

  // --- Native player event handlers ---------------------------------------
  const handleRef = useCallback(
    (ref: VideoRef | null) => {
      videoRef.current = ref;
      player.attach(ref);
    },
    [player],
  );

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      setIsBuffering(false);
      player.reportLoaded(sourceUri);
      const ms = secondsToMs(data.currentTime);
      // Drive the cue scheduler from the master clock (Requirements 1.1, 1.3).
      controller.onProgress(ms);
      setPositionMs(ms);
    },
    [controller, player, sourceUri],
  );

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      const ms = secondsToMs(data.currentTime);
      player.reportPosition(ms, sourceUri);
      // Master clock → scheduler: a cue transition here fires `bridge.sendCue`
      // through the controller and updates `activeCueId`.
      controller.onProgress(ms);
      setPositionMs(ms);
      const snapshotCueId = controller.getSnapshot().activeCueId ?? null;
      setActiveCueId(snapshotCueId);
    },
    [controller, player, sourceUri],
  );

  const handleSeek = useCallback(
    (data: OnSeekData) => {
      const ms = secondsToMs(data.currentTime);
      player.reportPosition(ms, sourceUri);
      // A seek is just another master-clock position: re-resolve the cue.
      controller.onProgress(ms);
      setPositionMs(ms);
      setActiveCueId(controller.getSnapshot().activeCueId ?? null);
    },
    [controller, player, sourceUri],
  );

  const handleError = useCallback(
    (data: OnVideoErrorData) => {
      const detail =
        data.error.errorString ??
        data.error.localizedDescription ??
        "Erro de reprodução do vídeo.";
      reportError(new Error(detail));
    },
    [reportError],
  );

  // --- WebView (avatar) event handlers ------------------------------------
  const handleWebViewRef = useCallback((ref: WebViewHandle | null) => {
    webViewRef.current = ref;
  }, []);

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      // Feed the raw web→app payload into the bridge, which parses it
      // defensively and dispatches to the controller's subscription.
      bridge.receive(event.nativeEvent.data);
    },
    [bridge],
  );

  const handleWebViewError = useCallback(() => {
    // A WebView load failure is avatar unavailability, never a video
    // interruption: surface it to the bridge as an `error` so the controller
    // runs the captions fallback (Requirements 7.4, 8.4, 13.2).
    bridge.receive(
      JSON.stringify({
        type: "error",
        code: "WEBVIEW_LOAD_FAILED",
        message: "Falha ao carregar o player do avatar.",
      }),
    );
  }, [bridge]);

  // --- User controls -------------------------------------------------------
  const togglePlay = useCallback(async () => {
    try {
      if (isPlaying) {
        await controller.pause();
        setIsPlaying(false);
      } else {
        await controller.play();
        setIsPlaying(true);
      }
    } catch (error) {
      reportError(error);
    }
  }, [controller, isPlaying, reportError]);

  const seekBy = useCallback(
    async (deltaMs: Milliseconds) => {
      try {
        const target = positionMs + deltaMs;
        await controller.seek(target);
        syncFromSnapshot();
      } catch (error) {
        reportError(error);
      }
    },
    [controller, positionMs, reportError, syncFromSnapshot],
  );

  const toggleAvatar = useCallback(async () => {
    try {
      const next = !avatarEnabled;
      await controller.setAutomaticAvatar(next);
      // Reflect what the controller actually settled on (it refuses to enable
      // an avatar the manifest does not publish).
      syncFromSnapshot();
    } catch (error) {
      reportError(error);
    }
  }, [avatarEnabled, controller, reportError, syncFromSnapshot]);

  // --- Derived view state --------------------------------------------------
  const avatarAvailable =
    manifest !== undefined &&
    manifestAvatarAvailable(manifest) &&
    avatarRuntimeState !== "error";

  // The avatar overlay is shown when the toggle is on and the manifest supports
  // it; the Disclosure and the WebView are bound to that (Requirements 14.1,
  // 8.1). The HTML bundle URI comes from the prop override or the runtime config.
  const avatarPlaying = avatarAvailable && avatarEnabled;
  const playerBundleUri =
    playerBundleUriProp ?? manifest?.avatarRuntime?.playerBundleUri;
  const showAvatarWebView = avatarPlaying && playerBundleUri !== undefined;

  // Active caption: prefer the controller's snapshot `activeCueId` (driven by
  // the master clock), falling back to a position lookup when the scheduler has
  // not emitted yet (e.g. before the first progress tick).
  const activeCaption = useMemo(() => {
    if (activeCueId !== null) {
      const byId = cues.find((cue) => cue.id === activeCueId);
      if (byId !== undefined) {
        return byId;
      }
    }
    return findActiveCue(cues, positionMs);
  }, [activeCueId, cues, positionMs]);

  // Captions render whenever a cue is active. While the avatar is playing they
  // always show; while it is unavailable they honor the opt-out flag (default
  // true, Requirement 13.3).
  const showCaptions =
    activeCaption !== undefined &&
    (avatarPlaying || showCaptionsWhenAvatarUnavailable);

  if (phase === "loading") {
    return (
      <View style={styles.container} accessibilityRole="none">
        <ActivityIndicator accessibilityLabel="Carregando o player" />
      </View>
    );
  }

  if (phase === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText} accessibilityRole="alert">
          {errorMessage ?? "Não foi possível carregar o vídeo."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        {sourceUri !== undefined ? (
          <Video
            ref={handleRef}
            source={{ uri: sourceUri }}
            style={styles.video}
            paused={!isPlaying}
            // Report position frequently so a cue transition is detected almost
            // as soon as the video enters the cue. The default (~250 ms) adds up
            // to a quarter-second of detection lag before the avatar is even
            // asked to translate; 50 ms makes the cue fire promptly. (The
            // remaining delay is the VLibras translate->gloss->animate latency,
            // which the app cannot control.)
            progressUpdateInterval={50}
            onLoad={handleLoad}
            onLoadStart={() => setIsBuffering(true)}
            onBuffer={(e: { isBuffering: boolean }) =>
              setIsBuffering(e.isBuffering)
            }
            onProgress={handleProgress}
            onSeek={handleSeek}
            onError={handleError}
            onEnd={() => setIsPlaying(false)}
            resizeMode="contain"
            testID="libras-native-video"
          />
        ) : null}

        {/*
          Live avatar overlay: the ONLY WebView in the app, loading the local
          official vlibras-player-webjs page. No VLibras Widget / Hand Talk is
          embedded (Requirement 15.4). Overlaid in a corner over the video; the
          page emits no audio (the native video is the sole audio source).
        */}
        {showAvatarWebView ? (
          <View
            style={styles.avatarOverlay}
            pointerEvents="none"
            testID="libras-avatar-overlay"
          >
            <AvatarWebView
              ref={handleWebViewRef}
              source={{ uri: playerBundleUri ?? "" }}
              originWhitelist={[...AVATAR_ORIGIN_WHITELIST]}
              onMessage={handleWebViewMessage}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              allowFileAccessFromFileURLs
              allowUniversalAccessFromFileURLs
              mediaPlaybackRequiresUserAction
              style={styles.avatarWebView}
              // Transparent so the avatar canvas overlays the video cleanly.
              containerStyle={styles.avatarWebViewContainer}
              testID="libras-avatar-webview"
            />
          </View>
        ) : null}

        {isBuffering ? (
          <View style={styles.bufferingOverlay} pointerEvents="none">
            <ActivityIndicator accessibilityLabel="Carregando vídeo" />
          </View>
        ) : null}

        {/* Permanent, readable disclosure while the avatar is playing. */}
        {avatarPlaying ? (
          <View
            style={styles.disclosure}
            pointerEvents="none"
            accessibilityRole="text"
            testID="libras-disclosure"
          >
            <Text style={styles.disclosureText}>{PLAYER_DISCLOSURE_TEXT}</Text>
          </View>
        ) : null}

        {/* SRT captions rendered from the transcript. */}
        {showCaptions ? (
          <View
            style={styles.captionBox}
            pointerEvents="none"
            testID="libras-caption"
          >
            <Text style={styles.captionText}>{activeCaption.textPtBr}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => void seekBy(-10_000)}
          accessibilityRole="button"
          accessibilityLabel="Retroceder 10 segundos"
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>-10s</Text>
        </Pressable>

        <Pressable
          onPress={() => void togglePlay()}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar" : "Reproduzir"}
          style={styles.controlButton}
          testID="libras-play-toggle"
        >
          <Text style={styles.controlText}>
            {isPlaying ? "Pausar" : "Play"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void seekBy(10_000)}
          accessibilityRole="button"
          accessibilityLabel="Avançar 10 segundos"
          style={styles.controlButton}
        >
          <Text style={styles.controlText}>+10s</Text>
        </Pressable>

        {/* Avatar toggle: present only when the manifest publishes a live avatar. */}
        {avatarAvailable ? (
          <Pressable
            onPress={() => void toggleAvatar()}
            accessibilityRole="switch"
            accessibilityState={{ checked: avatarEnabled }}
            accessibilityLabel="Avatar automático de Libras"
            style={[
              styles.controlButton,
              avatarEnabled ? styles.controlButtonActive : undefined,
            ]}
            testID="libras-avatar-toggle"
          >
            <Text style={styles.controlText}>
              {avatarEnabled ? "Avatar: ligado" : "Avatar: desligado"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Unavailability notice when no live avatar is available. */}
      {!avatarAvailable ? (
        <View style={styles.notice} testID="libras-avatar-unavailable">
          <Text style={styles.noticeText} accessibilityRole="text">
            {AVATAR_UNAVAILABLE_TEXT}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Finds the cue covering `positionMs`, if any (captions are position-driven). */
export function findActiveCue(
  cues: readonly TranscriptCue[],
  positionMs: Milliseconds,
): TranscriptCue | undefined {
  return cues.find(
    (cue) => positionMs >= cue.startMs && positionMs < cue.endMs,
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  videoWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000000",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarOverlay: {
    position: "absolute",
    right: 8,
    bottom: 72,
    width: 160,
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  avatarWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  avatarWebViewContainer: {
    backgroundColor: "transparent",
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  disclosure: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disclosureText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  captionBox: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  captionText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#111111",
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#262626",
  },
  controlButtonActive: {
    backgroundColor: "#2d6cdf",
  },
  controlText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  notice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
  },
  noticeText: {
    color: "#f2c14e",
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
