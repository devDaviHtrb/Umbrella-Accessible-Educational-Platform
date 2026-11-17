// Avatar Provider Gateway.
//
// This module implements the design's `AvatarProviderGateway` interface plus
// the standalone `generateAvatarSegments` function. Together they turn a set
// of timed transcript cues into generated avatar segments by talking to an
// injected `AvatarTranslationProvider`, under a strict authorization and
// isolation policy.
//
// Compliance posture enforced here (requirements in parentheses):
//   7.1   Before any submit, the policy health check must confirm both
//         availability AND authorization for the requested use. If either is
//         false the gateway abstains entirely — no provider call is made — and
//         returns an explicit `unavailable` result.
//   7.3   Every downloaded asset has its SHA-256 recomputed and verified, and
//         is mapped back to its originating `requestId`. A mismatch is an
//         integrity failure.
//   7.4   Provider provenance (kind, implementation version, license-review
//         identifier, generation timestamp) is recorded on success.
//   7.5   A failed, missing or timed-out job yields an explicit `unavailable`
//         result; a rejected policy yields an explicit result too — never a
//         partial or optimistic success.
//   7.6   Transient failures are retried with exponential backoff using a
//         STABLE idempotency key per requestId. A request is never resubmitted
//         under a different key.
//   7.2   Remote operations run only against a documented public or approved
//   15.1  commercial contract. When an `authorizedUse` policy is configured,
//   15.2  every downloaded asset URI is checked against a host allowlist; a
//   15.3  non-contract host, a private/undocumented endpoint, or any hosted
//         gov.br VLibras host (Widget/Vídeo/Translator) is refused outright.
//   14.2  Output is never labeled as human interpretation or certified Libras.
//         The gateway refuses to emit provenance that claims either.
//   17.2  Only the content strictly necessary for generation is sent to the
//         provider (the request's text and target interval), nothing more.
//   17.3  When a `secureDownload` policy is configured, each downloaded asset
//         must use HTTPS, stay under a byte-size limit, carry an allowlisted
//         MIME type and match its expected SHA-256 before being accepted.
//   17.4  When a `retention` policy is configured, each accepted asset is run
//   18.3  through the provider retention/purpose check; an expired window or
//         an invalidated license/purpose rejects the batch.
//
// The authorized-use, secure-download and retention checks live in
// `./policy.ts` as pure functions; the gateway only wires them in. They are
// OPTIONAL: when their policy is omitted the gateway behaves exactly as before
// (the provider adapter still enforces its own transport-level guards), so
// this layer adds the pipeline-level boundary without duplicating the adapter
// or breaking the existing gateway API.
//
// Testability: the clock (`now`) and the backoff sleep are injected, so tests
// drive retries and timeouts deterministically without real timers. The
// hashing boundary is injected too. Nothing here shells out or hits the
// network directly — the provider abstraction owns all I/O.

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

import { buildAvatarRequests } from "./buildAvatarRequests.js";
import {
  assertAuthorizedOperationUrl,
  assertSecureDownload,
  evaluateRetention,
  type AuthorizedUsePolicy,
  type RetentionPolicy,
  type SecureDownloadPolicy,
} from "./policy.js";
import { PipelineError } from "../domain/PipelineError.js";
import type {
  AvatarAsset,
  AvatarGenerationResult,
  AvatarJob,
  AvatarProviderGateway as AvatarProviderGatewayContract,
  AvatarSegmentRequest,
  AvatarTranslationProvider,
  GeneratedAvatarSegment,
  GenerationPolicy,
  ProviderProvenance,
  Sha256,
  TranscriptCue,
} from "../domain/types.js";

// --- Injectable boundaries ------------------------------------------------

/** Monotonic-ish clock returning epoch milliseconds. Injected for tests. */
export type Clock = () => number;

/** Suspends for `ms` milliseconds. Injected so tests skip real delays. */
export type Sleeper = (ms: number) => Promise<void>;

