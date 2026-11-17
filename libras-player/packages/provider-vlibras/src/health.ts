// Robust availability evaluation for the self-hosted VLibras provider.
//
// The local VLibras stack (Requirement 9) is a non-production Docker
// environment that may simply not be running, may be mid-boot, or may be
// wedged and never answer. None of those states should ever throw out of the
// pipeline: when the environment is down or unresponsive the provider MUST be
// treated as *unavailable* so the pipeline falls back to a package that only
// contains `original.mp4` + the normalized SRT, without blocking the original
// package (Requirements 9.5, 13.2, 13.4).
//
// This module wraps `AvatarTranslationProvider.healthCheck()` in a way that:
//   - enforces an overall timeout, so a hung stack cannot stall the pipeline;
//   - converts connection errors (ECONNREFUSED), DNS failures (ENOTFOUND /
//     EAI_AGAIN), socket timeouts (ETIMEDOUT) and aborts into an explicit
//     `available: false` ProviderHealth with a human-readable `reason`;
//   - normalizes a non-200 / non-available health response into the same
//     shape, preserving any reason the provider already reported.
//
// The result slots directly into the gateway: `generateAvatarSegments`
// already abstains from calling the provider when `health.available` is false
// (Req 7.1), so feeding it a never-throwing, timeout-bounded health view is
// all that is needed for the fallback path to kick in.

import type {
  AvatarTranslationProvider,
  ProviderHealth,
} from "@libras/pipeline";

/** Default ceiling for a single health probe before it is considered down. */
export const DEFAULT_HEALTH_TIMEOUT_MS = 5_000;

/** Options controlling how a provider's health is evaluated. */
export type EvaluateHealthOptions = Readonly<{
  /**
   * Overall budget for the health check in milliseconds. If the provider's
   * `healthCheck()` does not settle within this window it is treated as
   * unavailable (the local stack is down or wedged). Defaults to
   * {@link DEFAULT_HEALTH_TIMEOUT_MS}.
   */
  timeoutMs?: number;
  /**
   * Clock used only to timestamp nothing here but kept injectable for
   * deterministic timers in tests. Defaults to a real `setTimeout` timer.
   */
  setTimer?: (handler: () => void, ms: number) => TimerHandle;
  /** Matching clear for {@link EvaluateHealthOptions.setTimer}. */
  clearTimer?: (handle: TimerHandle) => void;
}>;

/** Opaque timer handle so the module stays agnostic of the host timer type. */
export type TimerHandle = ReturnType<typeof setTimeout>;

/** Classification of why a health probe could not confirm availability. */
export type HealthFailureKind =
  | "connection-refused"
  | "dns-failure"
  | "timeout"
  | "aborted"
  | "unhealthy-response"
  | "unknown";

/**
 * Evaluate a provider's health without ever throwing.
 *
 * On any failure — a rejected `healthCheck()`, a connection/DNS error, an
 * overall timeout, or a response the provider itself reports as unavailable —
 * this returns a `ProviderHealth` with `available: false` and a clear
 * `reason`. The gateway consumes this to decide whether to call the provider
 * at all, so returning (never throwing) is what keeps the pipeline's fallback
 * path non-blocking (Req 9.5, 13.2, 13.4).
 *
 * `authorizedForRequestedUse` is preserved from the provider when it answered
 * (authorization is a licensing decision independent of liveness); when the
 * probe never produced a health view it defaults to `false`.
 */
