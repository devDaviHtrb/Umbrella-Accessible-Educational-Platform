// Demo screen (task 10.2): mounts the LibrasTranslationPlayer against a local
// schemaVersion-3 package served over plain HTTP by `scripts/serve-package.mjs`.
//
// _Requirements: 2.1, 2.2, 8.1_
//
// ── Why this screen loads the manifest itself (resolving the 11.2 mismatch) ──
//
// The dev package is served by `apps/mobile/scripts/serve-package.mjs`: plain
// HTTP, manifest at the ROOT (`http://localhost:8787/manifest.json`), media and
// transcript also at the root (`/original.mp4`, `/transcript.normalized.srt`).
//
// `HttpsTranslationPackageRepository` (src/data/packageRepository.ts) is
// deliberately NOT compatible with that layout: it REQUIRES `https://` and
// resolves `{baseUrl}/{mediaId}/{revision}/manifest.json`. Task 11.2 documented
// this gap and left it for task 10.2 to close. We close it here WITHOUT touching
// the repository: the demo fetches the manifest directly over HTTP from a
// configurable dev origin and hands the parsed manifest to the player through
// its already-supported `manifest` prop.
//
// The served manifest's `transcriptUri` is written by the pipeline as the bare
// file name (`transcript.normalized.srt`) relative to the package root. The
// player fetches the transcript with `globalThis.fetch`, which needs an
// absolute URL in React Native, so we REWRITE any relative `transcriptUri` to
// an absolute URL on the same dev origin before passing the manifest down. The
// `original.mp4` variant URI is rewritten the same way so the native video
// player can stream it (with Range) from the dev server.
//
// ── Avatar bundle (playerBundleUri) ──────────────────────────────────────────
//
// The official vlibras-player-webjs page is bundled locally under
// `assets/vlibras/index.html` (task 3.1) and `metro.config.js` (task 10.1)
// registers `.html` as an asset extension. We resolve a WebView-loadable URI
// for it with `expo-asset`:
//
//     Asset.fromModule(require("../../assets/vlibras/index.html")).uri
//
// HONESTY / known limitation: `require()`-ing an `.html` file as a Metro asset
// relies on the assetExts config from task 10.1 (which does include `html`).
// Whether that asset URI actually loads the Unity/WebGL avatar in a real
// WebView — and whether the player's online VLibras services respond — depends
// on the device/emulator and network and is NOT verified here (see the task's
// runtime-honesty note). If the `require` cannot be resolved by the bundler in
// a given setup, `playerBundleUri` is left configurable below (the dev server
// also exposes the bundle at `${origin}/vlibras/index.html` as a fallback) so
// the WebView still has a URI to load. The player drops to the captions
// fallback if the WebView errors (Requirements 7.4, 8.4, 13.2).

import {
  type AvatarRuntimeConfig,
  type MediaVariant,
  type TranslationManifest,
} from "@libras/pipeline/client";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LibrasTranslationPlayer } from "../player/LibrasTranslationPlayer";

/**
 * Default dev origin for the local package server (`serve-package.mjs`). The
 * manifest is reachable at `${DEV_PACKAGE_ORIGIN}/manifest.json`. On Android
 * emulators `localhost` points at the device, not the host machine — use
 * `http://10.0.2.2:8787` there (editable in the field below).
 */
export const DEV_PACKAGE_ORIGIN = "http://localhost:8787" as const;

/**
 * Default media id. The demo does not use it to build the URL (the dev server
 * serves the manifest at the root); it is only the `mediaId` handed to the
 * player, which also keys its internal load effect.
 */
export const DEFAULT_MEDIA_ID = "chocolate-from-cacao" as const;

/**
 * The last path segment of a URI/path (handles both `/` and Windows `\`), with
 * any query string stripped. Used to map a manifest artifact onto the file name
 * the dev server exposes at its root.
 */
