// Authorized-use policy and secure-download boundaries for the avatar gateway.
//
// Task 10.2 makes the pipeline/gateway compliance layer explicit. The concrete
// provider adapter (packages/provider-vlibras) already enforces several guards
// at the transport level; this module is the PIPELINE-LEVEL policy: a set of
// pure, framework-free functions the gateway can call to decide whether a
// remote operation is permitted and whether a downloaded output is safe to
// accept. Keeping the checks here as pure functions makes them independently
// testable (tasks 10.3/10.4) and reusable without duplicating the adapter's
// transport-specific logic.
//
// Compliance posture enforced here (requirements in parentheses):
//   7.2   Remote operations are allowed only against a documented public
//         contract or an approved commercial contract. The gateway refuses to
//         act against any host that is not on the caller-provided allowlist.
//   15.1  Every remote operation must correspond to a documented public or
//         approved commercial contract (encoded as the host allowlist).
//   15.2  Discovering or calling private/undocumented endpoints is refused —
//         a host absent from the allowlist is treated as private and rejected.
//   15.3  The hosted VLibras Vídeo service (and the broader gov.br VLibras
//         hosted suite) must never be automated to publish this production;
//         those hosts are hard-denied even if an allowlist entry would match.
//   17.3  Downloaded output must use HTTPS, respect a byte-size limit, pass a
//         MIME allowlist and have its SHA-256 verified before acceptance.
//   17.4  The provider's retention policy is applied to text, video and
//         assets via an explicit, auditable retention hook.
//   18.3  A cached/reused asset may only be reused while its license and
//         purpose remain valid; the retention hook carries that decision.
//
// Nothing here performs I/O. The hashing boundary and the "now" clock used by
// the retention hook are injected by the caller, so the guards stay pure and
// deterministic under test.

import { PipelineError } from "../domain/PipelineError.js";
import type { AvatarAsset, Sha256 } from "../domain/types.js";

// --- Authorized-use boundary (Req 7.2, 15.1, 15.2, 15.3) -----------------

/**
 * Hosts (and parent domains) that must never be contacted, even if an
 * allowlist entry would otherwise match. Automating the hosted gov.br VLibras
 * suite — Widget, Vídeo or the hosted Translator — to publish this production
 * is out of scope (Req 15.3). A host matches when it equals the suffix or ends
 * with `.<suffix>` (so `video.vlibras.gov.br` and any `*.gov.br` are denied).
 */
export const FORBIDDEN_HOST_SUFFIXES: readonly string[] = [
  "vlibras.gov.br",
  "gov.br",
];

/** Describes a documented/approved remote contract the pipeline may use. */
export type AuthorizedUsePolicy = Readonly<{
  /**
   * Lowercase hostnames the pipeline is contractually allowed to contact.
   * Each entry stands for a documented public contract or an approved
   * commercial contract (Req 15.1). A host absent from this list is treated
   * as private/undocumented and refused (Req 15.2).
   */
  allowedHosts: readonly string[];
  /**
   * Allowed URL schemes. Defaults to HTTPS-only. `http:` is only ever
   * sensible for an isolated local dev deployment and must be opted in
   * explicitly by the caller (never for a public/commercial contract).
   */
  allowedSchemes?: readonly string[];
  /**
   * Additional hard-denied host suffixes on top of {@link
   * FORBIDDEN_HOST_SUFFIXES}. Hard denials always win over the allowlist.
   */
  forbiddenHostSuffixes?: readonly string[];
}>;

/** Default schemes for a remote contract operation: HTTPS only (Req 17.3). */
const DEFAULT_ALLOWED_SCHEMES: readonly string[] = ["https:"];

/**
 * Returns `true` when `host` is covered by a hard-deny suffix: either an exact
 * match or a subdomain of it. Case-insensitive.
 */
function isForbiddenHost(
  host: string,
  forbiddenSuffixes: readonly string[],
): boolean {
  const normalized = host.toLowerCase();
  return forbiddenSuffixes.some(
    (suffix) =>
      normalized === suffix.toLowerCase() ||
      normalized.endsWith(`.${suffix.toLowerCase()}`),
  );
}

