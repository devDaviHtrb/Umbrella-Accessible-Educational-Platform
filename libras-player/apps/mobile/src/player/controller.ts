// React Native player controller — live (v3) avatar architecture.
//
// Task 7.1 — reworks the `LibrasPlayerController` for the current design
// (ADR-002): the native video player ALWAYS plays the single `original`
// media/audio variant and is the master clock; the Libras avatar is a LIVE
// WebView overlay (vlibras-player-webjs) driven through an injected
// `AvatarBridge`. Enabling/disabling the avatar NEVER changes the video
// source, position or play/pause state — it only shows/hides the overlay and
// sends `init`/`stop` to the bridge.
//
// It underpins Requirements:
//   1.1  The native player plays the `original` variant as the active media.
//   1.2  A single media instance is audible at any time: the native player.
//        The avatar WebView never emits concurrent audio.
//   1.3  The native player is the master clock; the avatar never repositions
//        the video.
//   2.2  Enabling the avatar preserves the video position and play/pause state
//        and shows the overlay (via `init`).
//   2.3  Disabling the avatar preserves position and play/pause and stops the
//        overlay (via `stop`).
//   9.2  While the avatar is enabled the native player stays the master clock;
//        avatar animation never moves the video position.
//
// Design references: the `LibrasPlayerController` and `AvatarBridge`
// interfaces, the `switchAvatarMode` formal specification (video keeps
// position and play/pause; enabling shows the WebView, disabling sends
// `stop()`; audio only from the native player) and the extended
// `PlaybackSnapshot` (`avatarRuntimeState`, `activeCueId`) in design.md.
//
// The native player is abstracted behind the injectable `NativeMediaPlayer`
// interface so the controller stays unit-testable without React Native. The
// `AvatarBridge` and `CueScheduler` are likewise injectable (constructor or
// setter).
//
// Task 7.2 — wires the three collaborators together:
//   - the video position (fed by the component via `onProgress(positionMs)`)
//     drives the injected `CueScheduler` (`scheduler.update(positionMs)`);
//   - on each active-cue transition (`onCueChange`), when the avatar is
//     enabled and the runtime is available, the controller calls
//     `bridge.sendCue(cue.id, cue.textPtBr)` exactly once and records the
//     `activeCueId`; a `null` cue (speech gap) fires no translation;
//   - inbound bridge events (`onMessage`) map to the avatar runtime state
//     (`load`→ready, `gloss:start`→playing, `gloss:end`/`animation:end`→ready,
//     `error`→error + `handleAvatarRuntimeFailure` fallback);
//   - `pause`/`stop`/`setSpeed` are propagated to the bridge when enabled.
//
// The native video player stays the master clock throughout: the controller
// only READS the position handed to it and NEVER repositions the video from
// the avatar (Requirements 6.5, 9.1, 9.2).
//
// It additionally underpins Requirements:
//   6.1  `resolveCueAt` is fed with the native player position via `onProgress`.
//   7.5  `pause`/`stop`/`setSpeed` are forwarded to the WebView-hosted player.
//   9.1  Avatar×speech sync is approximate and video-driven; honest, never
//        frame-locked, and never moving the video.
//   9.3  The avatar reacts to the video clock; the video never reacts to it.

import type {
  AvatarBridge,
  AvatarRuntimeState,
  LibrasPlayerController as ILibrasPlayerController,
  MediaVariant,
  Milliseconds,
  PlaybackSnapshot,
  TranscriptCue,
  TranslationManifest,
  WebToAppMessage,
} from "@libras/pipeline/client";

import { handleAvatarRuntimeFailure } from "./avatarRuntimeFallback";
// Use the local, richer CueScheduler (with `update` + unsubscribe) from
// cueScheduler.ts rather than the minimal `@libras/pipeline` interface, which
// omits the `update` driver the controller needs.
import { createCueScheduler, type CueScheduler } from "./cueScheduler";

// --- Bridge capability shape ----------------------------------------------