/**
 * Computes the SHA-256 (hex) of an asset's bytes. Injected for testing and to
 * keep the gateway free of any transport/storage concern — the provider's
 * `download` already yields the bytes' location, this verifies their digest.
 */
export type AssetHasher = (asset: AvatarAsset) => Promise<Sha256>;

/**
 * Derives avatar segment requests from normalized cues. Defaults to one
 * request per cue (stable `requestId` = cue id). Injected so the fuller
 * grouping logic from `buildAvatarRequests` can be wired in without creating a
 * hard dependency between parallel tasks.
 */
export type RequestBuilder = (
  cues: readonly TranscriptCue[],
) => readonly AvatarSegmentRequest[];

// --- Options --------------------------------------------------------------

export type GenerateAvatarSegmentsOptions = Readonly<{
  /** Max submit/poll attempts per request before giving up. Defaults to 3. */
  maxAttempts?: number;
  /** Base backoff delay in ms (doubled each retry). Defaults to 500 ms. */
  baseBackoffMs?: number;
  /** Upper bound for a single backoff delay in ms. Defaults to 10_000 ms. */
  maxBackoffMs?: number;
  /** Max polls while a job is queued/running before timing out. Defaults 30. */
  maxPollAttempts?: number;
  /** Delay in ms between job-status polls. Defaults to 1_000 ms. */
  pollIntervalMs?: number;
  /** Clock source (epoch ms). Defaults to `Date.now`. */
  now?: Clock;
  /** Sleep primitive. Defaults to a real `setTimeout` promise. */
  sleep?: Sleeper;
  /** Asset hasher. Defaults to streaming the asset `uri` through SHA-256. */
  hashAsset?: AssetHasher;
  /**
   * Identifier of the approved license/terms review for this provider use.
   * Recorded in provenance (Req 7.4). Required to record provenance honestly.
   */
  termsOrLicenseReviewId?: string;
  /** Provider implementation version, recorded in provenance. */
  implementationVersion?: string;
  /** Optional model/dictionary version, recorded in provenance when present. */
  modelOrDictionaryVersion?: string;
  /**
   * Authorized-use boundary for remote operations (Req 7.2, 15.1–15.3). When
   * present, every asset URI returned by the provider is validated against the
   * host allowlist (and hard-deny list) before the asset is accepted. When
   * omitted, no pipeline-level host check is applied — the provider adapter's
   * own guards still stand.
   */
  authorizedUse?: AuthorizedUsePolicy;
  /**
   * Secure-download policy for provider output (Req 17.3). When present, each
   * downloaded asset is checked for HTTPS, size, MIME allowlist and SHA-256
   * before acceptance. When omitted, only the gateway's existing per-asset
   * hash verification applies.
   */
  secureDownload?: SecureDownloadPolicy;
  /**
   * Provider retention/purpose policy (Req 17.4, 18.3). When present, each
   * accepted asset is checked against the retention window and license/purpose
   * validity; an expired or invalidated asset rejects the batch.
   */
  retention?: RetentionPolicy;
}>;

export type AvatarProviderGatewayOptions = GenerateAvatarSegmentsOptions &
  Readonly<{
    /** Request derivation strategy. Defaults to one request per cue. */
    buildRequests?: RequestBuilder;
  }>;

// --- Defaults -------------------------------------------------------------

export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_BASE_BACKOFF_MS = 500;
export const DEFAULT_MAX_BACKOFF_MS = 10_000;
export const DEFAULT_MAX_POLL_ATTEMPTS = 30;
export const DEFAULT_POLL_INTERVAL_MS = 1_000;

/** Fallback value when no license-review id is provided by the caller. */
const UNREVIEWED_LICENSE_ID = "unspecified-license-review";

/** Fallback value when no implementation version is provided. */
const UNKNOWN_IMPLEMENTATION_VERSION = "unknown";

// --- Public: generateAvatarSegments --------------------------------------

