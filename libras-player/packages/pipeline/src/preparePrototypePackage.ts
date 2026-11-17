// End-to-end pipeline orchestration (`preparePrototypePackage`).
//
// This module wires together the already-implemented pipeline stages into the
// single flow described by the design's `preparePrototypePackage` /
// `prepareTranslationPackage` pseudocode:
//
//   1. inspect the source media (ffprobe)                 -> inspectMedia
//   2. parse + normalize the SRT against the duration     -> parseAndNormalizeSrt
//   3. transcode the source to the H.264/AAC `original`   -> transcodeOriginal
//   4. resolve an authorized provider; if none/unauthorized, fall straight to
//      the avatar-less fallback package                   -> createManifestWithFallback
//   5. generate avatar segments through the gateway       -> generateAvatarSegments
//      (an `unavailable` generation result falls back too, never blocking the
//       original package)
//   6. re-analyze temporal fit against each SRT interval  -> analyzeTemporalFit
//      (any `rejected` segment blocks the avatar variant and falls back under
//       the configured policy)
//   7. compose the prototype variant over the source      -> renderPrototypeVariant
//   8. validate the technical package                     -> validateTechnicalPackage
//   9. create the manifest with the avatar variant        -> createManifestWithFallback
//
// The function deliberately does NOT write the package to storage: the design
// pseudocode returns a `TranslationManifest`, and `writePackage` is a separate,
// already-exported step the caller (or the e2e harness in task 21) invokes.
// The `writeTranscript` boundary persists the normalized SRT so a transcript
// URI can be referenced by the manifest, mirroring the pseudocode's
// `storeNormalizedSrt(cues)`.
//
// Compliance / correctness posture enforced here:
//   7.1   No provider is resolved or called unless it is authorized; an absent
//         or unauthorized provider produces a `NO_AUTHORIZED_PROVIDER`
//         fallback with no avatar variant and no provider call.
//   10.4  A `rejected` segment after temporal re-fit blocks the avatar variant
//         (never truncated); under the default `failOnRejectedSegment` policy
//         this degrades to the avatar-less fallback instead of shipping a
//         partial/incoherent avatar.
//   12.3  An `unavailable` generation result yields the fallback manifest with
//         the recorded reason and no avatar variant.
//   13.1  A generation failure never blocks the original package.
//   13.2  The pipeline always produces a playable package (original + SRT).
//
// Error mapping: every stage already throws `PipelineError` with a code from
// `PipelineErrorCode`. The orchestrator only adds guards for its own inputs and
// re-labels the one assertion the pseudocode makes explicit (the measured
// duration gate) so the failure surfaces as `DURATION_MISMATCH`. Blocking
// failures of the *original* package (invalid SRT, duration mismatch, failed
// original transcode) propagate as `PipelineError`; failures confined to the
// *avatar* path are caught and converted to a fallback, honoring Req 13.1.
//
// Testability: every side-effecting stage is injected. Tests drive the whole
// flow with fakes and never touch ffmpeg/ffprobe, the network or the disk.

import { inspectMedia } from "./media/inspectMedia.js";
import type {
  InspectMediaOptions,
  MediaInspection,
} from "./media/inspectMedia.js";
import { parseAndNormalizeSrt } from "./srt/parseAndNormalizeSrt.js";
import type { ParseAndNormalizeSrtOptions } from "./srt/parseAndNormalizeSrt.js";
import { transcodeOriginal } from "./media/transcode.js";
import type { TranscodeOriginalOptions } from "./media/transcode.js";
import { buildAvatarRequests } from "./avatar/buildAvatarRequests.js";
import { generateAvatarSegments } from "./avatar/gateway.js";
import type { GenerateAvatarSegmentsOptions } from "./avatar/gateway.js";
import { analyzeTemporalFit } from "./avatar/analyzeTemporalFit.js";
import type { AnalyzeTemporalFitOptions } from "./avatar/analyzeTemporalFit.js";
import { renderPrototypeVariant } from "./render/renderPrototypeVariant.js";
import type { RenderPrototypeVariantOptions } from "./render/renderPrototypeVariant.js";
import { validateTechnicalPackage } from "./package/validateTechnicalPackage.js";
import type { ValidateTechnicalPackageOptions } from "./package/validateTechnicalPackage.js";
import {
  createManifestWithFallback,
  MANIFEST_DISCLOSURE,
} from "./package/createManifest.js";
import { PipelineError, isPipelineError } from "./domain/PipelineError.js";
import type {
  AvatarGenerationResult,
  BoundingBox,
  GeneratedAvatarSegment,
  GenerationPolicy,
  MediaId,
  MediaVariant,
  Milliseconds,
  TranscriptCue,
  TranslationManifest,
  Uri,
} from "./domain/types.js";