/**
 * The controller consumes the shared {@link AvatarBridge} interface plus two
 * optional capabilities that the concrete `WebViewAvatarBridge` provides but
 * the minimal interface does not declare:
 *  - `setSpeed(speed)` — forward a playback-speed control (Requirement 7.5);
 *  - an `onMessage` that may return an unsubscribe function so the controller
 *    can detach cleanly on dispose / bridge swap.
 *
 * Both are treated as optional so a bare `AvatarBridge` implementation (e.g. a
 * test fake) keeps working: the controller feature-detects them at runtime.
 */
type ControllerAvatarBridge = AvatarBridge & {
  setSpeed?(speed: number): void;
  /**
   * Optional: clears the bridge's consecutive-duplicate cue guard so the next
   * `sendCue` fires even if it repeats the last cue id. The concrete
   * `WebViewAvatarBridge` provides it; a bare bridge/test fake may not.
   */
  resetCueDeduplication?(): void;
  onMessage(handler: (msg: WebToAppMessage) => void): void | (() => void);
};

// --- Native player boundary ----------------------------------------------

/**
 * Minimal, library-agnostic contract for the single native media player the
 * controller drives. A concrete React Native video component implements this
 * in a later step; tests implement it with an in-memory fake.
 *
 * Invariant upheld by the controller, not the player: only the `original`
 * source is ever loaded into this single instance, so at most one media stream
 * is audible (Requirement 1.2). The avatar WebView has no audio.
 */
export interface NativeMediaPlayer {
  /**
   * Point the player at a new source URI. Implementations should resolve once
   * the source is ready enough to accept `seek`/`play`. The controller only
   * ever points it at the `original` variant — the avatar is never a video
   * source.
   */
  setSource(uri: string): Promise<void>;
  /** Begin or resume playback of the currently loaded source. */
  play(): Promise<void>;
  /** Pause playback, keeping the current position. */
  pause(): Promise<void>;
  /** Seek the currently loaded source to an absolute position. */
  seek(positionMs: Milliseconds): Promise<void>;
  /** Current absolute playback position of the loaded source. */
  getPosition(): Milliseconds;
  /** Release native resources. Called when the controller is disposed. */
  release(): Promise<void>;
}

/** Error raised for controller misuse (e.g. operating before `load`). */
export class LibrasPlayerControllerError extends Error {
  public readonly code: LibrasPlayerControllerErrorCode;

  public constructor(code: LibrasPlayerControllerErrorCode, message: string) {
    super(message);
    this.name = "LibrasPlayerControllerError";
    this.code = code;
    Object.setPrototypeOf(this, LibrasPlayerControllerError.prototype);
  }
}

export type LibrasPlayerControllerErrorCode =
  "NOT_LOADED" | "NO_PLAYABLE_VARIANT";

// --- Variant selection ----------------------------------------------------

/**
 * Selects the single media source the native player uses: always the
 * `original` variant. The live avatar is a WebView overlay, never a video
 * source, so variant selection no longer depends on the avatar toggle
 * (Requirements 1.1, 1.2).
 *
 * Returns `undefined` only when the manifest has no original variant, which a
 * valid package should never produce; callers treat that as a hard error.
 */
export function selectVariant(
  manifest: TranslationManifest,
): MediaVariant | undefined {
  return findVariant(manifest, "original");
}

/** Finds the first variant of a given kind, if present. */
function findVariant(
  manifest: TranslationManifest,
  kind: MediaVariant["kind"],
): MediaVariant | undefined {
  return manifest.variants.find((variant) => variant.kind === kind);
}

/**
 * Whether the manifest can actually show the live avatar: it must declare
 * availability AND carry a live-avatar runtime configuration (v3
 * `avatarRuntime`). Used for the `automaticAvatarAvailable` snapshot flag and
 * to gate `setAutomaticAvatar`. A v2 (legacy) manifest without `avatarRuntime`
 * reports the avatar as unavailable — the live path needs the runtime config
 * (Requirements 12.2, 12.4).
 */
export function isAvatarAvailable(manifest: TranslationManifest): boolean {
  return manifest.avatarAvailable && manifest.avatarRuntime !== undefined;
}

// --- Controller -----------------------------------------------------------