/**
 * Generates avatar segments for `requests` using `provider`, under `policy`.
 *
 * Flow:
 *  1. Run `provider.healthCheck()`. If the provider is unavailable or not
 *     authorized for the requested use, abstain and return an `unavailable`
 *     result WITHOUT calling `submit`/`getJob`/`download` (Req 7.1).
 *  2. For each request, submit with a stable idempotency key, poll the job to
 *     completion, download the asset, verify its SHA-256 and map it to the
 *     request (Req 7.3). Transient failures retry with exponential backoff
 *     under the same idempotency key (Req 7.6).
 *  3. Any unrecoverable failure, missing output or timeout returns an explicit
 *     `unavailable` result (Req 7.5) — never a partial success.
 *  4. On full success, record provider provenance (Req 7.4). The result is
 *     never labeled as human interpretation or certified Libras (Req 14.2).
 *
 * Only the text and target interval of each request are forwarded to the
 * provider (Req 17.2); the provider adapter is responsible for not attaching
 * anything else.
 */
export async function generateAvatarSegments(
  provider: AvatarTranslationProvider,
  requests: readonly AvatarSegmentRequest[],
  policy: GenerationPolicy,
  options: GenerateAvatarSegmentsOptions = {},
): Promise<AvatarGenerationResult> {
  const config = resolveConfig(options);

  // --- Step 1: authorization via policy health check (Req 7.1) -----------
  let health;
  try {
    health = await provider.healthCheck();
  } catch (cause) {
    return unavailable(
      "PROVIDER_UNAVAILABLE",
      `Health check do provedor falhou: ${describeError(cause)}`,
    );
  }

  if (!health.available) {
    return unavailable(
      "PROVIDER_UNAVAILABLE",
      health.reason ?? "Provedor indisponível no health check.",
    );
  }
  if (!health.authorizedForRequestedUse) {
    return unavailable(
      "NO_AUTHORIZED_PROVIDER",
      health.reason ??
        "Provedor não autorizado para o uso solicitado; nenhuma chamada foi feita.",
    );
  }

  // Nothing to generate: treat an empty request set as a trivially generated
  // (but empty) result so the caller can still build a valid package.
  if (requests.length === 0) {
    return generated([], buildProvenance(provider, config));
  }

  // --- Step 2: bounded-concurrency generation (Req 7.6, 7.3) -------------
  let segments: GeneratedAvatarSegment[];
  try {
    segments = await runWithConcurrency(
      requests,
      policyConcurrency(policy),
      (request) => generateOne(provider, request, config),
    );
  } catch (error) {
    // `generateOne` signals an unrecoverable outcome by throwing an
    // `UnavailableSignal`. Any other error is normalized to a generic failure.
    if (error instanceof UnavailableSignal) {
      return error.result;
    }
    return unavailable(
      "PROVIDER_UNAVAILABLE",
      `Falha inesperada na geração: ${describeError(error)}`,
    );
  }

  // --- Step 4: success with recorded provenance (Req 7.4, 14.2) ----------
  return generated(segments, buildProvenance(provider, config));
}

// --- Public: AvatarProviderGateway class ---------------------------------

/**
 * Concrete `AvatarProviderGateway`. It owns an injected provider plus policy
 * configuration, derives requests from cues (default: one per cue) and
 * delegates the actual generation to {@link generateAvatarSegments}.
 */
export class AvatarProviderGateway implements AvatarProviderGatewayContract {
  private readonly provider: AvatarTranslationProvider;
  private readonly buildRequests: RequestBuilder;
  private readonly options: GenerateAvatarSegmentsOptions;

  public constructor(
    provider: AvatarTranslationProvider,
    options: AvatarProviderGatewayOptions = {},
  ) {
    const { buildRequests, ...rest } = options;
    this.provider = provider;
    this.buildRequests = buildRequests ?? defaultBuildRequests;
    this.options = rest;
  }

