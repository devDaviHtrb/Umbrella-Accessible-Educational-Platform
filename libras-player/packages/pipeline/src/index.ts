// Pipeline package entry point.
//
// Scaffolding only. Domain logic (media inspection, avatar generation
// gateway, temporal fit, rendering, manifest) is implemented in later tasks.

export const PACKAGE_NAME = "@libras/pipeline";

// Shared domain contracts (types and interfaces from the design document).
export type * from "./domain/types.js";

// Runtime error carrier for blocking pipeline failures.
export { PipelineError, isPipelineError } from "./domain/PipelineError.js";
export type { PipelineErrorOptions } from "./domain/PipelineError.js";

// SRT parsing and normalization.
export {
  parseAndNormalizeSrt,
  DEFAULT_CLAMP_TOLERANCE_MS,
} from "./srt/parseAndNormalizeSrt.js";
export type {
  ParseAndNormalizeSrtOptions,
  ClampEvent,
} from "./srt/parseAndNormalizeSrt.js";

// Media inspection via ffprobe.
export {
  inspectMedia,
  buildFfprobeArgs,
  parseFfprobeOutput,
  mimeTypeFromFormat,
  EXPECTED_DURATION_MS,
  DEFAULT_DURATION_TOLERANCE_MS,
} from "./media/inspectMedia.js";
export type {
  MediaInspection,
  InspectMediaOptions,
  CommandRunner,
  FileHasher,
} from "./media/inspectMedia.js";

// Avatar segment request construction.
export {
  buildAvatarRequests,
  DEFAULT_GROUP_MAX_GAP_MS,
  DEFAULT_JOIN_WITH,
} from "./avatar/buildAvatarRequests.js";
export type { BuildAvatarRequestsOptions } from "./avatar/buildAvatarRequests.js";

// Avatar provider gateway and segment generation.
export {
  AvatarProviderGateway,
  generateAvatarSegments,
  idempotencyKeyFor,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_BASE_BACKOFF_MS,
  DEFAULT_MAX_BACKOFF_MS,
  DEFAULT_MAX_POLL_ATTEMPTS,
  DEFAULT_POLL_INTERVAL_MS,
} from "./avatar/gateway.js";
export type {
  AvatarProviderGatewayOptions,
  GenerateAvatarSegmentsOptions,
  Clock,
  Sleeper,
  AssetHasher,
  RequestBuilder,
} from "./avatar/gateway.js";

// Authorized-use, secure-download and retention policy for the gateway.
export {
  assertAuthorizedOperationUrl,
  isAuthorizedOperationUrl,
  assertSecureDownload,
  evaluateRetention,
  FORBIDDEN_HOST_SUFFIXES,
  DEFAULT_MAX_DOWNLOAD_BYTES,
  DEFAULT_ALLOWED_MIME_TYPES,
} from "./avatar/policy.js";
export type {
  AuthorizedUsePolicy,
  SecureDownloadPolicy,
  DownloadDescriptor,
  RetentionPolicy,
  RetentionDecision,
} from "./avatar/policy.js";

// Temporal fit analysis for generated avatar segments.
export {
  analyzeTemporalFit,
  DEFAULT_FIT_TOLERANCE_MS,
} from "./avatar/analyzeTemporalFit.js";
export type { AnalyzeTemporalFitOptions } from "./avatar/analyzeTemporalFit.js";

// Avatar variant composition (prototype rendering) via ffmpeg.
export {
  renderPrototypeVariant,
  buildRenderPrototypeArgs,
  assertRenderableSegments,
  assertPlacementWithinBounds,
  escapeDrawtext,
  DISCLOSURE_TEXT,
  DEFAULT_FRAME_TOLERANCE_MS,
} from "./render/renderPrototypeVariant.js";
export type {
  RenderPrototypeVariantOptions,
  RenderPrototypeVariantResult,
  RenderCommandResult,
  FfmpegExecutor,
  RenderedMediaProbe,
  RenderedMediaInfo,
  OutputHasher,
} from "./render/renderPrototypeVariant.js";

// Technical package validation (Package Validator component).
export {
  validateTechnicalPackage,
  hashFileSha256,
  EXPECTED_VIDEO_CODEC,
  EXPECTED_AUDIO_CODEC,
  EXPECTED_MIME_TYPE,
  DEFAULT_FRAME_TOLERANCE_MS as PACKAGE_DEFAULT_FRAME_TOLERANCE_MS,
  DISCLOSURE_TEXT as PACKAGE_DISCLOSURE_TEXT,
  TRANSLATION_LIMITATIONS,
} from "./package/validateTechnicalPackage.js";
export type {
  ValidateTechnicalPackageOptions,
  ValidationReport,
  VariantReport,
  VariantHasher,
} from "./package/validateTechnicalPackage.js";

// Versioned, immutable manifest creation and package writing.
export {
  createManifestWithFallback,
  createRealtimeManifest,
  writePackage,
  writeRealtimePackage,
  defaultArtifactReader,
  defaultArtifactWriter,
  defaultPathExists,
  defaultBytesHasher,
  MANIFEST_DISCLOSURE,
  MANIFEST_FILE_NAME,
  ORIGINAL_FILE_NAME,
  PROTOTYPE_FILE_NAME,
  TRANSCRIPT_FILE_NAME,
  CHECKSUMS_FILE_NAME,
  AVATAR_RUNTIME_FILE_NAME,
} from "./package/createManifest.js";
export type {
  ArtifactReader,
  ArtifactWriter,
  PathExists,
  BytesHasher,
  WritePackageOptions,
  WritePackageResult,
  WriteRealtimePackageOptions,
  ArtifactChecksum,
} from "./package/createManifest.js";

// End-to-end pipeline orchestration (`preparePrototypePackage`).
export {
  preparePrototypePackage,
  DEFAULT_AVATAR_PLACEMENT,
  DEFAULT_GENERATION_POLICY,
  DEFAULT_MAX_PLAYBACK_RATE,
  DEFAULT_MAX_CONCURRENT_JOBS,
} from "./preparePrototypePackage.js";
export type {
  PreparePrototypePackageOptions,
  ResolveAuthorizedProvider,
  AvatarProvider,
  TranscriptWriter,
  ProbeOriginalVariant,
} from "./preparePrototypePackage.js";

// NOTE: the end-to-end harness (`./e2e/runRealMedia.js`) is intentionally NOT
// re-exported from this public barrel. It is a Node-only CLI tool that reads
// `process.argv` at module load, which breaks when the barrel is bundled into
// a browser/React Native context (the app imports `@libras/pipeline`). Run the
// harness directly: `node packages/pipeline/dist/e2e/runRealMedia.js --v3`.
