// Mobile app entry point.
//
// Exposes the translation package repository, the React Native player
// controller and the `LibrasTranslationPlayer` component.

export const APP_NAME = "@libras/mobile";

// Translation package repository: loads the versioned manifest over HTTPS.
export {
  HttpsTranslationPackageRepository,
  createHttpsTranslationPackageRepository,
  assertTranslationManifest,
  ManifestRepositoryError,
  MANIFEST_FILE_NAME,
  SUPPORTED_SCHEMA_VERSION,
  DEFAULT_REVISION,
} from "./data/packageRepository";
export type {
  FetchLike,
  FetchLikeResponse,
  HttpsTranslationPackageRepositoryOptions,
  ManifestRepositoryErrorCode,
} from "./data/packageRepository";

// React Native player controller: drives a single native player that always
// plays the `original` variant (master clock + sole audio) and toggles the
// live avatar WebView overlay through an injected AvatarBridge, reporting a
// playback snapshot with the live-avatar runtime state and active cue.
export {
  LibrasPlayerController,
  LibrasPlayerControllerError,
  createLibrasPlayerController,
  selectVariant,
  isAvatarAvailable,
} from "./player/controller";
export type {
  NativeMediaPlayer,
  LibrasPlayerControllerErrorCode,
  LibrasPlayerControllerOptions,
} from "./player/controller";

// react-native-video adapter for the controller's native-player boundary.
export {
  VideoRefNativeMediaPlayer,
  secondsToMs,
  msToSeconds,
} from "./player/videoRefPlayer";

// The React Native player component.
export {
  LibrasTranslationPlayer,
  findActiveCue,
  PLAYER_DISCLOSURE_TEXT,
  AVATAR_UNAVAILABLE_TEXT,
} from "./player/LibrasTranslationPlayer";
export type {
  LibrasTranslationPlayerProps,
  ManifestSource,
} from "./player/LibrasTranslationPlayer";

// CueScheduler: resolves the active cue from the native video clock and
// emits a transition only when the active cue changes.
export { resolveCueAt, createCueScheduler } from "./player/cueScheduler";
export type {
  CueScheduler,
  CueChangeHandler,
  Unsubscribe,
} from "./player/cueScheduler";

// AvatarBridge: serializes app↔WebView messages for the live (v3) avatar via
// an injectable transport; deserializes inbound WebView events defensively.
export {
  WebViewAvatarBridge,
  createWebViewAvatarBridge,
  isWebToAppMessage,
} from "./player/avatarBridge";
export type {
  WebViewTransport,
  WebViewAvatarBridgeOptions,
  WebToAppMessageHandler,
  MalformedMessageLogger,
} from "./player/avatarBridge";

// Avatar runtime fallback: `handleAvatarRuntimeFailure` derives a video +
// audio + SRT-captions snapshot when the live (v3) avatar WebView errors,
// without depending on the avatar or the VLibras online services at playback.
export {
  handleAvatarRuntimeFailure,
  shouldShowCaptions,
} from "./player/avatarRuntimeFallback";
export type { AvatarRuntimeErrorMessage } from "./player/avatarRuntimeFallback";

// Avatar runtime policy (task 12.1): offline/service-unavailability detection,
// the live-avatar origin allowlist (HTTPS + official VLibras hosts, local
// file:// bundle; hard-denies the hosted "VLibras Vídeo"), and the injectable
// WebView load-timeout watchdog that synthesizes a `WEBVIEW_LOAD_TIMEOUT`
// error to drive `handleAvatarRuntimeFailure`. Pure/testable utilities; the
// avatar communication stays restricted to sending cue text.
export {
  mapCauseToErrorMessage,
  isAllowedAvatarOrigin,
  assertAllowedAvatarOrigin,
  createAvatarLoadTimeout,
  AvatarOriginError,
  ALLOWED_AVATAR_HOST_SUFFIXES,
  FORBIDDEN_AVATAR_HOST_SUFFIXES,
  ALLOWED_AVATAR_SCHEMES,
  DEFAULT_AVATAR_LOAD_TIMEOUT_MS,
} from "./player/avatarRuntime";
export type {
  RuntimeErrorCode,
  AvatarErrorMessage,
  AvatarFailureCause,
  AllowedAvatarOriginOptions,
  SetTimer,
  ClearTimer,
  TimerHandle,
  AvatarLoadTimeout,
  AvatarLoadTimeoutOptions,
} from "./player/avatarRuntime";