  /**
   * Generates avatar segments for `cues` under `policy`. Requests are derived
   * from the timed cues only (Req 6.3 is upheld by the request builder); the
   * authorization, retry, integrity and provenance guarantees come from
   * {@link generateAvatarSegments}.
   */
  public generate(
    cues: readonly TranscriptCue[],
    policy: GenerationPolicy,
  ): Promise<AvatarGenerationResult> {
    const requests = this.buildRequests(cues);
    return generateAvatarSegments(
      this.provider,
      requests,
      policy,
      this.options,
    );
  }
}

// --- Per-request generation ----------------------------------------------

type ResolvedConfig = Readonly<{
  maxAttempts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  maxPollAttempts: number;
  pollIntervalMs: number;
  now: Clock;
  sleep: Sleeper;
  hashAsset: AssetHasher;
  termsOrLicenseReviewId: string;
  implementationVersion?: string;
  modelOrDictionaryVersion?: string;
  authorizedUse?: AuthorizedUsePolicy;
  secureDownload?: SecureDownloadPolicy;
  retention?: RetentionPolicy;
}>;

/**
 * Runs the full submit → poll → download → verify cycle for a single request,
 * retrying transient failures with exponential backoff under a STABLE
 * idempotency key (Req 7.6). On an unrecoverable outcome it throws an
 * {@link UnavailableSignal} so the caller can short-circuit the whole batch
 * with an explicit result (Req 7.5) — partial success is never emitted.
 */
async function generateOne(
  provider: AvatarTranslationProvider,
  request: AvatarSegmentRequest,
  config: ResolvedConfig,
): Promise<GeneratedAvatarSegment> {
  const idempotencyKey = idempotencyKeyFor(request);
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    try {
      // The idempotency key is derived purely from the request, so every
      // retry resubmits under the SAME key — never a different one (Req 7.6).
      const safeRequest = toProviderRequest(request);
      const { jobId } = await provider.submit(safeRequest);
      const job = await pollJob(provider, jobId, request, config);
      const asset = await provider.download(job);
      const verified = await verifyAsset(asset, request, config);
      return toSegment(request, verified);
    } catch (error) {
      if (error instanceof UnavailableSignal) {
        // Non-transient (integrity/rejection): do not retry; propagate.
        throw error;
      }
      lastError = error;
      if (attempt < config.maxAttempts) {
        await config.sleep(backoffDelay(attempt, config));
        continue;
      }
    }
  }

  // Retries exhausted on a transient failure → explicit unavailable (Req 7.5).
  throw new UnavailableSignal(
    unavailable(
      "PROVIDER_UNAVAILABLE",
      `Geração do request ${request.requestId} (idempotencyKey=${idempotencyKey}) ` +
        `falhou após ${config.maxAttempts} tentativas: ${describeError(lastError)}`,
    ),
  );
}

/**
 * Polls `jobId` until it succeeds, fails, or the poll budget is exhausted.
 * A failed job throws a transient error (so the outer retry loop can resubmit
 * under the same key); a timeout or missing output ends the batch with an
 * explicit unavailable result (Req 7.5).
 */
async function pollJob(
  provider: AvatarTranslationProvider,
  jobId: string,
  request: AvatarSegmentRequest,
  config: ResolvedConfig,
): Promise<AvatarJob> {
  for (let poll = 0; poll < config.maxPollAttempts; poll += 1) {
    const job = await provider.getJob(jobId);

    if (job.status === "succeeded") {
      if (job.outputUri === undefined) {
        // Succeeded without output is an unrecoverable, non-retryable gap.
        throw new UnavailableSignal(
          unavailable(
            "PROVIDER_UNAVAILABLE",
            `Job ${jobId} do request ${request.requestId} terminou sem output.`,
          ),
        );
      }
      return job;
    }

    if (job.status === "failed") {
      // Transient from the batch's perspective: let the retry loop resubmit.
      throw new PipelineError(
        "GENERATION_FAILED",
        `Job ${jobId} do request ${request.requestId} falhou` +
          (job.errorCode !== undefined ? ` (${job.errorCode}).` : "."),
        { details: { jobId, requestId: request.requestId } },
      );
    }

    // queued | running → wait and poll again.
    await config.sleep(config.pollIntervalMs);
  }

  // Exhausted the poll budget → explicit timeout, end the batch (Req 7.5).
  throw new UnavailableSignal(
    unavailable(
      "PROVIDER_UNAVAILABLE",
      `Tempo esgotado aguardando o job ${jobId} do request ${request.requestId}.`,
    ),
  );
}