/**
 * Validates that `rawUrl` is a permitted remote operation under `policy`, and
 * returns the parsed `URL`. Throws a blocking {@link PipelineError} otherwise.
 *
 * The checks, in order (most restrictive first):
 *   1. The URL must parse.
 *   2. Its scheme must be allowlisted (HTTPS by default, Req 17.3).
 *   3. Its host must NOT be hard-denied (gov.br VLibras suite, Req 15.3).
 *   4. Its host MUST be on the allowlist (documented/approved contract,
 *      Req 7.2, 15.1); anything else is treated as a private/undocumented
 *      endpoint and refused (Req 15.2).
 *
 * This is the single chokepoint the gateway uses before any submit/poll/
 * download, so a non-contract host can never be reached.
 */
export function assertAuthorizedOperationUrl(
  rawUrl: string,
  policy: AuthorizedUsePolicy,
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new PipelineError(
      "POLICY_REJECTED",
      `URL de operação remota inválida: ${rawUrl}`,
      { details: { rawUrl } },
    );
  }

  const allowedSchemes = policy.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES;
  if (!allowedSchemes.includes(parsed.protocol)) {
    throw new PipelineError(
      "POLICY_REJECTED",
      `Esquema ${parsed.protocol} não permitido para operação remota; ` +
        `esperado um de [${allowedSchemes.join(", ")}].`,
      { details: { rawUrl, protocol: parsed.protocol, allowedSchemes } },
    );
  }

  const host = parsed.hostname.toLowerCase();
  const forbidden = [
    ...FORBIDDEN_HOST_SUFFIXES,
    ...(policy.forbiddenHostSuffixes ?? []),
  ];
  if (isForbiddenHost(host, forbidden)) {
    throw new PipelineError(
      "POLICY_REJECTED",
      `Host ${host} é um serviço hospedado VLibras/gov.br; automatizá-lo ` +
        `para esta produção não é permitido.`,
      { details: { rawUrl, host } },
    );
  }

  const allowed = policy.allowedHosts.map((h) => h.toLowerCase());
  if (!allowed.includes(host)) {
    throw new PipelineError(
      "POLICY_REJECTED",
      `Host ${host} não corresponde a contrato público documentado ou ` +
        `contrato comercial aprovado; endpoints privados/não documentados ` +
        `são recusados.`,
      { details: { rawUrl, host, allowedHosts: allowed } },
    );
  }

  return parsed;
}

/**
 * Non-throwing form of {@link assertAuthorizedOperationUrl}. Returns `true`
 * when the URL is a permitted remote operation, `false` otherwise. Useful for
 * property tests and for callers that prefer branching over exceptions.
 */
export function isAuthorizedOperationUrl(
  rawUrl: string,
  policy: AuthorizedUsePolicy,
): boolean {
  try {
    assertAuthorizedOperationUrl(rawUrl, policy);
    return true;
  } catch {
    return false;
  }
}

// --- Secure download guard (Req 17.3) ------------------------------------

/** Default upper bound for a downloaded output: 50 MiB. */
export const DEFAULT_MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

/** Default MIME types accepted for a generated avatar output. */
export const DEFAULT_ALLOWED_MIME_TYPES: readonly string[] = [
  "video/mp4",
  "video/webm",
  "application/octet-stream",
];

/** Facts about a downloaded output the gateway can observe before accepting it. */
export type DownloadDescriptor = Readonly<{
  /** URL the output was fetched from (must be HTTPS under policy). */
  url: string;
  /** Normalized, lowercase MIME type (e.g. `video/mp4`), parameters stripped. */
  mimeType: string;
  /** Size of the downloaded body in bytes. */
  byteLength: number;
  /** SHA-256 (hex) actually computed over the downloaded bytes. */
  computedSha256: Sha256;
  /** SHA-256 (hex) the request/job expected the output to have. */
  expectedSha256: Sha256;
}>;

/** Policy for accepting a downloaded output (Req 17.3). */
export type SecureDownloadPolicy = Readonly<{
  /** Allowed download schemes. Defaults to HTTPS only. */
  allowedSchemes?: readonly string[];
  /** Max accepted body size in bytes. Defaults to {@link DEFAULT_MAX_DOWNLOAD_BYTES}. */
  maxBytes?: number;
  /** Allowlisted MIME types. Defaults to {@link DEFAULT_ALLOWED_MIME_TYPES}. */
  allowedMimeTypes?: readonly string[];
}>;

/**
 * Enforces the secure-download policy on an already-fetched output (Req 17.3):
 * HTTPS transport, a size ceiling, a MIME allowlist and a SHA-256 match. Throws
 * a blocking {@link PipelineError} on the first violation; returns normally on
 * success. The function never fetches anything itself — the caller downloads
 * and passes the observed facts, keeping this guard pure and testable.
 */
