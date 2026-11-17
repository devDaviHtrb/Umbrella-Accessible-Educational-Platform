// Concrete AvatarTranslationProvider for a self-hosted VLibras Translator API.
//
// This adapter talks to a controlled, isolated deployment of the public
// `spbgovbr-vlibras/vlibras-translator-api` repository over HTTP. It is a
// prototype-only path (Requirement 8): it never targets the hosted gov.br
// service, never infers private endpoints, and never automates VLibras
// Vídeo. The token is read from a backend secret manager, never from the
// app or the manifest.
//
// Compliance boundaries enforced here (see design "Security, Privacy,
// Licensing, and Deployment" and Requirements 8, 15, 17, 18):
//   - Base URL defaults to localhost and must point at a private host; any
//     gov.br / VLibras hosted domain is rejected at construction time.
//   - `healthCheck` reports `authorizedForRequestedUse: false` unless an
//     approved rights-review id (`termsOrLicenseReviewId`) is configured.
//   - The API token comes from an injectable SecretManager.
//   - Usage is pinned to "internal-nonproduction-prototype".

import type {
  AvatarAsset,
  AvatarJob,
  AvatarSegmentRequest,
  AvatarTranslationProvider,
  JobStatus,
  ProviderHealth,
  ProviderKind,
} from "@libras/pipeline";

import {
  type HttpClient,
  type HttpResponse,
  defaultHttpClient,
} from "./http.js";
import type { SecretManager } from "./SecretManager.js";

/** Usage mode this adapter is pinned to; no other mode is permitted. */
export const PROTOTYPE_USAGE = "internal-nonproduction-prototype" as const;

/** Default base URL: the local Docker dev stack, never a hosted endpoint. */
export const DEFAULT_BASE_URL = "http://localhost:8080";

/**
 * Identifiers of the rights review covering the self-hosted deployment.
 *
 * The provider is authorized only when `termsOrLicenseReviewId` is present
 * (Requirement 8.4). The asset/model review ids are recorded alongside it
 * for provenance (Requirement 8.3).
 */
export type RightsReview = Readonly<{
  /** Approved license/terms review id. Absent => not authorized. */
  termsOrLicenseReviewId?: string;
  /** Review id for generated assets (avatars, output rights). */
  assetsReviewId?: string;
  /** Review id for models/dictionaries used by the deployment. */
  modelsReviewId?: string;
}>;

/** Configuration for the adapter. All network identity is explicit. */
export type VLibrasSelfHostedConfig = Readonly<{
  /** Base URL of the self-hosted API. Defaults to {@link DEFAULT_BASE_URL}. */
  baseUrl?: string;
  /** Secret id resolved via the SecretManager to obtain the API token. */
  tokenSecretId: string;
  /** Rights-review identifiers gating authorization and provenance. */
  rightsReview: RightsReview;
  /** Reported implementation version (recorded in provenance upstream). */
  implementationVersion: string;
  /** Optional model/dictionary version reported by the deployment. */
  modelOrDictionaryVersion?: string;
  /** Per-request timeout in milliseconds. Defaults to 30_000. */
  requestTimeoutMs?: number;
  /** Max asset download size in bytes (Requirement 17.3). Default 50 MiB. */
  maxDownloadBytes?: number;
  /** Allowlisted output MIME types (Requirement 17.3). */
  allowedMimeTypes?: readonly string[];
}>;

/** Dependencies injected for testability. */
export type VLibrasSelfHostedDeps = Readonly<{
  secretManager: SecretManager;
  /** Injectable transport; defaults to the global fetch wrapper. */
  httpClient?: HttpClient;
  /** Injectable SHA-256 hasher over bytes; defaults to node:crypto. */
  computeSha256?: (bytes: Uint8Array) => Promise<string>;
}>;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES: readonly string[] = [
  "video/mp4",
  "video/webm",
  "application/octet-stream",
];

/**
 * Hosts that must never be used as the base URL. Automating the hosted
 * gov.br VLibras services (Widget / Vídeo / Translator) is out of scope
 * (Requirements 15.2, 15.3). The self-hosted adapter targets a private
 * deployment only.
 */
const FORBIDDEN_HOST_SUFFIXES: readonly string[] = ["vlibras.gov.br", "gov.br"];

function assertPrivateBaseUrl(baseUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid VLibras base URL: ${baseUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`VLibras base URL must be http(s); got ${parsed.protocol}`);
  }
  const host = parsed.hostname.toLowerCase();
  for (const suffix of FORBIDDEN_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) {
      throw new Error(
        "Refusing to target a hosted gov.br VLibras endpoint; " +
          "this adapter only talks to an isolated self-hosted deployment.",
      );
    }
  }
  return parsed;
}

async function nodeSha256(bytes: Uint8Array): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