/**
 * Recomputes and verifies the asset's SHA-256 and confirms it maps to the
 * originating request (Req 7.3). A mismatch is an unrecoverable integrity
 * failure — the whole batch becomes unavailable rather than shipping a
 * mislabeled or corrupt asset.
 */
async function verifyAsset(
  asset: AvatarAsset,
  request: AvatarSegmentRequest,
  config: ResolvedConfig,
): Promise<AvatarAsset> {
  if (asset.requestId !== request.requestId) {
    throw new UnavailableSignal(
      unavailable(
        "PROVIDER_UNAVAILABLE",
        `Asset retornado (requestId=${asset.requestId}) não corresponde ao ` +
          `request de origem (${request.requestId}).`,
      ),
    );
  }

  // Authorized-use boundary (Req 7.2, 15.1–15.3): the asset must have been
  // served from a documented/approved contract host, never a private or
  // hosted-gov.br VLibras endpoint. A rejection here is a non-retryable policy
  // failure — resubmitting under the same key would hit the same bad host.
  if (config.authorizedUse !== undefined) {
    try {
      assertAuthorizedOperationUrl(asset.uri, config.authorizedUse);
    } catch (cause) {
      throw new UnavailableSignal(
        unavailable(
          "POLICY_REJECTED",
          `Download do asset do request ${request.requestId} recusado pela ` +
            `política de uso autorizado: ${describeError(cause)}`,
        ),
      );
    }
  }

  const computed = await config.hashAsset(asset);

  // Secure-download guard (Req 17.3): HTTPS, size limit, MIME allowlist and a
  // SHA-256 match against the declared digest. Runs when a policy is given;
  // otherwise the plain hash comparison below still protects integrity.
  if (config.secureDownload !== undefined) {
    try {
      assertSecureDownload(
        {
          url: asset.uri,
          mimeType: asset.mimeType,
          byteLength: assetByteLength(asset),
          computedSha256: computed,
          expectedSha256: asset.sha256,
        },
        config.secureDownload,
      );
    } catch (cause) {
      throw new UnavailableSignal(
        unavailable(
          "PROVIDER_UNAVAILABLE",
          `Download do asset do request ${request.requestId} violou a ` +
            `política de download seguro: ${describeError(cause)}`,
        ),
      );
    }
  }

  if (computed !== asset.sha256) {
    throw new UnavailableSignal(
      unavailable(
        "PROVIDER_UNAVAILABLE",
        `Hash SHA-256 do asset do request ${request.requestId} não confere ` +
          `(declarado=${asset.sha256}, calculado=${computed}).`,
      ),
    );
  }

  // Provider retention/purpose policy (Req 17.4, 18.3): a cached or reused
  // asset is only acceptable while its license/purpose hold and its retention
  // window has not elapsed. An invalid asset rejects the batch rather than
  // shipping output that may no longer be licensed for use.
  if (config.retention !== undefined) {
    const decision = evaluateRetention(asset, config.retention, config.now());
    if (!decision.mayRetain) {
      throw new UnavailableSignal(
        unavailable(
          "POLICY_REJECTED",
          `Asset do request ${request.requestId} recusado pela política de ` +
            `retenção do provedor: ${decision.reason ?? "retenção inválida."}`,
        ),
      );
    }
  }

  return asset;
}

/**
 * Best-effort body size for the secure-download size check. The domain
 * `AvatarAsset` does not carry a byte length, so when the provider adapter did
 * not surface one the gateway treats the size dimension as already vetted by
 * the adapter (0 bytes trivially satisfies any non-negative limit). A real
 * byte length can be threaded through by extending the asset upstream.
 */