export function assertSecureDownload(
  descriptor: DownloadDescriptor,
  policy: SecureDownloadPolicy = {},
): void {
  const allowedSchemes = policy.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES;
  const maxBytes = policy.maxBytes ?? DEFAULT_MAX_DOWNLOAD_BYTES;
  const allowedMimeTypes =
    policy.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

  // HTTPS (or an explicitly opted-in scheme) only.
  let scheme: string;
  try {
    scheme = new URL(descriptor.url).protocol;
  } catch {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `URL de download inválida: ${descriptor.url}`,
      { details: { url: descriptor.url } },
    );
  }
  if (!allowedSchemes.includes(scheme)) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Download deve usar ${allowedSchemes.join("/")}; recebido ${scheme}.`,
      { details: { url: descriptor.url, scheme, allowedSchemes } },
    );
  }

  // MIME allowlist.
  const mimeType = descriptor.mimeType.toLowerCase();
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `MIME de download ${mimeType || "<nenhum>"} não está na allowlist ` +
        `[${allowedMimeTypes.join(", ")}].`,
      { details: { url: descriptor.url, mimeType, allowedMimeTypes } },
    );
  }

  // Size limit.
  if (!Number.isFinite(descriptor.byteLength) || descriptor.byteLength < 0) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Tamanho de download inválido: ${descriptor.byteLength}.`,
      { details: { url: descriptor.url, byteLength: descriptor.byteLength } },
    );
  }
  if (descriptor.byteLength > maxBytes) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Download de ${descriptor.byteLength} bytes excede o limite de ` +
        `${maxBytes} bytes.`,
      { details: { url: descriptor.url, byteLength: descriptor.byteLength, maxBytes } },
    );
  }

  // Hash verification (Req 17.3, complements the gateway's per-asset check).
  if (descriptor.computedSha256 !== descriptor.expectedSha256) {
    throw new PipelineError(
      "ASSET_INTEGRITY_FAILED",
      `Hash SHA-256 do download não confere (esperado=` +
        `${descriptor.expectedSha256}, calculado=${descriptor.computedSha256}).`,
      {
        details: {
          url: descriptor.url,
          expectedSha256: descriptor.expectedSha256,
          computedSha256: descriptor.computedSha256,
        },
      },
    );
  }
}

// --- Provider retention policy hooks (Req 17.4, 18.3) --------------------

/**
 * The provider's retention policy as applied by the pipeline to text, video
 * and generated assets (Req 17.4). A `retainUntilMs` of `0` means "do not
 * retain" (delete immediately after use); `undefined` means the provider
 * imposes no retention bound. `purposeStillValid` reflects whether the
 * license and intended purpose still permit reuse (Req 18.3).
 */
export type RetentionPolicy = Readonly<{
  /** Epoch-ms instant after which a retained asset must be purged, if any. */
  retainUntilMs?: number;
  /** Whether the license + purpose that justified retention still hold. */
  purposeStillValid: boolean;
}>;

/** Outcome of a retention decision for a specific asset at a specific time. */
export type RetentionDecision = Readonly<{
  /** `true` when the asset may still be used/reused right now. */
  mayRetain: boolean;
  /** Human-readable reason, present when `mayRetain` is `false`. */
  reason?: string;
}>;

/**
 * Decides whether `asset` may still be retained/reused under the provider's
 * retention policy at time `nowMs` (Req 17.4, 18.3). Pure: the caller injects
 * the clock. A cached asset is reusable only while its license/purpose remain
 * valid AND it is within the retention window.
 */
export function evaluateRetention(
  asset: AvatarAsset,
  policy: RetentionPolicy,
  nowMs: number,
): RetentionDecision {
  if (!policy.purposeStillValid) {
    return {
      mayRetain: false,
      reason:
        `Licença/finalidade do asset ${asset.requestId} não é mais válida; ` +
        `reutilização não permitida.`,
    };
  }
  if (policy.retainUntilMs !== undefined && nowMs > policy.retainUntilMs) {
    return {
      mayRetain: false,
      reason:
        `Janela de retenção do asset ${asset.requestId} expirou ` +
        `(limite=${policy.retainUntilMs}, agora=${nowMs}).`,
    };
  }
  return { mayRetain: true };
}
