// Translation package repository (app side).
//
// Task 19.1 — implements `TranslationPackageRepository` from `@libras/pipeline`:
// it loads the versioned, immutable `manifest.json` for a media id over HTTPS
// and returns a typed `TranslationManifest` (Requirement 12.1).
//
// This layer must stay free of native/React Native dependencies: the mobile
// app currently builds as a plain TypeScript project (the RN toolchain arrives
// in task 20.x). So we depend only on standard web types — a `fetch`-shaped
// function and the `URL` builtin — and keep `fetch` injectable for tests.
//
// The repository intentionally does NOT trust the network body: before handing
// the manifest to the player it validates the minimal shape it relies on
// (schemaVersion === 2, a non-empty `variants` array and a `transcriptUri`),
// rejecting with a clear error otherwise.

import type {
  MediaId,
  TranslationManifest,
  TranslationPackageRepository,
} from "@libras/pipeline/client";

/** File name of the versioned manifest inside a package revision. */
export const MANIFEST_FILE_NAME = "manifest.json";

/** Schema version this app knows how to read. */
export const SUPPORTED_SCHEMA_VERSION = 2 as const;

/**
 * Minimal `fetch` shape the repository needs. Declared locally (instead of
 * relying on the global `fetch`) so the dependency is explicit and trivially
 * injectable under test — no native runtime required.
 */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
) => Promise<FetchLikeResponse>;

/** Minimal response shape the repository consumes from {@link FetchLike}. */
export type FetchLikeResponse = Readonly<{
  ok: boolean;
  status: number;
  statusText?: string;
  json(): Promise<unknown>;
}>;

/** Options for {@link HttpsTranslationPackageRepository}. */
export type HttpsTranslationPackageRepositoryOptions = Readonly<{
  /**
   * Base URL where packages are published, e.g.
   * `https://media.example/media`. The manifest is resolved as
   * `{baseUrl}/{mediaId}/{revision}/manifest.json`. Must be HTTPS.
   */
  baseUrl: string;
  /**
   * Package revision segment (the immutable `{revision}` in the versioned
   * path). Defaults to `"v2"` to match the current schema layout.
   */
  revision?: string;
  /** Injected `fetch`. Defaults to the global `fetch` when available. */
  fetch?: FetchLike;
  /** Extra request headers (e.g. `Accept`). Never put secrets here. */
  headers?: Record<string, string>;
}>;

/** Default revision segment used when the caller does not provide one. */
export const DEFAULT_REVISION = "v2";

/**
 * Error thrown when a manifest cannot be loaded or fails minimal validation.
 * Carries a stable `code` so callers can branch without string matching.
 */
export class ManifestRepositoryError extends Error {
  public readonly code: ManifestRepositoryErrorCode;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    code: ManifestRepositoryErrorCode,
    message: string,
    options: {
      details?: Readonly<Record<string, unknown>>;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ManifestRepositoryError";
    this.code = code;
    if (options.details !== undefined) {
      this.details = options.details;
    }
    Object.setPrototypeOf(this, ManifestRepositoryError.prototype);
  }
}

export type ManifestRepositoryErrorCode =
  | "INVALID_BASE_URL"
  | "INSECURE_TRANSPORT"
  | "INVALID_MEDIA_ID"
  | "NO_FETCH"
  | "FETCH_FAILED"
  | "HTTP_ERROR"
  | "INVALID_JSON"
  | "INVALID_MANIFEST";

/**
 * HTTPS-backed {@link TranslationPackageRepository}. Resolves and fetches the
 * versioned `manifest.json` for a media id, validates its minimal shape and
 * returns a typed {@link TranslationManifest}.
 */
export class HttpsTranslationPackageRepository
  implements TranslationPackageRepository
{
  readonly #baseUrl: string;
  readonly #revision: string;
  readonly #fetch: FetchLike;
  readonly #headers: Record<string, string>;

  public constructor(options: HttpsTranslationPackageRepositoryOptions) {
    const fetchImpl =
      options.fetch ??
      (typeof globalThis.fetch === "function"
        ? (globalThis.fetch as unknown as FetchLike)
        : undefined);
    if (fetchImpl === undefined) {
      throw new ManifestRepositoryError(
        "NO_FETCH",
        "Nenhuma implementação de fetch disponível; forneça `fetch` nas opções.",
      );
    }

    this.#baseUrl = normalizeHttpsBaseUrl(options.baseUrl);
    this.#revision = options.revision ?? DEFAULT_REVISION;
    this.#fetch = fetchImpl;
    this.#headers = { Accept: "application/json", ...options.headers };
  }

  /** URL of the manifest for `mediaId` under the configured base/revision. */
  public manifestUrl(mediaId: MediaId): string {
    const id = assertMediaId(mediaId);
    // Encode each path segment so an id never escapes its folder.
    const url = new URL(
      `${encodeURIComponent(id)}/${encodeURIComponent(this.#revision)}/${MANIFEST_FILE_NAME}`,
      this.#baseUrl,
    );
    if (url.protocol !== "https:") {
      throw new ManifestRepositoryError(
        "INSECURE_TRANSPORT",
        `Manifesto deve ser carregado via HTTPS; obtido ${url.protocol}.`,
        { details: { url: url.toString() } },
      );
    }
    return url.toString();
  }

  public async getManifest(mediaId: MediaId): Promise<TranslationManifest> {
    const url = this.manifestUrl(mediaId);

    let response: FetchLikeResponse;
    try {
      response = await this.#fetch(url, {
        method: "GET",
        headers: this.#headers,
      });
    } catch (cause) {
      throw new ManifestRepositoryError(
        "FETCH_FAILED",
        `Falha ao buscar o manifesto em ${url}.`,
        { details: { url }, cause },
      );
    }

    if (!response.ok) {
      throw new ManifestRepositoryError(
        "HTTP_ERROR",
        `Resposta HTTP ${response.status}${
          response.statusText ? ` ${response.statusText}` : ""
        } ao buscar o manifesto em ${url}.`,
        { details: { url, status: response.status } },
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new ManifestRepositoryError(
        "INVALID_JSON",
        `Corpo do manifesto em ${url} não é JSON válido.`,
        { details: { url }, cause },
      );
    }

    return assertTranslationManifest(body, url);
  }
}