// --- Injectable boundaries ------------------------------------------------

/**
 * Resolves the authorized avatar provider for the requested use, or `undefined`
 * when no authorized provider is configured. Mirrors the pseudocode's
 * `resolveAuthorizedProvider`. Returning `undefined` is the honest, explicit
 * way to say "no authorized provider" (Req 7.1): the pipeline then falls back
 * to an avatar-less package without ever constructing or calling a provider.
 */
export type ResolveAuthorizedProvider = (
  policy: GenerationPolicy,
) => Promise<AvatarProvider | undefined>;

/**
 * The minimal provider surface the orchestrator forwards to the gateway. It is
 * the design's `AvatarTranslationProvider`; aliased here so the dependency is
 * named at the orchestration boundary without re-importing the interface at
 * call sites that only care about resolution.
 */
export type AvatarProvider = Parameters<typeof generateAvatarSegments>[0];

/**
 * Persists the normalized transcript and returns the URI it can be referenced
 * by in the manifest. Mirrors the pseudocode's `storeNormalizedSrt(cues)`.
 * Injected so the orchestrator never assumes a storage layout; the e2e harness
 * wires a real SRT serializer + writer, tests supply a fake.
 */
export type TranscriptWriter = (
  cues: readonly TranscriptCue[],
) => Promise<Uri>;

/**
 * Describes the already-produced `original.mp4` as a validated
 * {@link MediaVariant}. The source inspection reports the *input* codecs
 * (AV1/Opus/webm); the transcoded original is H.264/AAC/mp4, so it must be
 * probed/hashed on its own. Injected so the orchestrator stays free of
 * ffprobe/hashing: the e2e harness probes the output file, tests return a
 * fixed variant. The returned variant's `kind` must be `"original"`.
 */
export type ProbeOriginalVariant = (
  outputUri: Uri,
) => Promise<MediaVariant>;

// --- Options --------------------------------------------------------------

/**
 * Per-stage options and injected boundaries for {@link preparePrototypePackage}.
 *
 * Only `sourceVideo`, `srtText`, `mediaId`, `originalOutputUri`,
 * `writeTranscript` and the ffmpeg/ffprobe boundaries carried inside the
 * nested stage options are required in practice; everything else has a safe
 * default or is only consulted on the avatar path.
 */
export type PreparePrototypePackageOptions = Readonly<{
  // --- Required flow inputs ---------------------------------------------
  /** Source media URI (`video.webm`). */
  sourceVideo: Uri;
  /** Raw SRT text (`subtitles.txt` contents). */
  srtText: string;
  /** Stable media id used by the manifest. */
  mediaId: MediaId;
  /** Destination URI for the produced `original.mp4`. */
  originalOutputUri: Uri;
  /**
   * Probes/hashes the produced `original.mp4` into a validated
   * {@link MediaVariant} (its codecs differ from the source input). Required.
   */
  probeOriginal: ProbeOriginalVariant;
  /** Persists the normalized transcript; returns its URI (Req 12.1). */
  writeTranscript: TranscriptWriter;

  // --- Stage options (carry the injected ffmpeg/ffprobe/hash boundaries) -
  /** Options forwarded to {@link inspectMedia} (ffprobe + hasher). */
  inspect?: InspectMediaOptions;
  /** Options forwarded to {@link parseAndNormalizeSrt} (clamp + onClamp). */
  srt?: ParseAndNormalizeSrtOptions;
  /** Options forwarded to {@link transcodeOriginal} (ffmpeg executor). */
  transcode: TranscodeOriginalOptions;
  /** Options forwarded to {@link generateAvatarSegments}. */
  generate?: GenerateAvatarSegmentsOptions;
  /** Options forwarded to {@link analyzeTemporalFit} per segment. */
  fit?: AnalyzeTemporalFitOptions;
  /**
   * Options forwarded to {@link renderPrototypeVariant} (ffmpeg executor,
   * probe, hasher, output URI). Required only when the avatar path runs; when
   * omitted, a resolved provider is treated as unusable and the pipeline falls
   * back (it never silently skips a configured avatar step).
   */
  render?: RenderPrototypeVariantOptions;
  /** Options forwarded to {@link validateTechnicalPackage}. */
  validate?: ValidateTechnicalPackageOptions;

  // --- Orchestration knobs ----------------------------------------------
  /**
   * Resolves the authorized provider. Defaults to "no authorized provider"
   * (returns `undefined`), i.e. the compliant fallback path — a provider must
   * be opted into explicitly (Req 7.1).
   */
  resolveProvider?: ResolveAuthorizedProvider;
  /** Generation policy. Defaults to a safe internal-prototype policy. */
  policy?: GenerationPolicy;
  /** Normalized avatar placement window. Defaults to the design's box. */
  placement?: BoundingBox;
  /**
   * Expected measured media duration in ms. The pseudocode asserts the real
   * asset's duration; when provided, a divergence is a blocking
   * `DURATION_MISMATCH`. Defaults to `undefined` (no extra assertion beyond
   * what `inspectMedia` already enforces via its own tolerance).
   */
  expectedDurationMs?: Milliseconds;
  /**
   * When `true` (the default), an avatar-path failure degrades to the
   * avatar-less fallback package (Req 13.1): a generation failure never blocks
   * the original. When `false`, an avatar-path `PipelineError` is rethrown
   * (the design's "abort per policy" alternative).
   */
  fallbackOnAvatarFailure?: boolean;
}>;