function baseName(uri: string): string {
  const noQuery = uri.split(/[?#]/)[0] ?? uri;
  const parts = noQuery.split(/[/\\]+/);
  return parts[parts.length - 1] ?? noQuery;
}

/** Joins a dev origin and a file name into an absolute URL on that origin. */
function onOrigin(origin: string, fileName: string): string {
  return `${origin.replace(/\/+$/, "")}/${fileName.replace(/^\/+/, "")}`;
}

/**
 * Canonical artifact file names the dev server (`serve-package.mjs`) exposes at
 * the package root. `writeRealtimePackage` ALWAYS publishes the artifacts under
 * these names, regardless of the (local working) path the manifest stored for
 * each one. So the demo maps each artifact onto its canonical served name —
 * NOT the basename of the manifest's stored URI, which can differ (e.g. the
 * original variant is written from a work file named `chocolate-from-cacao.mp4`
 * but published as `original.mp4`).
 */
const ORIGINAL_FILE_NAME = "original.mp4" as const;
const TRANSCRIPT_FILE_NAME = "transcript.normalized.srt" as const;

/**
 * Rewrites a served schemaVersion-3 manifest so every URI the player fetches is
 * an absolute URL on the dev origin, pointing at the artifact's CANONICAL
 * served name.
 *
 * The pipeline writes the manifest's `original` variant URI and `transcriptUri`
 * as local working paths (e.g. a Windows path under `.e2e-out/work`). The
 * player, running in the WebView/web, cannot load those `file://` paths — that
 * is the `Not allowed to load local resource` error — and their basenames do
 * not necessarily match the published file names (that is the 404 on
 * `chocolate-from-cacao.mp4`). The dev server serves the original as
 * `original.mp4` and the transcript as `transcript.normalized.srt`, so we point
 * each URL at those canonical names. The `avatarRuntime.playerBundleUri` is
 * replaced with the locally bundled page (or the dev-served copy as fallback).
 */
export function adaptManifestForDevOrigin(
  manifest: TranslationManifest,
  origin: string,
  playerBundleUri: string,
): TranslationManifest {
  const variants = manifest.variants.map((variant): MediaVariant => ({
    ...variant,
    // The original variant is always published as `original.mp4`. Any other
    // (legacy) variant falls back to its stored basename.
    uri:
      variant.kind === "original"
        ? onOrigin(origin, ORIGINAL_FILE_NAME)
        : onOrigin(origin, baseName(variant.uri)),
  }));

  const avatarRuntime: AvatarRuntimeConfig | undefined =
    manifest.avatarRuntime === undefined
      ? undefined
      : { ...manifest.avatarRuntime, playerBundleUri };

  return {
    ...manifest,
    variants,
    transcriptUri: onOrigin(origin, TRANSCRIPT_FILE_NAME),
    ...(avatarRuntime !== undefined ? { avatarRuntime } : {}),
  };
}

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; manifest: TranslationManifest };

/**
 * Standalone demo: enter the dev origin (defaults to the local
 * `serve-package.mjs` server), fetch the manifest over HTTP, and mount the
 * player. All play/pause/seek/avatar-toggle/fallback controls live inside
 * `LibrasTranslationPlayer`; this screen only loads the manifest and lets you
 * reconfigure the origin/mediaId.
 */
export function DemoScreen(): ReactElement {
  const [origin, setOrigin] = useState<string>(DEV_PACKAGE_ORIGIN);
  const [mediaId, setMediaId] = useState<string>(DEFAULT_MEDIA_ID);
  // The origin/mediaId the player is actually mounted against. Decoupled from
  // the text fields so typing does not reload mid-edit; committed on blur.
  const [activeOrigin, setActiveOrigin] = useState<string>(DEV_PACKAGE_ORIGIN);
  const [activeMediaId, setActiveMediaId] = useState<string>(DEFAULT_MEDIA_ID);
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  // Avatar bundle URI: always use the copy served by `serve-package.mjs` under
  // `${origin}/vlibras/` in this dev demo.
  //
  // Why NOT the Metro-bundled asset (`resolveBundledPlayerUri`): the avatar
  // page (`index.html`) loads `vlibras-player.js` and `target/UnityLoader.js`
  // as plain static files via `<script src>`. Metro refuses to serve a `.js`
  // file as an ASSET ("'vlibras-player.js' cannot be loaded as its extension
  // is not registered in assetExts") because `.js` is source code to the
  // bundler — so routing the avatar through Metro breaks the player and the
  // app falls back to captions. The static package server serves every file
  // (html/js/unityweb) correctly, so we point the WebView at it directly.
  const playerBundleUri = useMemo(() => {
    const base = activeOrigin.replace(/\/+$/, "");
    return `${base}/vlibras/index.html`;
  }, [activeOrigin]);

  useEffect(() => {
    let cancelled = false;
    const manifestUrl = `${activeOrigin.replace(/\/+$/, "")}/manifest.json`;

    (async () => {
      setState({ phase: "loading" });
      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status} ao buscar o manifesto em ${manifestUrl}`,
          );
        }
        const raw = (await response.json()) as TranslationManifest;
        if (raw.schemaVersion !== 3) {
          throw new Error(
            `schemaVersion ${String(raw.schemaVersion)} inesperado; esperado 3.`,
          );
        }
        const manifest = adaptManifestForDevOrigin(
          raw,
          activeOrigin,
          playerBundleUri,
        );
        if (!cancelled) {
          setState({ phase: "ready", manifest });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : String(error);
          setState({ phase: "error", message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeOrigin, activeMediaId, playerBundleUri]);

  const commit = () => {
    setActiveOrigin(origin.trim());
    setActiveMediaId(mediaId.trim());
  };

  return (
    <View style={styles.root}>
      <View style={styles.config}>
        <Text style={styles.label}>Origem de dev (serve-package.mjs)</Text>
        <TextInput
          value={origin}
          onChangeText={setOrigin}
          onBlur={commit}
          onSubmitEditing={commit}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder={DEV_PACKAGE_ORIGIN}
          placeholderTextColor="#6b6f78"
          style={styles.input}
          accessibilityLabel="Origem do servidor de pacote em desenvolvimento"
        />
        <Text style={styles.label}>Media id</Text>
        <TextInput
          value={mediaId}
          onChangeText={setMediaId}
          onBlur={commit}
          onSubmitEditing={commit}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={DEFAULT_MEDIA_ID}
          placeholderTextColor="#6b6f78"
          style={styles.input}
          accessibilityLabel="Identificador da mídia"
        />
        <Text style={styles.hint}>
          Android emulador: use http://10.0.2.2:8787. Confirme com Enter ou ao
          sair do campo para recarregar.
        </Text>
      </View>

      <View style={styles.playerArea}>
        {state.phase === "loading" ? (
          <View style={styles.centered}>
            <ActivityIndicator accessibilityLabel="Carregando o manifesto" />
            <Text style={styles.message}>
              Carregando manifesto de {activeOrigin}…
            </Text>
          </View>
        ) : null}

        {state.phase === "error" ? (
          <ScrollView contentContainerStyle={styles.centered}>
            <Text style={styles.errorTitle} accessibilityRole="alert">
              Não foi possível carregar o pacote
            </Text>
            <Text style={styles.message}>{state.message}</Text>
            <Text style={styles.hint}>
              Gere o pacote (tarefa 11.1, precisa de ffmpeg) e rode{"\n"}
              `node apps/mobile/scripts/serve-package.mjs`. Confira a origem
              acima.
            </Text>
          </ScrollView>
        ) : null}

        {state.phase === "ready" ? (
          <LibrasTranslationPlayer
            // `mediaId` keys the player's internal load effect; remounting via
            // `key` when the active origin/mediaId changes guarantees a clean
            // reload against the new package.
            key={`${activeOrigin}|${activeMediaId}`}
            mediaId={activeMediaId}
            manifest={state.manifest}
            playerBundleUri={playerBundleUri}
            initialAutomaticAvatarEnabled={false}
            // Sign faster than real-time so the live avatar keeps closer to
            // the speech (the VLibras translate->gloss->animate pipeline lags).
            // 1 is normal; 5 is a fast speed-up (likely near the VLibras slider
            // maximum).
            avatarSpeed={5}
            onPlaybackError={(err) =>
              setState({ phase: "error", message: err.message })
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#101114",
  },
  config: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
    backgroundColor: "#15171c",
  },
  label: {
    color: "#b5b8c0",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    color: "#ffffff",
    backgroundColor: "#262a31",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  hint: {
    color: "#8a8e97",
    fontSize: 11,
    lineHeight: 15,
  },
  playerArea: {
    flex: 1,
  },
  centered: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  message: {
    color: "#d4d7dd",
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