/** Maps the deployment's raw status string onto the domain `JobStatus`. */
function normalizeJobStatus(raw: unknown): JobStatus {
  switch (String(raw).toLowerCase()) {
    case "queued":
    case "pending":
    case "waiting":
      return "queued";
    case "running":
    case "processing":
    case "in_progress":
      return "running";
    case "succeeded":
    case "success":
    case "done":
    case "completed":
      return "succeeded";
    default:
      return "failed";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * AvatarTranslationProvider backed by a self-hosted VLibras Translator API.
 *
 * Construct with explicit config and injected dependencies. The adapter is
 * stateless beyond its configuration, so it is safe to share.
 */
export class VLibrasSelfHostedProvider implements AvatarTranslationProvider {
  readonly kind: ProviderKind = "self-hosted-vlibras";

  private readonly baseUrl: URL;
  private readonly tokenSecretId: string;
  private readonly rightsReview: RightsReview;
  private readonly requestTimeoutMs: number;
  private readonly maxDownloadBytes: number;
  private readonly allowedMimeTypes: readonly string[];
  private readonly secretManager: SecretManager;
  private readonly httpClient: HttpClient;
  private readonly computeSha256: (bytes: Uint8Array) => Promise<string>;

  constructor(config: VLibrasSelfHostedConfig, deps: VLibrasSelfHostedDeps) {
    this.baseUrl = assertPrivateBaseUrl(config.baseUrl ?? DEFAULT_BASE_URL);
    this.tokenSecretId = config.tokenSecretId;
    this.rightsReview = config.rightsReview;
    this.requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxDownloadBytes =
      config.maxDownloadBytes ?? DEFAULT_MAX_DOWNLOAD_BYTES;
    this.allowedMimeTypes =
      config.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
    this.secretManager = deps.secretManager;
    this.httpClient = deps.httpClient ?? defaultHttpClient();
    this.computeSha256 = deps.computeSha256 ?? nodeSha256;
  }

  /**
   * Build a config/health view from environment variables.
   *
   * Reads base URL and the *secret id* (never the token value) from env,
   * keeping the actual token in the backend secret manager.
   */
  static fromEnv(
    env: Readonly<Record<string, string | undefined>>,
    deps: VLibrasSelfHostedDeps,
  ): VLibrasSelfHostedProvider {
    const tokenSecretId = env.VLIBRAS_TOKEN_SECRET_ID;
    if (!tokenSecretId) {
      throw new Error(
        "VLIBRAS_TOKEN_SECRET_ID is required; the token itself must live " +
          "in the secret manager, not in the environment.",
      );
    }
    const config: VLibrasSelfHostedConfig = {
      baseUrl: env.VLIBRAS_BASE_URL ?? DEFAULT_BASE_URL,
      tokenSecretId,
      implementationVersion: env.VLIBRAS_IMPL_VERSION ?? "unknown",
      rightsReview: {
        ...(env.VLIBRAS_TERMS_REVIEW_ID
          ? { termsOrLicenseReviewId: env.VLIBRAS_TERMS_REVIEW_ID }
          : {}),
        ...(env.VLIBRAS_ASSETS_REVIEW_ID
          ? { assetsReviewId: env.VLIBRAS_ASSETS_REVIEW_ID }
          : {}),
        ...(env.VLIBRAS_MODELS_REVIEW_ID
          ? { modelsReviewId: env.VLIBRAS_MODELS_REVIEW_ID }
          : {}),
      },
      ...(env.VLIBRAS_MODEL_VERSION
        ? { modelOrDictionaryVersion: env.VLIBRAS_MODEL_VERSION }
        : {}),
    };
    return new VLibrasSelfHostedProvider(config, deps);
  }

  /** Rights-review identifiers recorded for provenance (Requirement 8.3). */
  get reviewIdentifiers(): RightsReview {
    return this.rightsReview;
  }

  async healthCheck(): Promise<ProviderHealth> {
    // Authorization is gated on an approved rights review, independent of
    // whether the deployment answers. No approved review => not authorized
    // (Requirements 8.4, 7.1).
    const reviewId = this.rightsReview.termsOrLicenseReviewId;
    const authorizedForRequestedUse =
      typeof reviewId === "string" && reviewId.length > 0;

    if (!authorizedForRequestedUse) {
      return {
        available: false,
        authorizedForRequestedUse: false,
        reason:
          "No approved rights/license review configured for the " +
          "self-hosted VLibras deployment (internal-nonproduction-prototype).",
      };
    }

    // Only probe liveness once authorization is established.
    try {
      const response = await this.request("GET", "/healthcheck");
      if (!response.ok) {
        return {
          available: false,
          authorizedForRequestedUse: true,
          reason: `Health check returned HTTP ${response.status}.`,
        };
      }
      return { available: true, authorizedForRequestedUse: true };
    } catch (error) {
      return {
        available: false,
        authorizedForRequestedUse: true,
        reason: `Health check failed: ${describeError(error)}`,
      };
    }
  }

  async submit(request: AvatarSegmentRequest): Promise<{ jobId: string }> {
    // Hard gate: only the prototype usage is ever permitted, and only with
    // an approved rights review. Never send text to an unauthorized or
    // non-prototype target (Requirements 8.1, 8.4, 7.1).
    this.assertAuthorized();

    // Send only what generation needs (Requirement 17.2): the PT-BR text
    // and a correlation id, nothing about the source media.
    const body = JSON.stringify({
      usage: PROTOTYPE_USAGE,
      requestId: request.requestId,
      text: request.textPtBr,
    });

    const response = await this.request("POST", "/translation", body);
    if (!response.ok) {
      throw new Error(`VLibras submit failed with HTTP ${response.status}.`);
    }
    const payload = await response.json();
    if (!isRecord(payload)) {
      throw new Error("VLibras submit returned a non-object payload.");
    }
    const jobId = payload.jobId ?? payload.id;
    if (typeof jobId !== "string" || jobId.length === 0) {
      throw new Error("VLibras submit response is missing a jobId.");
    }
    return { jobId };
  }

  async getJob(jobId: string): Promise<AvatarJob> {
    this.assertAuthorized();
    const response = await this.request(
      "GET",
      `/translation/${encodeURIComponent(jobId)}`,
    );
    if (!response.ok) {
      throw new Error(`VLibras getJob failed with HTTP ${response.status}.`);
    }
    const payload = await response.json();
    if (!isRecord(payload)) {
      throw new Error("VLibras getJob returned a non-object payload.");
    }
    const status = normalizeJobStatus(payload.status);
    const outputUri =
      typeof payload.outputUri === "string"
        ? payload.outputUri
        : typeof payload.output === "string"
          ? payload.output
          : undefined;
    const errorCode =
      typeof payload.errorCode === "string" ? payload.errorCode : undefined;

    return {
      jobId,
      status,
      ...(outputUri !== undefined ? { outputUri } : {}),
      ...(errorCode !== undefined ? { errorCode } : {}),
    };
  }

  async download(job: AvatarJob): Promise<AvatarAsset> {
    this.assertAuthorized();
    if (job.status !== "succeeded") {
      throw new Error(
        `Refusing to download job ${job.jobId} in status ${job.status}.`,
      );
    }
    if (!job.outputUri) {
      throw new Error(`Job ${job.jobId} has no output URI to download.`);
    }

    // Resolve the output URL against the configured private base and refuse
    // any redirect to a hosted gov.br endpoint (Requirements 15.1, 15.2).
    const outputUrl = assertPrivateBaseUrl(
      new URL(job.outputUri, this.baseUrl).toString(),
    );

    const response = await this.request("GET", outputUrl.toString());
    if (!response.ok) {
      throw new Error(`VLibras download failed with HTTP ${response.status}.`);
    }

    // MIME allowlist (Requirement 17.3).
    const mimeType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(
        `VLibras output MIME ${mimeType || "<none>"} is not allowlisted.`,
      );
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Size limit (Requirement 17.3).
    if (bytes.byteLength > this.maxDownloadBytes) {
      throw new Error(
        `VLibras output exceeds the ${this.maxDownloadBytes}-byte limit.`,
      );
    }

    const sha256 = await this.computeSha256(bytes);

    return {
      requestId: job.jobId,
      uri: outputUrl.toString(),
      mimeType,
      durationMs: 0,
      sha256,
      transparentBackground: mimeType === "video/webm",
    };
  }

  /** Throw unless the deployment is authorized for the prototype use. */
  private assertAuthorized(): void {
    const reviewId = this.rightsReview.termsOrLicenseReviewId;
    if (typeof reviewId !== "string" || reviewId.length === 0) {
      throw new Error(
        "VLibras self-hosted deployment is not authorized: no approved " +
          "rights/license review id is configured.",
      );
    }
  }

  /** Perform an HTTP request with a bearer token and a timeout. */
  private async request(
    method: "GET" | "POST",
    pathOrUrl: string,
    body?: string,
  ): Promise<HttpResponse> {
    const token = await this.secretManager.getSecret(this.tokenSecretId);
    if (!token) {
      throw new Error(
        `No API token found for secret id "${this.tokenSecretId}".`,
      );
    }

    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : new URL(pathOrUrl, this.baseUrl).toString();

    const headers: Record<string, string> = {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    };
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await this.httpClient(url, {
        method,
        headers,
        ...(body !== undefined ? { body } : {}),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
