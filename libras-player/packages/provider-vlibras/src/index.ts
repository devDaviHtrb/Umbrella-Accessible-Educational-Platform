// VLibras provider adapter entry point.
//
// Exposes the concrete VLibrasSelfHostedProvider (an AvatarTranslationProvider
// implementation) plus the injectable dependencies used to keep it testable
// and compliant: the SecretManager contract and the HTTP transport.

export const PACKAGE_NAME = "@libras/provider-vlibras";

export {
  VLibrasSelfHostedProvider,
  PROTOTYPE_USAGE,
  DEFAULT_BASE_URL,
} from "./VLibrasSelfHostedProvider.js";
export type {
  VLibrasSelfHostedConfig,
  VLibrasSelfHostedDeps,
  RightsReview,
} from "./VLibrasSelfHostedProvider.js";
export type { SecretManager } from "./SecretManager.js";
export type { HttpClient, HttpRequest, HttpResponse } from "./http.js";
export { defaultHttpClient } from "./http.js";

export {
  evaluateProviderHealth,
  resolveProviderAvailability,
  classifyHealthError,
  DEFAULT_HEALTH_TIMEOUT_MS,
} from "./health.js";
export type {
  EvaluateHealthOptions,
  ProviderAvailability,
  HealthFailureKind,
  TimerHandle,
} from "./health.js";
