// Domain types for the Libras Translation Player pipeline.
//
// These are the TypeScript contracts defined in the design document
// ("Components and Interfaces" + "Data Models"). They are the source of
// truth for the pipeline, provider adapter and React Native player.
//
// No runtime logic lives here — only types and interfaces. Implementations
// are added in later tasks.
//
// --- Schema versions: v2 (legacy) vs v3 (current) ------------------------
//
// v2 (LEGACY / DEPRECATED path): the original design (ADR-001) composed an
// offline `prototype-avatar.mp4` avatar window over the source. This is kept
// in the repository as an optional legacy mode. It is characterized by
// `schemaVersion: 2`, the `MediaVariant` kind `"automatic-avatar-prototype"`,
// and the `AvatarMode` value `"automatic-prototype"`. Nothing here is removed
// so the legacy pipeline, provider adapter and player keep compiling.
//
// v3 (CURRENT / main path, ADR-002): the real VLibras 3D avatar is rendered
// LIVE by the official `vlibras-player-webjs` (Unity/WebGL, LGPLv3) embedded in
// a WebView; the native video player is the master clock; avatar firing is
// driven by SRT cue transitions. It is characterized by `schemaVersion: 3`,
// the `AvatarMode` value `"realtime-webview-prototype"`, an `AvatarRuntimeConfig`
// (`avatarRuntime`) and a `variants` list restricted to the `original` variant.
//
// To extend without breaking the legacy build, enumerations and manifest
// fields are widened backward-compatibly: `AvatarMode` and
// `MediaVariant["kind"]` are unions covering both paths, `schemaVersion`
// accepts `2 | 3`, new manifest/snapshot fields are optional, and a dedicated
// `TranslationManifestV3` marks the current main path explicitly.

// --- Scalar aliases -------------------------------------------------------

export type Milliseconds = number;
export type MediaId = string;
export type Uri = string;
export type Sha256 = string;

// --- Enumerated string unions --------------------------------------------

// `"automatic-prototype"` is the v2 (legacy) offline-composition mode.
// `"realtime-webview-prototype"` is the v3 (current) live-WebView avatar mode.
export type AvatarMode =
  | "automatic-prototype"
  | "realtime-webview-prototype"
  | "unavailable";
export type ProviderKind = "self-hosted-vlibras" | "contracted-public-api";
export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export type FitStatus = "fits" | "underflow" | "overrun" | "rejected";

/**
 * Runtime state of the live (v3) avatar rendered inside the WebView by
 * `vlibras-player-webjs`. Drives UI affordances and fallback handling.
 */
export type AvatarRuntimeState =
  | "idle"
  | "loading"
  | "ready"
  | "translating"
  | "playing"
  | "error";

// --- Transcript -----------------------------------------------------------

export type TranscriptCue = Readonly<{
  id: string;
  /**
   * 1-based source index of the cue within the SRT (preserved from the
   * parser's `sourceIndex`). Populated by `parseAndNormalizeSrt`.
   */
  index: number;
  startMs: Milliseconds;
  endMs: Milliseconds;
  textPtBr: string;
  sourceFormat: "srt";
}>;

// --- Avatar generation (v2 legacy offline composition) --------------------

export type AvatarSegmentRequest = Readonly<{
  requestId: string;
  cueIds: readonly string[];
  textPtBr: string;
  targetStartMs: Milliseconds;
  targetEndMs: Milliseconds;
}>;

export type AvatarAsset = Readonly<{
  requestId: string;
  uri: Uri;
  mimeType: string;
  durationMs: Milliseconds;
  sha256: Sha256;
  transparentBackground: boolean;
}>;

export type GeneratedAvatarSegment = Readonly<{
  request: AvatarSegmentRequest;
  asset: AvatarAsset;
  fitStatus: FitStatus;
  playbackRate: number;
  warnings: readonly string[];
}>;

export type ProviderProvenance = Readonly<{
  kind: ProviderKind;
  implementationVersion: string;
  modelOrDictionaryVersion?: string;
  generatedAt: string;
  termsOrLicenseReviewId: string;
}>;

// --- Media variants & manifest -------------------------------------------

// `"automatic-avatar-prototype"` is the v2 (legacy) pre-rendered avatar
// variant. The v3 main path publishes only the `"original"` variant.
export type MediaVariant = Readonly<{
  kind: "original" | "automatic-avatar-prototype";
  uri: Uri;
  mimeType: "video/mp4";
  videoCodec: "h264";
  audioCodec: "aac";
  durationMs: Milliseconds;
  width: number;
  height: number;
  sha256: Sha256;
}>;