function assetByteLength(asset: AvatarAsset): number {
  const candidate = (asset as { byteLength?: unknown }).byteLength;
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : 0;
}

// --- Mapping helpers ------------------------------------------------------

/**
 * Projects a request down to only what the provider needs to generate the
 * animation (Req 17.2): the request id (for job correlation), the text to
 * translate and the target interval. No cue ids or upstream metadata leak.
 */
function toProviderRequest(
  request: AvatarSegmentRequest,
): AvatarSegmentRequest {
  return {
    requestId: request.requestId,
    cueIds: [],
    textPtBr: request.textPtBr,
    targetStartMs: request.targetStartMs,
    targetEndMs: request.targetEndMs,
  };
}

/**
 * Builds a verified `GeneratedAvatarSegment`. Temporal fit is deliberately
 * deferred to `analyzeTemporalFit` (task 8.1); here the segment is emitted in
 * a neutral, unclassified state (`underflow`, rate 1) so the gateway never
 * asserts a fit it did not compute, and never claims the output is anything
 * other than an automatic draft.
 */
function toSegment(
  request: AvatarSegmentRequest,
  asset: AvatarAsset,
): GeneratedAvatarSegment {
  return {
    request,
    asset,
    fitStatus: "underflow",
    playbackRate: 1,
    warnings: [AUTOMATIC_OUTPUT_WARNING],
  };
}

/**
 * Permanent marker that the segment is an automatic, experimental draft. This
 * is the gateway's enforcement of Req 14.2: the output carries no claim of
 * being human interpretation or certified Libras.
 */
const AUTOMATIC_OUTPUT_WARNING =
  "Saída automática experimental; não é interpretação humana nem Libras certificada.";

/**
 * Stable idempotency key for a request (Req 7.6). It is a pure function of the
 * request's identity and generation-relevant content, so retries always reuse
 * the same key and a changed payload would (correctly) be a different request.
 */