export async function evaluateProviderHealth(
  provider: AvatarTranslationProvider,
  options: EvaluateHealthOptions = {},
): Promise<ProviderHealth> {
  const timeoutMs = Math.max(0, options.timeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS);
  const setTimer = options.setTimer ?? defaultSetTimer;
  const clearTimer = options.clearTimer ?? defaultClearTimer;

  let timer: TimerHandle | undefined;
  const timeout = new Promise<ProviderHealth>((resolve) => {
    timer = setTimer(() => {
      resolve({
        available: false,
        authorizedForRequestedUse: false,
        reason:
          `Health check do ambiente VLibras local não respondeu em ` +
          `${timeoutMs} ms; tratando o provedor como indisponível.`,
      });
    }, timeoutMs);
  });

  const probe = runProbe(provider);

  try {
    return await Promise.race([probe, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimer(timer);
    }
  }
}

/**
 * Convenience predicate for the pipeline/gateway: the provider may be used
 * only when it is both reachable AND authorized for the requested use. This
 * mirrors the gateway's own gate (Req 7.1) so callers can short-circuit to the
 * fallback package before ever constructing requests.
 */
export async function resolveProviderAvailability(
  provider: AvatarTranslationProvider,
  options: EvaluateHealthOptions = {},
): Promise<ProviderAvailability> {
  const health = await evaluateProviderHealth(provider, options);
  const usable = health.available && health.authorizedForRequestedUse;
  return {
    usable,
    health,
    ...(health.reason !== undefined ? { reason: health.reason } : {}),
  };
}

/** Result of {@link resolveProviderAvailability}. */
export type ProviderAvailability = Readonly<{
  /** True only when the provider is reachable and authorized. */
  usable: boolean;
  /** The underlying, never-throwing health view. */
  health: ProviderHealth;
  /** Human-readable reason when not usable (mirrors `health.reason`). */
  reason?: string;
}>;

/**
 * Classify a thrown health error into a stable, loggable failure kind. The
 * local stack being down surfaces as a connection error; a mistyped or
 * unresolvable host surfaces as DNS; an aborted probe (our own timeout or the
 * adapter's) surfaces as an abort/timeout.
 */
export function classifyHealthError(error: unknown): HealthFailureKind {
  const code = errorCode(error);
  if (code !== undefined) {
    switch (code) {
      case "ECONNREFUSED":
      case "ECONNRESET":
      case "EHOSTUNREACH":
      case "ENETUNREACH":
        return "connection-refused";
      case "ENOTFOUND":
      case "EAI_AGAIN":
        return "dns-failure";
      case "ETIMEDOUT":
      case "UND_ERR_CONNECT_TIMEOUT":
      case "UND_ERR_HEADERS_TIMEOUT":
        return "timeout";
      default:
        break;
    }
  }

  const name = errorName(error);
  if (name === "AbortError" || name === "TimeoutError") {
    return "aborted";
  }

  return "unknown";
}

// --- Internals ------------------------------------------------------------

/** Runs `healthCheck()` and normalizes both success and failure to a view. */
async function runProbe(
  provider: AvatarTranslationProvider,
): Promise<ProviderHealth> {
  try {
    const health = await provider.healthCheck();
    if (health.available) {
      return health;
    }
    // The provider answered but reports itself down (e.g. non-200 health
    // endpoint); preserve its reason and authorization verdict verbatim.
    return {
      available: false,
      authorizedForRequestedUse: health.authorizedForRequestedUse,
      reason:
        health.reason ??
        "Ambiente VLibras local reportou-se indisponível no health check.",
    };
  } catch (cause) {
    const kind = classifyHealthError(cause);
    return {
      available: false,
      authorizedForRequestedUse: false,
      reason: reasonForFailure(kind, cause),
    };
  }
}

/** Builds a clear, user-facing reason string from a classified failure. */
function reasonForFailure(kind: HealthFailureKind, cause: unknown): string {
  const detail = describeError(cause);
  switch (kind) {
    case "connection-refused":
      return (
        "Ambiente VLibras local não está em execução " +
        `(conexão recusada): ${detail}.`
      );
    case "dns-failure":
      return `Host do ambiente VLibras local não pôde ser resolvido: ${detail}.`;
    case "timeout":
      return `Ambiente VLibras local não respondeu ao health check: ${detail}.`;
    case "aborted":
      return `Health check do ambiente VLibras local foi abortado: ${detail}.`;
    case "unhealthy-response":
      return detail;
    default:
      return `Falha ao verificar o ambiente VLibras local: ${detail}.`;
  }
}

/** Extracts a Node-style error code from an unknown thrown value. */
function errorCode(error: unknown): string | undefined {
  // Node layers the real code on `cause` for fetch/undici failures.
  const direct = readStringProp(error, "code");
  if (direct !== undefined) {
    return direct;
  }
  if (isRecord(error) && "cause" in error) {
    return readStringProp(error.cause, "code");
  }
  return undefined;
}

/** Reads the `name` of an error-like value, if present. */
function errorName(error: unknown): string | undefined {
  const direct = readStringProp(error, "name");
  if (direct !== undefined) {
    return direct;
  }
  if (isRecord(error) && "cause" in error) {
    return readStringProp(error.cause, "name");
  }
  return undefined;
}

function readStringProp(value: unknown, key: string): string | undefined {
  if (isRecord(value)) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

const defaultSetTimer: NonNullable<EvaluateHealthOptions["setTimer"]> = (
  handler,
  ms,
) => setTimeout(handler, ms);

const defaultClearTimer: NonNullable<EvaluateHealthOptions["clearTimer"]> = (
  handle,
) => clearTimeout(handle);
