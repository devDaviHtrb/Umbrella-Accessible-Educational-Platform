// Avatar runtime policy — offline/service-unavailability detection, the live
// avatar origin allowlist, and the WebView load-timeout watchdog.
//
// Task 12.1 — consolidates the app-side runtime policy for the live (v3)
// avatar rendered by `vlibras-player-webjs` inside the WebView, as pure,
// injectable, framework-free utilities so they are trivially testable without
// real timers or a real WebView. The component (task 8.1) and the controller
// (task 7.x) consume these; this module does NOT rewrite either of them.
//
// It underpins Requirements:
//   8.3   While the avatar is enabled it consumes the online VLibras services;
//         when they are unavailable the app must detect it and degrade.
//   8.4   Online-service unavailability / offline device degrades to the
//         fallback (video + captions) and informs that the avatar is
//         unavailable — via {@link handleAvatarRuntimeFailure} from
//         `avatarRuntimeFallback.ts`.
//   13.2  WebView / online-service failure keeps a playable video + captions
//         experience without interrupting playback.
//   13.3  While in fallback the app shows SRT captions and informs the avatar
//         is unavailable.
//   15.2  The WebView loads only allowlisted origins and never discovers or
//         calls private/undocumented endpoints.
//   15.3  The hosted "VLibras Vídeo" service is never automated; its host is
//         hard-denied here too.
//   15.5  During playback the only communication with the player is sending
//         cue text — inferred endpoints are refused.
//   17.1  Only the necessary cue text is sent to the online services.
//   17.2  The WebView loads resources only over HTTPS (local file:// bundle
//         aside) and under an origin allowlist.
//   17.4  Data minimization: nothing beyond the cue text is sent.
//
// --- Data minimization / communication boundary (Req 15.5, 17.1, 17.2, 17.4)
//
// Communication with the avatar is restricted to sending *cue text*. That
// boundary is already structurally enforced by the AvatarBridge
// (`avatarBridge.ts`): the only payload-bearing app→web message is
// `{ type: "cue", cueId, text }`, whose `text` is derived solely from timed
// cues of the normalized SRT. This module adds no new outbound channel; it
// only (a) validates the origins the WebView is allowed to load, and (b) maps
// runtime failures to a standardized error so the controller/component can
// trigger the fallback. No cue text, media, or device data is ever sent to any
// endpoint by the utilities here.

import type { WebToAppMessage } from "@libras/pipeline/client";

// --- Standardized runtime error codes ------------------------------------

/**
 * Runtime error codes for the live (v3) avatar, mirroring the `RuntimeErrorCode`
 * union in design.md ("Error Handling"). Used as the `code` of a synthetic
 * `WebToAppMessage` error so the controller/component can treat every avatar
 * failure uniformly and fall back to video + captions.
 */
export type RuntimeErrorCode =
  | "INVALID_SRT"
  | "DURATION_MISMATCH"
  | "WEBVIEW_LOAD_FAILED"
  | "WEBVIEW_LOAD_TIMEOUT"
  | "VLIBRAS_PLAYER_ERROR"
  | "TRANSLATION_SERVICE_UNAVAILABLE"
  | "DICTIONARY_FETCH_FAILED"
  | "NETWORK_OFFLINE"
  | "ASSET_INTEGRITY_FAILED";

/** The `error` variant of {@link WebToAppMessage}. */
export type AvatarErrorMessage = WebToAppMessage & { type: "error" };

/**
 * A runtime failure cause, decoupled from any transport. The
 * controller/component classifies what happened (the WebView emitted an error,
 * an online service answered with an HTTP error, a request timed out, or the
 * device is offline) and {@link mapCauseToErrorMessage} turns it into a
 * standardized {@link AvatarErrorMessage}.
 */
export type AvatarFailureCause =
  | Readonly<{ kind: "webview-load-failed"; detail?: string }>
  | Readonly<{ kind: "webview-load-timeout"; timeoutMs: number }>
  | Readonly<{ kind: "player-error"; detail?: string }>
  | Readonly<{ kind: "http-error"; service: "translation" | "dictionary"; status?: number }>
  | Readonly<{ kind: "timeout"; detail?: string }>
  | Readonly<{ kind: "offline" }>;

// --- Cause → standardized error mapping ----------------------------------