// --- Defaults -------------------------------------------------------------

/** Default avatar placement window from the design pseudocode. */
export const DEFAULT_AVATAR_PLACEMENT: BoundingBox = Object.freeze({
  x: 0.68,
  y: 0.5,
  width: 0.3,
  height: 0.48,
});

/** Default max playback rate for the legibility policy. */
export const DEFAULT_MAX_PLAYBACK_RATE = 1.5;

/** Default max concurrent provider jobs. */
export const DEFAULT_MAX_CONCURRENT_JOBS = 4;

/**
 * Default, compliant generation policy: an internal, non-production prototype
 * that fails on any rejected segment (Req 8.1 / 10.4).
 */
export const DEFAULT_GENERATION_POLICY: GenerationPolicy = Object.freeze({
  usage: "internal-nonproduction-prototype",
  maxPlaybackRate: DEFAULT_MAX_PLAYBACK_RATE,
  maxConcurrentJobs: DEFAULT_MAX_CONCURRENT_JOBS,
  failOnRejectedSegment: true,
});

/** Default provider resolver: no authorized provider (compliant fallback). */
const defaultResolveProvider: ResolveAuthorizedProvider = async () => undefined;

// --- Public entry point ---------------------------------------------------

/**
 * Orchestrates the full prototype package preparation per the design
 * pseudocode, returning the coherent {@link TranslationManifest}.
 *
 * The original package (original variant + normalized transcript) is always
 * produced when the source is valid; the avatar variant is best-effort and its
 * failure degrades to the avatar-less fallback (Req 13.1/13.2) unless
 * `fallbackOnAvatarFailure` is explicitly disabled.
 *
 * @throws {PipelineError} with a `PipelineErrorCode` when the *original*
 *   package cannot be produced (invalid SRT, duration mismatch, failed
 *   original transcode) — or, when `fallbackOnAvatarFailure` is `false`, when
 *   the avatar path fails.
 */
export async function preparePrototypePackage(
  options: PreparePrototypePackageOptions,
): Promise<TranslationManifest> {
  const {
    sourceVideo,
    srtText,
    writeTranscript,
    originalOutputUri,
    probeOriginal,
  } = options;

  const policy = options.policy ?? DEFAULT_GENERATION_POLICY;
  const placement = options.placement ?? DEFAULT_AVATAR_PLACEMENT;
  const resolveProvider = options.resolveProvider ?? defaultResolveProvider;
  const fallbackOnAvatarFailure = options.fallbackOnAvatarFailure ?? true;

  // --- Step 1: inspect media (ffprobe) — blocking for the whole package --
  const media = await inspectMedia(sourceVideo, options.inspect);
  assertExpectedDuration(media, options.expectedDurationMs, sourceVideo);

  // --- Step 2: parse + normalize the SRT against the measured duration ---
  const cues = parseAndNormalizeSrt(srtText, media.durationMs, options.srt);

  // --- Step 3: transcode the source to the H.264/AAC `original` variant --
  // A failure here blocks the original package itself — it is not an avatar
  // concern — so it propagates as a blocking PipelineError.
  await transcodeOriginal(sourceVideo, originalOutputUri, options.transcode);
  const original = await probeOriginal(originalOutputUri);
  assertOriginalVariant(original, originalOutputUri);

  // Persist the normalized transcript so the manifest can reference it. This
  // is part of the *original* package (Req 12.1), so a failure is blocking.
  const transcriptUri = await writeTranscript(cues);

  // --- Step 4: resolve an authorized provider (Req 7.1) ------------------
  // No authorized provider → straight to the avatar-less fallback. No provider
  // object is constructed or called.
  const provider = await resolveProvider(policy);
  if (provider === undefined) {
    return createManifestWithFallback(original, transcriptUri, {
      kind: "unavailable",
      code: "NO_AUTHORIZED_PROVIDER",
      reason:
        "Nenhuma API pública contratável e autorizada está configurada.",
    });
  }

  // --- Avatar path (best-effort, never blocks the original) --------------
  try {
    return await prepareWithAvatar({
      provider,
      cues,
      policy,
      placement,
      original,
      transcriptUri,
      sourceVideo,
      generateOptions: options.generate,
      fitOptions: options.fit,
      renderOptions: options.render,
      validateOptions: options.validate,
    });
  } catch (error) {
    // The avatar path failed. Honor Req 13.1: a generation failure must not
    // block the original package. Degrade to the avatar-less fallback with the
    // mapped reason — unless the caller opted into the abort-per-policy path.
    if (!fallbackOnAvatarFailure) {
      throw error;
    }
    return createManifestWithFallback(
      original,
      transcriptUri,
      avatarFailureToUnavailable(error),
    );
  }
}