/**
 * The only media variant published by the v3 main path: the compatible
 * `original.mp4`. No pre-rendered avatar variant is referenced.
 */
export type OriginalMediaVariant = Readonly<MediaVariant & { kind: "original" }>;

/**
 * Configuration for the live (v3) avatar runtime: the HTML page that
 * instantiates `vlibras-player-webjs`, the chosen avatar, default speed, the
 * (always true) dependency on online VLibras services, and the recorded
 * license review id (LGPLv3 + avatar/dictionary rights).
 */
export type AvatarRuntimeConfig = Readonly<{
  playerBundleUri: Uri; // HTML page that instantiates vlibras-player-webjs
  avatarName: string; // e.g. "icaro" | "hosana" | "guga"
  defaultSpeed: number; // setSpeed()
  requiresOnlineServices: true; // text->gloss translation and online dictionary
  licenseReviewId: string; // LGPLv3 + avatar/dictionary rights review
}>;

/**
 * Shared manifest shape covering both schema versions. Kept so legacy (v2)
 * consumers keep compiling: `schemaVersion` accepts `2 | 3`, the v2 provider
 * field stays optional, and the v3 `avatarRuntime` is optional.
 *
 * For new (v3) code prefer {@link TranslationManifestV3}, which pins
 * `schemaVersion: 3` and restricts `variants` to the original variant.
 */
export type TranslationManifest = Readonly<{
  schemaVersion: 2 | 3;
  mediaId: MediaId;
  durationMs: Milliseconds;
  avatarMode: AvatarMode;
  avatarAvailable: boolean;
  disclosure: "Tradução automática experimental por avatar; não equivale a intérprete humano.";
  variants: readonly MediaVariant[];
  transcriptUri: Uri;
  /** v2 (legacy) offline-generation provenance. */
  provider?: ProviderProvenance;
  /** v3 (current) live-avatar runtime configuration. */
  avatarRuntime?: AvatarRuntimeConfig;
  generationWarnings: readonly string[];
}>;

/**
 * v3 main-path manifest. Pins `schemaVersion: 3` and restricts `variants` to
 * the original variant only; the live avatar is described by `avatarRuntime`
 * rather than a pre-rendered media variant.
 */
export type TranslationManifestV3 = Readonly<{
  schemaVersion: 3;
  mediaId: MediaId;
  durationMs: Milliseconds;
  avatarMode: AvatarMode;
  avatarAvailable: boolean; // live-avatar capability configured
  disclosure: "Tradução automática experimental por avatar; não equivale a intérprete humano.";
  variants: readonly OriginalMediaVariant[]; // only the original variant
  transcriptUri: Uri;
  avatarRuntime?: AvatarRuntimeConfig;
  generationWarnings: readonly string[];
}>;

// --- Provider health & jobs (v2 legacy) ----------------------------------

export type ProviderHealth = Readonly<{
  available: boolean;
  authorizedForRequestedUse: boolean;
  reason?: string;
}>;

export type AvatarJob = Readonly<{
  jobId: string;
  status: JobStatus;
  outputUri?: Uri;
  errorCode?: string;
}>;

export type GenerationPolicy = Readonly<{
  usage: "internal-nonproduction-prototype";
  maxPlaybackRate: number;
  maxConcurrentJobs: number;
  failOnRejectedSegment: true;
}>;

export type AvatarGenerationResult =
  | Readonly<{
      kind: "generated";
      segments: readonly GeneratedAvatarSegment[];
      provenance: ProviderProvenance;
    }>
  | Readonly<{
      kind: "unavailable";
      code: "NO_AUTHORIZED_PROVIDER" | "PROVIDER_UNAVAILABLE" | "POLICY_REJECTED";
      reason: string;
    }>;

// --- Playback -------------------------------------------------------------

/**
 * Snapshot of player state. The v3 fields `avatarRuntimeState` and
 * `activeCueId` are optional so legacy (v2) construction sites keep compiling;
 * v3 code populates them from the live avatar runtime and the CueScheduler.
 */
export type PlaybackSnapshot = Readonly<{
  mediaId: MediaId;
  positionMs: Milliseconds;
  durationMs: Milliseconds;
  isPlaying: boolean;
  isBuffering: boolean;
  automaticAvatarEnabled: boolean;
  automaticAvatarAvailable: boolean;
  /** v3: runtime state of the live WebView avatar. */
  avatarRuntimeState?: AvatarRuntimeState;
  /** v3: id of the cue currently active per the video master clock. */
  activeCueId?: string | null;
}>;