/**
 * Maps a {@link AvatarFailureCause} to a standardized `WebToAppMessage` error
 * (`{ type: "error", code, message }`). This is the single place that assigns a
 * {@link RuntimeErrorCode} per cause so callers can feed the result straight
 * into the bridge's inbound path / `handleAvatarRuntimeFailure` and trigger the
 * video + captions fallback.
 *
 * Pure: it never throws, performs no I/O, and does not mutate its input.
 */
export function mapCauseToErrorMessage(cause: AvatarFailureCause): AvatarErrorMessage {
  switch (cause.kind) {
    case "webview-load-failed":
      return {
        type: "error",
        code: "WEBVIEW_LOAD_FAILED",
        message:
          cause.detail && cause.detail.length > 0
            ? `Falha ao carregar a WebView do avatar: ${cause.detail}`
            : "Falha ao carregar a WebView do avatar.",
      };
    case "webview-load-timeout":
      return {
        type: "error",
        code: "WEBVIEW_LOAD_TIMEOUT",
        message:
          `A WebView do avatar não emitiu "load" em ${cause.timeoutMs} ms; ` +
          `tratando o avatar como indisponível.`,
      };
    case "player-error":
      return {
        type: "error",
        code: "VLIBRAS_PLAYER_ERROR",
        message:
          cause.detail && cause.detail.length > 0
            ? `Erro do player VLibras: ${cause.detail}`
            : "Erro do player VLibras.",
      };
    case "http-error": {
      const code: RuntimeErrorCode =
        cause.service === "dictionary"
          ? "DICTIONARY_FETCH_FAILED"
          : "TRANSLATION_SERVICE_UNAVAILABLE";
      const status = typeof cause.status === "number" ? ` (HTTP ${cause.status})` : "";
      const service =
        cause.service === "dictionary"
          ? "dicionário de sinais"
          : "serviço de tradução texto→glosa";
      return {
        type: "error",
        code,
        message: `Indisponibilidade do ${service}${status}.`,
      };
    }
    case "timeout":
      return {
        type: "error",
        code: "TRANSLATION_SERVICE_UNAVAILABLE",
        message:
          cause.detail && cause.detail.length > 0
            ? `Tempo esgotado ao contatar os serviços do VLibras: ${cause.detail}`
            : "Tempo esgotado ao contatar os serviços do VLibras.",
      };
    case "offline":
      return {
        type: "error",
        code: "NETWORK_OFFLINE",
        message: "Dispositivo offline; o avatar automático está indisponível.",
      };
  }
}

// --- Live avatar origin allowlist (Req 15.2, 15.3, 17.2) -----------------

/**
 * Hosts (and parent domains) that must NEVER be loaded by the WebView, even if
 * they would otherwise look like official VLibras hosts. The hosted "VLibras
 * Vídeo" service must never be automated to publish this production (Req 15.3),
 * so its host is hard-denied. A host matches when it equals the suffix or ends
 * with `.<suffix>`.
 */
export const FORBIDDEN_AVATAR_HOST_SUFFIXES: readonly string[] = [
  "video.vlibras.gov.br",
];

/**
 * Official VLibras hosts the live avatar is allowed to load/contact. These
 * correspond to the player bundle/assets and the online translation and sign
 * dictionary services documented for `vlibras-player-webjs`. Anything else is
 * treated as a private/undocumented or inferred endpoint and refused
 * (Req 15.2, 15.5).
 */
export const ALLOWED_AVATAR_HOST_SUFFIXES: readonly string[] = [
  "vlibras.gov.br",
];

/**
 * Schemes allowed for an avatar origin. Remote resources must use HTTPS
 * (Req 17.2); the locally bundled player page is served from `file://` on the
 * device, which is also permitted.
 */
export const ALLOWED_AVATAR_SCHEMES: readonly string[] = ["https:", "file:"];

/** Options for {@link isAllowedAvatarOrigin} / {@link assertAllowedAvatarOrigin}. */
export type AllowedAvatarOriginOptions = Readonly<{
  /**
   * Additional allowed host suffixes on top of
   * {@link ALLOWED_AVATAR_HOST_SUFFIXES} (e.g. an approved mirror). Hard
   * denials always win over these.
   */
  allowedHostSuffixes?: readonly string[];
  /**
   * Additional hard-denied host suffixes on top of
   * {@link FORBIDDEN_AVATAR_HOST_SUFFIXES}.
   */
  forbiddenHostSuffixes?: readonly string[];
}>;