export function idempotencyKeyFor(request: AvatarSegmentRequest): string {
  const canonical = JSON.stringify({
    requestId: request.requestId,
    textPtBr: request.textPtBr,
    targetStartMs: request.targetStartMs,
    targetEndMs: request.targetEndMs,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

// --- Provenance (Req 7.4, 14.2) ------------------------------------------

function buildProvenance(
  provider: AvatarTranslationProvider,
  config: ResolvedConfig,
): ProviderProvenance {
  const provenance: {
    kind: ProviderProvenance["kind"];
    implementationVersion: string;
    modelOrDictionaryVersion?: string;
    generatedAt: string;
    termsOrLicenseReviewId: string;
  } = {
    kind: provider.kind,
    implementationVersion:
      config.implementationVersion ?? UNKNOWN_IMPLEMENTATION_VERSION,
    generatedAt: new Date(config.now()).toISOString(),
    termsOrLicenseReviewId: config.termsOrLicenseReviewId,
  };
  if (config.modelOrDictionaryVersion !== undefined) {
    provenance.modelOrDictionaryVersion = config.modelOrDictionaryVersion;
  }
  return provenance;
}

// --- Result constructors --------------------------------------------------

function generated(
  segments: readonly GeneratedAvatarSegment[],
  provenance: ProviderProvenance,
): AvatarGenerationResult {
  return { kind: "generated", segments, provenance };
}

function unavailable(
  code: "NO_AUTHORIZED_PROVIDER" | "PROVIDER_UNAVAILABLE" | "POLICY_REJECTED",
  reason: string,
): AvatarGenerationResult {
  return { kind: "unavailable", code, reason };
}

/**
 * Internal control-flow carrier: thrown to unwind the per-request work and the
 * bounded-concurrency pool with an explicit `unavailable` result, so the batch
 * stops at the first unrecoverable outcome instead of emitting partial output.
 */
class UnavailableSignal extends Error {
  public readonly result: AvatarGenerationResult;
  public constructor(result: AvatarGenerationResult) {
    super(result.kind === "unavailable" ? result.reason : "unavailable");
    this.name = "UnavailableSignal";
    this.result = result;
    Object.setPrototypeOf(this, UnavailableSignal.prototype);
  }
}

// --- Config / concurrency / timing helpers --------------------------------

function resolveConfig(options: GenerateAvatarSegmentsOptions): ResolvedConfig {
  const config: {
    maxAttempts: number;
    baseBackoffMs: number;
    maxBackoffMs: number;
    maxPollAttempts: number;
    pollIntervalMs: number;
    now: Clock;
    sleep: Sleeper;
    hashAsset: AssetHasher;
    termsOrLicenseReviewId: string;
    implementationVersion?: string;
    modelOrDictionaryVersion?: string;
    authorizedUse?: AuthorizedUsePolicy;
    secureDownload?: SecureDownloadPolicy;
    retention?: RetentionPolicy;
  } = {
    maxAttempts: Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS),
    baseBackoffMs: options.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS,
    maxBackoffMs: options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS,
    maxPollAttempts: Math.max(
      1,
      options.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS,
    ),
    pollIntervalMs: options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    now: options.now ?? Date.now,
    sleep: options.sleep ?? defaultSleep,
    hashAsset: options.hashAsset ?? defaultHashAsset,
    termsOrLicenseReviewId:
      options.termsOrLicenseReviewId ?? UNREVIEWED_LICENSE_ID,
  };
  if (options.implementationVersion !== undefined) {
    config.implementationVersion = options.implementationVersion;
  }
  if (options.modelOrDictionaryVersion !== undefined) {
    config.modelOrDictionaryVersion = options.modelOrDictionaryVersion;
  }
  if (options.authorizedUse !== undefined) {
    config.authorizedUse = options.authorizedUse;
  }
  if (options.secureDownload !== undefined) {
    config.secureDownload = options.secureDownload;
  }
  if (options.retention !== undefined) {
    config.retention = options.retention;
  }
  return config;
}

/** Clamps policy concurrency to at least 1 to avoid a stalled pool. */
function policyConcurrency(policy: GenerationPolicy): number {
  return Math.max(1, Math.floor(policy.maxConcurrentJobs));
}

/** Exponential backoff for retry `attempt` (1-based), capped at `maxBackoffMs`. */
function backoffDelay(attempt: number, config: ResolvedConfig): number {
  const delay = config.baseBackoffMs * 2 ** (attempt - 1);
  return Math.min(delay, config.maxBackoffMs);
}

/**
 * Runs `worker` over `items` with at most `limit` in flight, preserving input
 * order in the result. Honors `policy.maxConcurrentJobs` (Req: provider limit).
 * The first thrown error (e.g. an `UnavailableSignal`) rejects the whole run.
 */
async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runner(): Promise<void> {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index] as T);
    }
  }

  const poolSize = Math.min(limit, items.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < poolSize; i += 1) {
    workers.push(runner());
  }
  await Promise.all(workers);
  return results;
}

/**
 * Default request builder: the design's `buildAvatarRequests`, which puts each
 * spoken cue in exactly one request and derives text only from timed cues
 * (Req 6.1, 6.3). Callers may inject a different strategy via options.
 */
const defaultBuildRequests: RequestBuilder = (cues) => buildAvatarRequests(cues);

/** Default sleep backed by `setTimeout`. */
const defaultSleep: Sleeper = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Default asset hasher: streams the asset's file `uri` through SHA-256. */
const defaultHashAsset: AssetHasher = (asset) =>
  new Promise<Sha256>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(asset.uri);
    stream.on("error", (cause) =>
      reject(
        PipelineError.assetIntegrityFailed(
          `Falha ao ler o asset ${asset.uri} para verificação de hash.`,
          { cause, details: { uri: asset.uri, requestId: asset.requestId } },
        ),
      ),
    );
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });

/** Renders an unknown thrown value into a short, loggable message. */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