/** Internal loaded state; absent until `load` resolves. */
type LoadedState = {
  manifest: TranslationManifest;
  /** Always the `original` variant — the single media/audio source. */
  current: MediaVariant;
  /** Whether the user enabled the live avatar overlay. */
  avatarEnabled: boolean;
  isPlaying: boolean;
  /** Live avatar runtime state surfaced in the snapshot. */
  avatarRuntimeState: AvatarRuntimeState;
  /** Id of the cue currently active per the video master clock. */
  activeCueId: string | null;
  /**
   * Set once the WebView reports a runtime `error`: the live avatar is no
   * longer available for this session even though the manifest still declares
   * a runtime config, so the snapshot must report it unavailable and the UI
   * must fall back to captions (Requirements 7.4, 8.4, 13.2).
   */
  avatarRuntimeFailed: boolean;
};

/** Options for {@link LibrasPlayerController}. */
export type LibrasPlayerControllerOptions = Readonly<{
  /**
   * Live-avatar bridge (app ⇄ WebView). Injected here or wired later via
   * {@link LibrasPlayerController.setAvatarBridge}. When present,
   * `setAutomaticAvatar(true)` sends `init(avatarRuntime)` and
   * `setAutomaticAvatar(false)` sends `stop()`.
   */
  bridge?: AvatarBridge;
  /**
   * Cue scheduler driven by the native video clock. Injected here or wired
   * later via {@link LibrasPlayerController.setCueScheduler} /
   * {@link LibrasPlayerController.setCues}. When present, `onProgress` feeds it
   * the current video position and its `onCueChange` transitions drive
   * `bridge.sendCue` and `activeCueId`.
   */
  scheduler?: CueScheduler;
  /**
   * Normalized SRT cues. A convenience alternative to {@link scheduler}: when
   * provided without a scheduler, the controller builds a
   * {@link createCueScheduler} over these cues. Ignored when `scheduler` is
   * also given.
   */
  cues?: readonly TranscriptCue[];
  /**
   * Speed propagated to the live avatar when it is enabled. Defaults to the
   * manifest's `avatarRuntime.defaultSpeed`. Can be changed at runtime via
   * {@link LibrasPlayerController.setAvatarSpeed}.
   */
  avatarSpeed?: number;
}>;

/**
 * Drives a single {@link NativeMediaPlayer} to satisfy the
 * {@link ILibrasPlayerController} contract for the live-avatar architecture.
 *
 * The native player always plays the `original` variant (sole media/audio
 * source). Enabling/disabling the avatar toggles the WebView overlay through
 * the injected {@link AvatarBridge} (`init`/`stop`) WITHOUT touching the video
 * source, position or play/pause state. The controller keeps the authoritative
 * play/pause, avatar-enabled, runtime-state and active-cue state and derives a
 * {@link PlaybackSnapshot} on demand.
 */
export class LibrasPlayerController implements ILibrasPlayerController {
  readonly #player: NativeMediaPlayer;
  #bridge: ControllerAvatarBridge | undefined;
  #scheduler: CueScheduler | undefined;
  #state: LoadedState | undefined;

  /** Speed sent to the avatar when enabled; defaults to the runtime config. */
  #avatarSpeed: number | undefined;

  /** Unsubscribes the active `scheduler.onCueChange` subscription, if any. */
  #cueUnsubscribe: (() => void) | undefined;

  /** Tears down the active `bridge.onMessage` subscription, if any. */
  #bridgeUnsubscribe: (() => void) | undefined;

  /**
   * The cue currently active per the video master clock (full cue, not just
   * its id). Kept so that when the avatar becomes ready (`load`) mid-cue we can
   * (re)send the active cue: cues that transition WHILE the Unity player is
   * still loading are otherwise lost, leaving the first sentences untranslated.
   */
  #activeCue: TranscriptCue | null = null;

  public constructor(
    player: NativeMediaPlayer,
    options: LibrasPlayerControllerOptions = {},
  ) {
    this.#player = player;
    this.#avatarSpeed = options.avatarSpeed;
    // Derive a scheduler from `cues` when no explicit scheduler is injected.
    const scheduler =
      options.scheduler ??
      (options.cues !== undefined
        ? createCueScheduler(options.cues)
        : undefined);
    // Wire the bridge first so `subscribeToBridge` has it, then the scheduler.
    this.setAvatarBridge(options.bridge);
    this.setCueScheduler(scheduler);
  }