/** Error thrown by {@link assertAllowedAvatarOrigin} for a rejected origin. */
export class AvatarOriginError extends Error {
  readonly code: "AVATAR_ORIGIN_REJECTED";

  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = "AvatarOriginError";
    this.code = "AVATAR_ORIGIN_REJECTED";
    this.url = url;
  }
}

/** Case-insensitive suffix match: exact host or a subdomain of `suffix`. */
function hostMatchesSuffix(host: string, suffix: string): boolean {
  const h = host.toLowerCase();
  const s = suffix.toLowerCase();
  return h === s || h.endsWith(`.${s}`);
}

/**
 * Returns `true` when `rawUrl` is an origin the live avatar WebView may load:
 * an HTTPS URL on an allowlisted official VLibras host, or the local `file://`
 * player bundle. The hosted "VLibras Vídeo" host is always refused, and any
 * host outside the allowlist is treated as private/inferred and refused.
 *
 * Non-throwing form, useful for property tests and branching callers. The
 * checks, most restrictive first:
 *   1. The URL must parse.
 *   2. Its scheme must be allowed (HTTPS, or `file:` for the local bundle).
 *   3. For non-`file:` schemes, the host must NOT be hard-denied and MUST be
 *      on the allowlist. `file:` URLs have no meaningful remote host and are
 *      accepted once the scheme passes (the bundle ships inside the app).
 */
export function isAllowedAvatarOrigin(
  rawUrl: string,
  options: AllowedAvatarOriginOptions = {},
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (!ALLOWED_AVATAR_SCHEMES.includes(parsed.protocol)) {
    return false;
  }

  // The locally bundled player page is served from file://; it has no remote
  // host to validate and ships inside the app (Req 15.1, 17.2).
  if (parsed.protocol === "file:") {
    return true;
  }

  const host = parsed.hostname.toLowerCase();
  if (host.length === 0) {
    return false;
  }

  const forbidden = [
    ...FORBIDDEN_AVATAR_HOST_SUFFIXES,
    ...(options.forbiddenHostSuffixes ?? []),
  ];
  if (forbidden.some((suffix) => hostMatchesSuffix(host, suffix))) {
    return false;
  }

  const allowed = [
    ...ALLOWED_AVATAR_HOST_SUFFIXES,
    ...(options.allowedHostSuffixes ?? []),
  ];
  return allowed.some((suffix) => hostMatchesSuffix(host, suffix));
}

/**
 * Throwing form of {@link isAllowedAvatarOrigin}: returns the parsed `URL` for
 * a permitted avatar origin, or throws an {@link AvatarOriginError} describing
 * why the origin was refused. Use this to validate `playerBundleUri` and any
 * service URL before handing it to the WebView.
 */
export function assertAllowedAvatarOrigin(
  rawUrl: string,
  options: AllowedAvatarOriginOptions = {},
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AvatarOriginError(`URL de origem do avatar inválida: ${rawUrl}`, rawUrl);
  }

  if (!ALLOWED_AVATAR_SCHEMES.includes(parsed.protocol)) {
    throw new AvatarOriginError(
      `Esquema ${parsed.protocol} não permitido para a origem do avatar; ` +
        `esperado um de [${ALLOWED_AVATAR_SCHEMES.join(", ")}] (HTTPS ou bundle local file://).`,
      rawUrl,
    );
  }

  if (parsed.protocol === "file:") {
    return parsed;
  }

  const host = parsed.hostname.toLowerCase();
  if (host.length === 0) {
    throw new AvatarOriginError(`URL de origem do avatar sem host: ${rawUrl}`, rawUrl);
  }

  const forbidden = [
    ...FORBIDDEN_AVATAR_HOST_SUFFIXES,
    ...(options.forbiddenHostSuffixes ?? []),
  ];
  if (forbidden.some((suffix) => hostMatchesSuffix(host, suffix))) {
    throw new AvatarOriginError(
      `Host ${host} é o serviço hospedado "VLibras Vídeo"/gov.br; ` +
        `automatizá-lo para esta produção não é permitido.`,
      rawUrl,
    );
  }

  const allowed = [
    ...ALLOWED_AVATAR_HOST_SUFFIXES,
    ...(options.allowedHostSuffixes ?? []),
  ];
  if (!allowed.some((suffix) => hostMatchesSuffix(host, suffix))) {
    throw new AvatarOriginError(
      `Host ${host} não está na allowlist de origens oficiais do VLibras; ` +
        `endpoints privados/inferidos são recusados.`,
      rawUrl,
    );
  }

  return parsed;
}