// --- Rendering ------------------------------------------------------------

export type BoundingBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

// --- Error codes ----------------------------------------------------------

export type PipelineErrorCode =
  | "INVALID_SRT"
  | "DURATION_MISMATCH"
  | "NO_AUTHORIZED_PROVIDER"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "GENERATION_FAILED"
  | "TEMPORAL_OVERRUN"
  | "ASSET_INTEGRITY_FAILED"
  | "POLICY_REJECTED";

// --- Avatar runtime bridge messages (v3) ---------------------------------

/**
 * Messages sent from the React Native app to the WebView hosting
 * `vlibras-player-webjs` (via `postMessage`).
 */
export type AppToWebMessage =
  | Readonly<{ type: "init"; config: AvatarRuntimeConfig }>
  | Readonly<{ type: "cue"; cueId: string; text: string }>
  | Readonly<{ type: "pause" }>
  | Readonly<{ type: "stop" }>
  | Readonly<{ type: "setSpeed"; speed: number }>
  | Readonly<{ type: "changeAvatar"; name: string }>;

/**
 * Messages emitted by the WebView (re-broadcasting `vlibras-player-webjs`
 * events) back to the React Native app.
 */
export type WebToAppMessage =
  | Readonly<{ type: "load" }> // player loaded
  | Readonly<{ type: "gloss:start"; cueId: string }>
  | Readonly<{ type: "animation:progress"; value: number }>
  | Readonly<{ type: "gloss:end"; cueId: string }>
  | Readonly<{ type: "animation:end"; cueId: string }>
  | Readonly<{ type: "error"; code: string; message: string }>;

// --- Interfaces -----------------------------------------------------------

export interface AvatarTranslationProvider {
  readonly kind: ProviderKind;
  healthCheck(): Promise<ProviderHealth>;
  submit(request: AvatarSegmentRequest): Promise<{ jobId: string }>;
  getJob(jobId: string): Promise<AvatarJob>;
  download(job: AvatarJob): Promise<AvatarAsset>;
}

export interface AvatarProviderGateway {
  generate(
    cues: readonly TranscriptCue[],
    policy: GenerationPolicy,
  ): Promise<AvatarGenerationResult>;
}

export interface TranslationPackageRepository {
  getManifest(mediaId: MediaId): Promise<TranslationManifest>;
}

export interface LibrasPlayerController {
  load(manifest: TranslationManifest): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seek(positionMs: Milliseconds): Promise<void>;
  setAutomaticAvatar(enabled: boolean): Promise<void>;
  getSnapshot(): PlaybackSnapshot;
}

/**
 * Serializes app↔WebView messages for the live (v3) avatar. The native video
 * player remains the master clock; the bridge only forwards cue text and
 * control messages and surfaces WebView events.
 */
export interface AvatarBridge {
  init(config: AvatarRuntimeConfig): void;
  sendCue(cueId: string, text: string): void;
  pause(): void;
  stop(): void;
  onMessage(handler: (msg: WebToAppMessage) => void): void;
}

/**
 * Resolves the active cue from the video master-clock position and emits a
 * transition whenever the active cue changes. Pure resolution; never moves the
 * video.
 */
export interface CueScheduler {
  // Driven by the video player position (master clock)
  resolveCueAt(positionMs: Milliseconds): TranscriptCue | null;
  // Emits a transition when the active cue changes
  onCueChange(handler: (cue: TranscriptCue | null) => void): void;
}

/**
 * Surface of the official player exposed inside the WebView
 * (`vlibras-player-webjs`). Not implemented by us; consumed by the embedded
 * HTML page.
 *
 * Events: "load" | "gloss:start" | "gloss:end" | "animation:progress"
 *         | "animation:end" | "error".
 */
export interface VLibrasWebPlayer {
  // new VLibras.Player({ target: { name, path } })
  // `wrapperElement` is a DOM element inside the WebView page; typed as
  // `unknown` here so this Node package does not depend on the DOM lib. The
  // WebView HTML page (which does have the DOM) passes the real element.
  load(wrapperElement: unknown): void;
  translate(text: string): void;
  play(gloss?: string): void;
  pause(): void;
  stop(): void;
  setSpeed(speed: number): void;
  changeAvatar(name: string): void;
  toggleSubtitle(): void;
}