/**
 * Normalizes and validates the base URL: it must be a parseable HTTPS URL. A
 * trailing slash is added so relative manifest paths resolve under the base
 * path rather than replacing its last segment.
 */
function normalizeHttpsBaseUrl(rawBaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawBaseUrl);
  } catch (cause) {
    throw new ManifestRepositoryError(
      "INVALID_BASE_URL",
      `baseUrl inválida: ${rawBaseUrl}`,
      { details: { rawBaseUrl }, cause },
    );
  }
  if (parsed.protocol !== "https:") {
    throw new ManifestRepositoryError(
      "INSECURE_TRANSPORT",
      `baseUrl deve usar HTTPS; obtido ${parsed.protocol}.`,
      { details: { rawBaseUrl, protocol: parsed.protocol } },
    );
  }
  if (!parsed.pathname.endsWith("/")) {
    parsed.pathname = `${parsed.pathname}/`;
  }
  return parsed.toString();
}

/** Validates that `mediaId` is a non-empty, single-segment id. */
function assertMediaId(mediaId: MediaId): string {
  if (typeof mediaId !== "string" || mediaId.trim() === "") {
    throw new ManifestRepositoryError(
      "INVALID_MEDIA_ID",
      "mediaId deve ser uma string não vazia.",
      { details: { mediaId } },
    );
  }
  if (mediaId.includes("/") || mediaId.includes("\\")) {
    throw new ManifestRepositoryError(
      "INVALID_MEDIA_ID",
      `mediaId não pode conter separadores de caminho: ${mediaId}`,
      { details: { mediaId } },
    );
  }
  return mediaId;
}

/**
 * Minimal structural validation of a fetched manifest (Requirement 12.1): it
 * must declare `schemaVersion === 2`, carry a non-empty `variants` array and a
 * non-empty `transcriptUri`. On success the value is returned narrowed to
 * {@link TranslationManifest}; otherwise a clear error is thrown.
 *
 * This is deliberately a shape check, not a full schema validation: it guards
 * the fields the player relies on before `load`, without duplicating the
 * pipeline's package validator.
 */
export function assertTranslationManifest(
  value: unknown,
  sourceUrl?: string,
): TranslationManifest {
  const where = sourceUrl ? ` (em ${sourceUrl})` : "";

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ManifestRepositoryError(
      "INVALID_MANIFEST",
      `Manifesto${where} deve ser um objeto.`,
      { details: { sourceUrl } },
    );
  }

  const manifest = value as Record<string, unknown>;

  if (manifest["schemaVersion"] !== SUPPORTED_SCHEMA_VERSION) {
    throw new ManifestRepositoryError(
      "INVALID_MANIFEST",
      `Manifesto${where} tem schemaVersion ${String(
        manifest["schemaVersion"],
      )}; esperado ${SUPPORTED_SCHEMA_VERSION}.`,
      { details: { sourceUrl, schemaVersion: manifest["schemaVersion"] } },
    );
  }

  const variants = manifest["variants"];
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new ManifestRepositoryError(
      "INVALID_MANIFEST",
      `Manifesto${where} deve conter um array não vazio de variants.`,
      { details: { sourceUrl } },
    );
  }

  const transcriptUri = manifest["transcriptUri"];
  if (typeof transcriptUri !== "string" || transcriptUri.trim() === "") {
    throw new ManifestRepositoryError(
      "INVALID_MANIFEST",
      `Manifesto${where} deve conter transcriptUri não vazio.`,
      { details: { sourceUrl } },
    );
  }

  return manifest as unknown as TranslationManifest;
}

/**
 * Convenience factory mirroring the common construction pattern. Returns a
 * repository instance typed as the shared {@link TranslationPackageRepository}
 * interface.
 */
export function createHttpsTranslationPackageRepository(
  options: HttpsTranslationPackageRepositoryOptions,
): TranslationPackageRepository {
  return new HttpsTranslationPackageRepository(options);
}