// --- WebView load-timeout watchdog ---------------------------------------

/**
 * Default time to wait for the WebView to emit its `load` event before the
 * watchdog synthesizes a `WEBVIEW_LOAD_TIMEOUT` error (~15s).
 */
export const DEFAULT_AVATAR_LOAD_TIMEOUT_MS = 15_000;

/** A handle returned by {@link SetTimer}; opaque to this module. */
export type TimerHandle = unknown;

/** Injectable timer setter, mirroring `setTimeout`'s shape. */
export type SetTimer = (callback: () => void, delayMs: number) => TimerHandle;

/** Injectable timer clearer, mirroring `clearTimeout`'s shape. */
export type ClearTimer = (handle: TimerHandle) => void;

/** Options for {@link createAvatarLoadTimeout}. */
export type AvatarLoadTimeoutOptions = Readonly<{
  /** Injectable timer setter (e.g. `setTimeout`). */
  setTimer: SetTimer;
  /** Injectable timer clearer (e.g. `clearTimeout`). */
  clearTimer: ClearTimer;
  /**
   * Called once if the deadline elapses before {@link AvatarLoadTimeout.notifyLoaded}
   * or {@link AvatarLoadTimeout.cancel}. Receives a synthetic
   * `WEBVIEW_LOAD_TIMEOUT` error to route to the bridge / fallback.
   */
  emitError: (error: AvatarErrorMessage) => void;
  /** Deadline in ms. Defaults to {@link DEFAULT_AVATAR_LOAD_TIMEOUT_MS}. */
  timeoutMs?: number;
}>;

/** Control surface returned by {@link createAvatarLoadTimeout}. */
export interface AvatarLoadTimeout {
  /** Arms the deadline. Idempotent: a second call while armed is a no-op. */
  start(): void;
  /**
   * Signals the WebView emitted `load` in time. Cancels the pending deadline
   * so `emitError` never fires. Idempotent.
   */
  notifyLoaded(): void;
  /**
   * Cancels the pending deadline without firing `emitError` (e.g. the avatar
   * was disabled or the component unmounted). Idempotent.
   */
  cancel(): void;
  /** `true` while the deadline is armed and has neither fired nor been cleared. */
  readonly isPending: boolean;
}

/**
 * Creates a {@link AvatarLoadTimeout} watchdog for the WebView `load` event.
 *
 * If the WebView does not emit `load` within `timeoutMs`, the watchdog calls
 * `emitError` once with a synthetic `{ type: "error", code: "WEBVIEW_LOAD_TIMEOUT" }`
 * message, which the bridge/controller routes to `handleAvatarRuntimeFailure`
 * to trigger the video + captions fallback. Timers are injected (`setTimer` /
 * `clearTimer`) so this is fully testable without real timers.
 *
 * At most one `emitError` can ever fire per watchdog instance: once the
 * deadline fires, or `notifyLoaded`/`cancel` is called, the instance is
 * "settled" and subsequent calls are no-ops.
 */
export function createAvatarLoadTimeout(
  options: AvatarLoadTimeoutOptions,
): AvatarLoadTimeout {
  const { setTimer, clearTimer, emitError } = options;
  const timeoutMs = options.timeoutMs ?? DEFAULT_AVATAR_LOAD_TIMEOUT_MS;

  let handle: TimerHandle | null = null;
  let settled = false;

  function clearPending(): void {
    if (handle !== null) {
      clearTimer(handle);
      handle = null;
    }
  }

  return {
    start(): void {
      if (settled || handle !== null) {
        return;
      }
      handle = setTimer(() => {
        handle = null;
        if (settled) {
          return;
        }
        settled = true;
        emitError(
          mapCauseToErrorMessage({ kind: "webview-load-timeout", timeoutMs }),
        );
      }, timeoutMs);
    },
    notifyLoaded(): void {
      if (settled) {
        return;
      }
      settled = true;
      clearPending();
    },
    cancel(): void {
      if (settled) {
        return;
      }
      settled = true;
      clearPending();
    },
    get isPending(): boolean {
      return !settled && handle !== null;
    },
  };
}