// --- Avatar sub-flow -------------------------------------------------------

type PrepareWithAvatarArgs = Readonly<{
  provider: AvatarProvider;
  cues: readonly TranscriptCue[];
  policy: GenerationPolicy;
  placement: BoundingBox;
  original: MediaVariant;
  transcriptUri: Uri;
  sourceVideo: Uri;
  generateOptions: GenerateAvatarSegmentsOptions | undefined;
  fitOptions: AnalyzeTemporalFitOptions | undefined;
  renderOptions: RenderPrototypeVariantOptions | undefined;
  validateOptions: ValidateTechnicalPackageOptions | undefined;
}>;

/**
 * Runs the avatar branch of the pseudocode: build requests, generate segments,
 * re-fit each against its SRT interval, compose the prototype variant, validate
 * the package and build the avatar-available manifest.
 *
 * Returns the avatar-less fallback manifest (never throws) when the generation
 * result is `unavailable` (Req 12.3) or when temporal re-fit rejects a segment
 * under the `failOnRejectedSegment` policy (Req 10.4). It throws only on a
 * genuine avatar-path error (render/validate failure), which the caller turns
 * into a fallback (Req 13.1) or rethrows per policy.
 */
async function prepareWithAvatar(
  args: PrepareWithAvatarArgs,
): Promise<TranslationManifest> {
  const requests = buildAvatarRequests(args.cues);

  // --- Step 5: generate segments through the gateway ---------------------
  const generation = await generateAvatarSegments(
    args.provider,
    requests,
    args.policy,
    args.generateOptions,
  );

  // An `unavailable` result is an expected, compliant outcome: fall back with
  // the recorded reason and no avatar variant (Req 12.3).
  if (generation.kind === "unavailable") {
    return createManifestWithFallback(
      args.original,
      args.transcriptUri,
      generation,
    );
  }

  // --- Step 6: re-analyze temporal fit against each SRT interval ---------
  // The gateway emits segments in a neutral, unclassified state; the authority
  // on fit is `analyzeTemporalFit`, re-run here against the request interval.
  const fitted = refitSegments(
    generation.segments,
    args.policy.maxPlaybackRate,
    args.fitOptions,
  );

  // A rejected segment blocks the avatar variant — the animation is never
  // truncated (Req 10.4). Under `failOnRejectedSegment` we degrade to the
  // avatar-less fallback rather than shipping a partial avatar (Req 12.6).
  const rejected = fitted.filter((s) => s.fitStatus === "rejected");
  if (rejected.length > 0) {
    return createManifestWithFallback(args.original, args.transcriptUri, {
      kind: "unavailable",
      code: "POLICY_REJECTED",
      reason:
        `Encaixe temporal rejeitou ${rejected.length} segmento(s) ` +
        `(${rejected
          .map((s) => s.request.requestId)
          .join(", ")}); a variante de avatar foi bloqueada sem truncar a ` +
        "animação.",
    });
  }

  // --- Step 7: compose the prototype variant over the source -------------
  const renderOptions = requireRenderOptions(args.renderOptions);
  const renderResult = await renderPrototypeVariant(
    args.sourceVideo,
    fitted,
    args.placement,
    { ...renderOptions, expectedDurationMs: args.original.durationMs },
  );
  const prototype = renderResult.variant;

  // --- Step 8: validate the technical package ----------------------------
  await validateTechnicalPackage(args.original, prototype, args.cues, generation, {
    ...args.validateOptions,
    disclosureBurnedIn: args.validateOptions?.disclosureBurnedIn ?? true,
    manifestDisclosure:
      args.validateOptions?.manifestDisclosure ?? MANIFEST_DISCLOSURE,
  });

  // --- Step 9: build the avatar-available manifest -----------------------
  return createManifestWithFallback(
    args.original,
    args.transcriptUri,
    generation,
    prototype,
  );
}