  /**
   * Injects (or replaces) the live-avatar bridge after construction. Lets the
   * component wire the WebView-backed bridge once the WebView is mounted,
   * without reconstructing the controller. Subscribes to the bridge's inbound
   * messages so WebView events update the avatar runtime state and trigger the
   * fallback on error.
   */
  public setAvatarBridge(bridge: AvatarBridge | undefined): void {
    // Drop any previous subscription before swapping the bridge.
    this.#bridgeUnsubscribe?.();
    this.#bridgeUnsubscribe = undefined;
    this.#bridge = bridge as ControllerAvatarBridge | undefined;
    if (this.#bridge !== undefined) {
      this.#subscribeToBridge(this.#bridge);
    }
  }

  /** The currently injected avatar bridge, if any. */
  public get avatarBridge(): AvatarBridge | undefined {
    return this.#bridge;
  }

  /**
   * Injects (or replaces) the cue scheduler. Subscribes to its `onCueChange`
   * so transitions fire `bridge.sendCue` (when the avatar is enabled) and
   * record the active cue. The scheduler is only ever READ positions via
   * {@link onProgress}; it never moves the video (Requirement 6.5).
   */
  public setCueScheduler(scheduler: CueScheduler | undefined): void {
    this.#cueUnsubscribe?.();
    this.#cueUnsubscribe = undefined;
    this.#scheduler = scheduler;
    if (scheduler !== undefined) {
      this.#cueUnsubscribe = scheduler.onCueChange((cue) => {
        this.#handleCueChange(cue);
      });
    }
  }

  /** The currently injected cue scheduler, if any. */
  public get cueScheduler(): CueScheduler | undefined {
    return this.#scheduler;
  }

  /**
   * Convenience setter that builds a {@link createCueScheduler} over the given
   * normalized SRT cues and injects it (replacing any existing scheduler).
   */
  public setCues(cues: readonly TranscriptCue[]): void {
    this.setCueScheduler(createCueScheduler(cues));
  }

  /**
   * Feeds the native video position (the master clock) to the cue scheduler.
   * The component calls this from the native player's progress/seek callbacks.
   * It recomputes the active cue and, on a transition, the scheduler invokes
   * the wired `onCueChange` handler. This NEVER writes the video position back
   * (Requirements 6.1, 6.5, 9.1, 9.2).
   */
  public onProgress(positionMs: Milliseconds): void {
    this.#scheduler?.update(positionMs);
  }

  /**
   * Updates the speed propagated to the live avatar and, when the avatar is
   * enabled and a bridge is present, forwards it immediately via
   * `bridge.setSpeed` (Requirement 7.5). No effect on the native video.
   */
  public setAvatarSpeed(speed: number): void {
    this.#avatarSpeed = speed;
    const state = this.#state;
    if (
      state?.avatarEnabled === true &&
      this.#bridge !== undefined &&
      typeof this.#bridge.setSpeed === "function"
    ) {
      this.#bridge.setSpeed(speed);
    }
  }

  /**
   * Load a manifest and prepare the single `original` media source. Accepts
   * both v2 (legacy) and v3 manifests: it always selects the `original`
   * variant and never points the player at an avatar source. The live avatar
   * is considered available only when the manifest declares `avatarAvailable`
   * and carries an `avatarRuntime` (v3). Playback starts paused at position 0
   * with the avatar disabled; callers enable it explicitly via
   * {@link setAutomaticAvatar} once the WebView/bridge is ready.
   */
  public async load(manifest: TranslationManifest): Promise<void> {
    const variant = selectVariant(manifest);
    if (variant === undefined) {
      throw new LibrasPlayerControllerError(
        "NO_PLAYABLE_VARIANT",
        "Manifesto não contém variante original reproduzível.",
      );
    }

    await this.#player.setSource(variant.uri);
    await this.#player.seek(0);

    this.#state = {
      manifest,
      current: variant,
      avatarEnabled: false,
      isPlaying: false,
      // The live avatar is idle until a bridge reports otherwise; `idle` when
      // available, `error`/unavailable manifests still read `idle` here since
      // nothing has been attempted yet.
      avatarRuntimeState: "idle",
      activeCueId: null,
      avatarRuntimeFailed: false,
    };
  }

  public async play(): Promise<void> {
    const state = this.#requireLoaded();
    await this.#player.play();
    state.isPlaying = true;
  }

  public async pause(): Promise<void> {
    const state = this.#requireLoaded();
    await this.#player.pause();
    state.isPlaying = false;
    // Keep the live avatar coherent with the video: pausing the master clock
    // pauses the overlay. This never moves the video.
    if (state.avatarEnabled && this.#bridge !== undefined) {
      this.#bridge.pause();
    }
  }

  public async seek(positionMs: Milliseconds): Promise<void> {
    const state = this.#requireLoaded();
    await this.#player.seek(clampPosition(positionMs, state.manifest));
    // The CueScheduler (wired in task 7.2) re-resolves the active cue from the
    // new position; the controller never derives video position from the
    // avatar (Requirements 6.5, 9.2).
  }

  /**
   * Enable or disable the live avatar overlay WITHOUT touching the video.
   *
   * Enabling shows the WebView overlay and sends `init(avatarRuntime)` to the
   * bridge; disabling sends `stop()` and hides the overlay. In BOTH cases the
   * native player's source, position and play/pause state are preserved — the
   * video is the master clock and the avatar never moves it (Requirements 2.2,
   * 2.3, 9.2). Audio always comes from the native player; the avatar WebView
   * has no audio (Requirement 1.2).
   *
   * Enabling an avatar the manifest does not provide (no `avatarRuntime`, or
   * `avatarAvailable === false`) is a no-op: the player stays on the original
   * with captions and the enabled flag stays false (Requirement 2.5).
   */
  public async setAutomaticAvatar(enabled: boolean): Promise<void> {
    const state = this.#requireLoaded();
    const available = isAvatarAvailable(state.manifest);
    const effectiveEnabled = enabled && available;

    // Do not touch the native player at all: no setSource, no seek, no
    // play/pause. The video keeps its exact position and play/pause state.
    if (effectiveEnabled) {
      state.avatarEnabled = true;
      state.avatarRuntimeState = "loading";
      // A fresh enable clears a prior runtime failure so the user can retry.
      state.avatarRuntimeFailed = false;
      // `avatarRuntime` is guaranteed present when `available` is true.
      const runtime = state.manifest.avatarRuntime;
      if (this.#bridge !== undefined && runtime !== undefined) {
        this.#bridge.init(runtime);
        // Propagate the configured playback speed to the avatar. Prefer an
        // explicitly set speed, then the runtime default (Requirement 7.5).
        const speed = this.#avatarSpeed ?? runtime.defaultSpeed;
        if (
          typeof speed === "number" &&
          Number.isFinite(speed) &&
          typeof this.#bridge.setSpeed === "function"
        ) {
          this.#bridge.setSpeed(speed);
        }
      }
    } else {
      // Disable (or a no-op enable with no runtime): stop the overlay and mark
      // the avatar idle. When the manifest never had an avatar, `avatarEnabled`
      // was already false and this stays a clean no-op beyond the stop signal.
      const wasEnabled = state.avatarEnabled;
      state.avatarEnabled = false;
      state.avatarRuntimeState = "idle";
      if (wasEnabled && this.#bridge !== undefined) {
        this.#bridge.stop();
      }
    }
  }

  /**
   * Updates the live-avatar runtime state surfaced in the snapshot (e.g. from
   * bridge `load`/`gloss:*`/`error` events wired in task 7.2). Pure state
   * bookkeeping — it never touches the native player.
   */
  public setAvatarRuntimeState(runtimeState: AvatarRuntimeState): void {
    const state = this.#requireLoaded();
    state.avatarRuntimeState = runtimeState;
  }

  /**
   * Records the active cue id resolved by the CueScheduler from the video
   * master clock, for the snapshot's `activeCueId`. Pure bookkeeping: the
   * controller never derives the video position from the cue (Requirement 9.2).
   */
  public setActiveCueId(cueId: string | null): void {
    const state = this.#requireLoaded();
    state.activeCueId = cueId;
  }

  public getSnapshot(): PlaybackSnapshot {
    const state = this.#requireLoaded();
    // The avatar is available only when the manifest declares it AND the live
    // runtime has not failed this session (a WebView error drops it to the
    // captions fallback — Requirements 7.4, 8.4, 13.2).
    const avatarAvailable =
      isAvatarAvailable(state.manifest) && !state.avatarRuntimeFailed;
    return {
      mediaId: state.manifest.mediaId,
      positionMs: this.#player.getPosition(),
      durationMs: state.manifest.durationMs,
      isPlaying: state.isPlaying,
      isBuffering: false,
      automaticAvatarEnabled: state.avatarEnabled && avatarAvailable,
      automaticAvatarAvailable: avatarAvailable,
      avatarRuntimeState: state.avatarRuntimeState,
      activeCueId: state.activeCueId,
    };
  }

  /** Release the underlying native player and drop loaded state. */
  public async dispose(): Promise<void> {
    const state = this.#state;
    this.#state = undefined;
    // Detach scheduler and bridge subscriptions so no late callback mutates a
    // disposed controller.
    this.#cueUnsubscribe?.();
    this.#cueUnsubscribe = undefined;
    this.#bridgeUnsubscribe?.();
    this.#bridgeUnsubscribe = undefined;
    // Best-effort: stop a running overlay so it does not linger after dispose.
    if (state?.avatarEnabled && this.#bridge !== undefined) {
      try {
        this.#bridge.stop();
      } catch {
        // Disposing: swallow bridge errors so release always runs.
      }
    }
    await this.#player.release();
  }

  /**
   * Handles a cue transition emitted by the scheduler from the video clock.
   *
   * Records the active cue id for the snapshot (always, so captions/affordances
   * track the video even when the avatar is off), and — only when the avatar is
   * enabled, available and a bridge is present — fires exactly one
   * `bridge.sendCue(cue.id, cue.textPtBr)`. A `null` cue (speech gap) records
   * `null` and fires no translation (Requirements 6.3, 7.5). The scheduler
   * already guarantees one call per transition; the bridge de-dupes defensively.
   */
  #handleCueChange(cue: TranscriptCue | null): void {
    const state = this.#state;
    if (state === undefined) {
      // No manifest loaded yet: nothing to track or fire.
      return;
    }

    // Record the active cue id regardless of avatar state (pure bookkeeping;
    // never moves the video — Requirement 9.2).
    state.activeCueId = cue?.id ?? null;
    this.#activeCue = cue;

    if (cue === null) {
      // Speech gap: no translation is fired; the avatar stays in its prior
      // pose/state (Requirement 6.3).
      return;
    }

    const available = isAvatarAvailable(state.manifest);
    if (state.avatarEnabled && available && this.#bridge !== undefined) {
      // Exactly one sendCue per active-cue transition while enabled.
      this.#bridge.sendCue(cue.id, cue.textPtBr);
    }
  }

  /**
   * Subscribes to the bridge's inbound WebView messages and maps them onto the
   * avatar runtime state surfaced in the snapshot, driving the fallback on
   * error. The video clock is never touched here (Requirements 7.4, 9.2).
   */
  #subscribeToBridge(bridge: ControllerAvatarBridge): void {
    const maybeUnsub = bridge.onMessage((msg) => {
      this.#handleBridgeMessage(msg);
    });
    // The concrete WebViewAvatarBridge returns an unsubscribe; the minimal
    // interface returns void. Keep whichever we got so we can detach cleanly.
    if (typeof maybeUnsub === "function") {
      this.#bridgeUnsubscribe = maybeUnsub;
    }
  }

  /**
   * Maps a single inbound {@link WebToAppMessage} to an avatar runtime-state
   * transition (and the error fallback). Ignored silently when no manifest is
   * loaded. Never repositions the video.
   */
  #handleBridgeMessage(msg: WebToAppMessage): void {
    const state = this.#state;
    if (state === undefined) {
      return;
    }
    switch (msg.type) {
      case "load": {
        // Player bundle loaded and ready to translate.
        state.avatarRuntimeState = "ready";
        if (state.avatarEnabled && this.#bridge !== undefined) {
          // Re-apply the configured speed NOW that the Unity player is ready.
          // A `setSpeed` sent earlier (right after `init`, while the avatar was
          // still loading) is dropped by the engine, so the avatar would sign
          // at its default speed. Sending it on `load` makes the speed actually
          // take effect (Requirement 7.5).
          const runtime = state.manifest.avatarRuntime;
          const speed = this.#avatarSpeed ?? runtime?.defaultSpeed;
          if (
            typeof speed === "number" &&
            Number.isFinite(speed) &&
            typeof this.#bridge.setSpeed === "function"
          ) {
            this.#bridge.setSpeed(speed);
          }
          // Re-send the cue that is active right now, but ONLY if the video is
          // actually playing. Cues that transitioned while the avatar was still
          // loading were sent to a not-yet-ready engine and dropped, so the
          // opening sentences never got signed; replaying the current cue on
          // `load` recovers them. We gate on `isPlaying` so enabling the avatar
          // while paused (e.g. at position 0 before pressing play) does NOT
          // make the avatar translate the first caption prematurely — the cue
          // will fire normally once playback reaches it. Clear the duplicate
          // guard first, since this same cue id may already have been sent (and
          // dropped) during loading.
          if (state.isPlaying && this.#activeCue !== null) {
            if (typeof this.#bridge.resetCueDeduplication === "function") {
              this.#bridge.resetCueDeduplication();
            }
            this.#bridge.sendCue(
              this.#activeCue.id,
              this.#activeCue.textPtBr,
            );
          }
        }
        break;
      }
      case "gloss:start":
        state.avatarRuntimeState = "playing";
        break;
      case "gloss:end":
      case "animation:end":
        // Finished the current gloss/animation: back to ready/idle-ready.
        state.avatarRuntimeState = "ready";
        break;
      case "animation:progress":
        // Progress ticks do not change the coarse runtime state.
        break;
      case "error": {
        // A WebView/runtime error is avatar unavailability, never a video
        // interruption: mark error and disable the avatar WITHOUT touching the
        // native player (video + audio keep playing). The `avatarRuntimeFailed`
        // flag makes the snapshot report the avatar unavailable so the UI falls
        // back to SRT captions (Requirements 7.4, 8.4, 8.5, 13.2).
        state.avatarRuntimeState = "error";
        state.avatarEnabled = false;
        state.avatarRuntimeFailed = true;
        // `handleAvatarRuntimeFailure` is the design's pure fallback: run it on
        // the current snapshot so its postconditions (video/audio preserved,
        // avatar unavailable, captions shown) are the source of truth, then
        // mirror the avatar flags back onto our state. Position and play/pause
        // come straight from the preserved snapshot — the video is untouched.
        handleAvatarRuntimeFailure(this.getSnapshot(), msg);
        break;
      }
      default:
        break;
    }
  }

  #requireLoaded(): LoadedState {
    if (this.#state === undefined) {
      throw new LibrasPlayerControllerError(
        "NOT_LOADED",
        "Controller não carregou um manifesto; chame load() primeiro.",
      );
    }
    return this.#state;
  }
}

/** Clamps a seek position into `[0, durationMs]`. */
function clampPosition(
  positionMs: Milliseconds,
  manifest: TranslationManifest,
): Milliseconds {
  if (!Number.isFinite(positionMs) || positionMs < 0) {
    return 0;
  }
  if (positionMs > manifest.durationMs) {
    return manifest.durationMs;
  }
  return positionMs;
}

/** Convenience factory returning the shared controller interface type. */
export function createLibrasPlayerController(
  player: NativeMediaPlayer,
  options?: LibrasPlayerControllerOptions,
): ILibrasPlayerController {
  return new LibrasPlayerController(player, options);
}
