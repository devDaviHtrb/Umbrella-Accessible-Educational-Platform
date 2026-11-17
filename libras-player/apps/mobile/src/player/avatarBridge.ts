// AvatarBridge — app ⇄ WebView serialization for the live (v3) avatar.
//
// Task 6.1 — implements the `AvatarBridge` contract from design.md
// (`init` / `sendCue` / `pause` / `stop` / `onMessage`, plus the optional
// `setSpeed` / `changeAvatar` controls) by serializing `AppToWebMessage`
// through a WebView transport's `postMessage` and deserializing inbound
// `WebToAppMessage` payloads.
//
// It underpins Requirements:
//   7.1  When the avatar is enabled, each active-cue transition fires exactly
//        one `sendCue` carrying the timed cue text.
//   7.2  Avatar firing stays decoupled from the native video clock: the bridge
//        only forwards messages — it never moves the video.
//   7.3  WebView events (`load`, `gloss:*`, `animation:*`, `error`) are surfaced
//        to the app through `onMessage` handlers.
//   7.5  Control messages (`pause` / `stop` / `setSpeed` / `changeAvatar`) are
//        forwarded to the WebView-hosted player.
//   6.2  Cue text is derived solely from timed cues of the normalized SRT; the
//        bridge refuses to emit a cue with empty text.
//
// --- "Exactly one sendCue per cue transition" ----------------------------
//
// The *authoritative* guarantee that exactly one translation fires per active
// cue transition comes from the caller (the controller, task 7.2): it only
// calls `sendCue` from the CueScheduler's `onCueChange` callback, which emits
// a transition only when the active cue actually changes (see cueScheduler.ts).
// This bridge does NOT drive itself from the video clock.
//
// As a defensive, local safeguard the bridge additionally de-duplicates
// *consecutive identical* cue ids: if `sendCue` is called twice in a row with
// the same `cueId` (without an intervening cue, `stop` or `init`) the repeat is
// ignored, so an accidental double call can never produce two `translate`
// messages for the same cue. Distinct cue ids (including a return to a prior
// cue after a different one) always fire.
//
// Design references: the `AvatarBridge` interface and the
// `scheduleAvatarFromPlayback` postconditions ("a cada mudança de cue ativo,
// e somente nela, `bridge.sendCue` é chamado uma vez"; "em intervalo sem fala,
// nenhuma nova tradução é disparada").

import type {
  AppToWebMessage,
  AvatarRuntimeConfig,
  AvatarBridge,
  WebToAppMessage,
} from "@libras/pipeline/client";

// --- Transport abstraction ------------------------------------------------

/**
 * Minimal outbound transport the bridge writes to. In the app this is backed
 * by the `react-native-webview` ref (`webViewRef.current.postMessage`), but the
 * bridge only depends on this structural shape so it stays decoupled from
 * `react-native-webview` and is trivially testable.
 */
export interface WebViewTransport {
  /** Sends an already-serialized JSON payload to the WebView. */
  postMessage(json: string): void;
}

/** A listener notified for every successfully deserialized inbound message. */
export type WebToAppMessageHandler = (msg: WebToAppMessage) => void;

/** Unsubscribe function returned by `onMessage`. */
export type Unsubscribe = () => void;

/**
 * Sink for malformed inbound payloads. Defaults to `console.warn`; injectable
 * so tests can assert on logging without touching the console.
 */
export type MalformedMessageLogger = (reason: string, rawData: string) => void;

/** Options for {@link createWebViewAvatarBridge}. */
export interface WebViewAvatarBridgeOptions {
  /**
   * Called when inbound data cannot be parsed as a `WebToAppMessage`. The
   * bridge never throws on malformed input; it logs and drops the message.
   */
  onMalformedMessage?: MalformedMessageLogger;
}

// --- Bridge implementation ------------------------------------------------

/**
 * WebView-backed {@link AvatarBridge}.
 *
 * Serializes `AppToWebMessage` with `JSON.stringify` and forwards it through
 * the injected {@link WebViewTransport}. Inbound WebView data is fed back via
 * {@link WebViewAvatarBridge.receive} and deserialized defensively: a malformed
 * payload is logged and dropped, never thrown, so a misbehaving WebView cannot
 * crash the player.
 */
export class WebViewAvatarBridge implements AvatarBridge {
  private readonly transport: WebViewTransport;

  private readonly handlers = new Set<WebToAppMessageHandler>();

  private readonly logMalformed: MalformedMessageLogger;

  /**
   * Last cue id handed to `sendCue` since the most recent `init`/`stop` (or
   * since construction). Used to drop consecutive duplicate cue sends.
   */
  private lastSentCueId: string | null = null;