// --- Helpers ---------------------------------------------------------------

/**
 * Re-classifies each generated segment against its request's SRT interval via
 * {@link analyzeTemporalFit}, so the fit status reflects the real animation
 * duration rather than the gateway's neutral placeholder.
 */
function refitSegments(
  segments: readonly GeneratedAvatarSegment[],
  maxPlaybackRate: number,
  fitOptions: AnalyzeTemporalFitOptions | undefined,
): GeneratedAvatarSegment[] {
  return segments.map((segment) =>
    analyzeTemporalFit(
      segment.asset,
      segment.request,
      maxPlaybackRate,
      fitOptions,
    ),
  );
}

/**
 * Guards that the probed original variant is actually the `"original"` kind.
 * A misconfigured `probeOriginal` returning the wrong kind would otherwise
 * corrupt the manifest downstream; fail loudly instead.
 */
function assertOriginalVariant(
  original: MediaVariant,
  outputUri: Uri,
): void {
  if (original.kind !== "original") {
    throw PipelineError.assetIntegrityFailed(
      `A variante original probada precisa ter kind 'original', ` +
        `recebida '${original.kind}'.`,
      { details: { kind: original.kind, uri: outputUri } },
    );
  }
}

/**
 * Asserts the measured duration matches `expectedDurationMs` when the caller
 * supplied one, mirroring the pseudocode's explicit assertion. A mismatch is a
 * blocking `DURATION_MISMATCH` (the original package cannot be trusted).
 */
function assertExpectedDuration(
  media: MediaInspection,
  expectedDurationMs: Milliseconds | undefined,
  sourceVideo: Uri,
): void {
  if (expectedDurationMs === undefined) {
    return;
  }
  if (media.durationMs !== expectedDurationMs) {
    throw PipelineError.durationMismatch(
      `Duração medida (${media.durationMs} ms) diverge da esperada ` +
        `(${expectedDurationMs} ms) para ${sourceVideo}.`,
      {
        details: {
          sourceVideo,
          measuredDurationMs: media.durationMs,
          expectedDurationMs,
        },
      },
    );
  }
}

/**
 * Returns the render options or throws a blocking error. A resolved provider
 * with no render configuration cannot compose the avatar variant; rather than
 * silently skipping the step, fail so the caller's fallback branch records it.
 */
function requireRenderOptions(
  renderOptions: RenderPrototypeVariantOptions | undefined,
): RenderPrototypeVariantOptions {
  if (renderOptions === undefined) {
    throw new PipelineError(
      "GENERATION_FAILED",
      "Provedor autorizado resolvido, mas nenhuma configuração de render " +
        "(ffmpeg/saída) foi fornecida para compor a variante de avatar.",
    );
  }
  return renderOptions;
}

/**
 * Maps an avatar-path error to an explicit `unavailable` generation result so
 * the fallback manifest carries a faithful, auditable reason. A
 * {@link PipelineError} keeps its code; any other error is normalized to a
 * generic generation failure.
 */
function avatarFailureToUnavailable(
  error: unknown,
): Extract<AvatarGenerationResult, { kind: "unavailable" }> {
  if (isPipelineError(error)) {
    // Only three codes are representable on an `unavailable` result; any other
    // blocking code (e.g. TEMPORAL_OVERRUN, GENERATION_FAILED,
    // ASSET_INTEGRITY_FAILED, DURATION_MISMATCH) still means the avatar is not
    // available, so it is surfaced as POLICY_REJECTED with the original code in
    // the reason for auditability.
    const code: Extract<
      AvatarGenerationResult,
      { kind: "unavailable" }
    >["code"] =
      error.code === "NO_AUTHORIZED_PROVIDER" ||
      error.code === "PROVIDER_UNAVAILABLE" ||
      error.code === "POLICY_REJECTED"
        ? error.code
        : "POLICY_REJECTED";
    return {
      kind: "unavailable",
      code,
      reason: `${error.code}: ${error.message}`,
    };
  }
  return {
    kind: "unavailable",
    code: "PROVIDER_UNAVAILABLE",
    reason: `Falha inesperada na geração do avatar: ${String(error)}`,
  };
}