  constructor(transport: WebViewTransport, options: WebViewAvatarBridgeOptions = {}) {
    this.transport = transport;
    this.logMalformed =
      options.onMalformedMessage ??
      ((reason, rawData) => {
        // Keep the raw payload out of structured fields; it is untrusted.
        console.warn(`[AvatarBridge] dropping malformed WebView message: ${reason}`, rawData);
      });
  }

  /** Sends `{ type: "init", config }` and resets duplicate-cue tracking. */
  init(config: AvatarRuntimeConfig): void {
    this.lastSentCueId = null;
    this.send({ type: "init", config });
  }

  /**
   * Sends `{ type: "cue", cueId, text }` for a cue transition.
   *
   * No message is sent when `text` is empty/whitespace-only (a speech gap or a
   * blank cue must not trigger a translation), nor when `cueId` repeats the
   * immediately previous cue id (consecutive-duplicate guard). Any other cue id
   * — including a return to an earlier cue — fires.
   */
  sendCue(cueId: string, text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      // Empty/whitespace cue text: never emit a translation (Requirement 6.2).
      return;
    }
    if (cueId === this.lastSentCueId) {
      // Consecutive identical cue id: ignore the repeat so a transition can
      // never fire twice for the same active cue.
      return;
    }
    this.lastSentCueId = cueId;
    this.send({ type: "cue", cueId, text });
  }

  /** Sends `{ type: "pause" }`. */
  pause(): void {
    this.send({ type: "pause" });
  }

  /** Sends `{ type: "stop" }` and resets duplicate-cue tracking. */
  stop(): void {
    // After a stop the next cue (even with the same id) is a fresh transition.
    this.lastSentCueId = null;
    this.send({ type: "stop" });
  }

  /** Sends `{ type: "setSpeed", speed }`. */
  setSpeed(speed: number): void {
    this.send({ type: "setSpeed", speed });
  }

  /**
   * Clears the consecutive-duplicate cue guard so the very next `sendCue`
   * fires even if it repeats the last cue id. Used to replay the active cue
   * once the avatar finishes loading (cues sent while the engine was still
   * loading are dropped by it, so replaying the same id must be allowed).
   */
  resetCueDeduplication(): void {
    this.lastSentCueId = null;
  }

  /** Sends `{ type: "changeAvatar", name }`. */
  changeAvatar(name: string): void {
    this.send({ type: "changeAvatar", name });
  }

  /**
   * Registers an inbound-message listener and returns an unsubscribe function.
   * Handlers are invoked for every successfully deserialized `WebToAppMessage`.
   */
  onMessage(handler: WebToAppMessageHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Feeds a raw inbound payload (e.g. the `event.nativeEvent.data` string from
   * `react-native-webview`'s `onMessage`) into the bridge. Performs a safe
   * `JSON.parse` + shape check and dispatches a valid `WebToAppMessage` to all
   * listeners. Malformed input is logged and dropped — never thrown.
   */
  receive(rawData: string): void {
    const message = this.parse(rawData);
    if (message === null) {
      return;
    }
    // Copy so an unsubscribe during dispatch does not skip a handler.
    for (const handler of [...this.handlers]) {
      handler(message);
    }
  }

  private send(message: AppToWebMessage): void {
    this.transport.postMessage(JSON.stringify(message));
  }

  private parse(rawData: string): WebToAppMessage | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch (error) {
      this.logMalformed(
        error instanceof Error ? error.message : "invalid JSON",
        rawData,
      );
      return null;
    }
    if (!isWebToAppMessage(parsed)) {
      this.logMalformed("payload is not a WebToAppMessage", rawData);
      return null;
    }
    return parsed;
  }
}

/**
 * Convenience factory mirroring the repository's `create*` naming.
 */
export function createWebViewAvatarBridge(
  transport: WebViewTransport,
  options?: WebViewAvatarBridgeOptions,
): WebViewAvatarBridge {
  return new WebViewAvatarBridge(transport, options);
}

// --- Inbound validation ---------------------------------------------------

/**
 * Structural type-guard for inbound `WebToAppMessage` payloads. Validates the
 * discriminant `type` and the fields each variant requires so that a malformed
 * or partial payload is rejected rather than forwarded to handlers.
 */
export function isWebToAppMessage(value: unknown): value is WebToAppMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  switch (record.type) {
    case "load":
      return true;
    case "gloss:start":
    case "gloss:end":
    case "animation:end":
      return typeof record.cueId === "string";
    case "animation:progress":
      return typeof record.value === "number" && Number.isFinite(record.value);
    case "error":
      return typeof record.code === "string" && typeof record.message === "string";
    default:
      return false;
  }
}
