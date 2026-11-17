// Versioned, immutable manifest creation and package writing.
//
// This module closes the pipeline: it turns the validated variants and the
// avatar generation result into a coherent `TranslationManifest`
// (`createManifestWithFallback`) and writes the whole package as immutable,
// versioned artifacts under `/media/{mediaId}/{revision}/`, recording a
// SHA-256 for every artifact in `checksums.sha256` (`writePackage`).
//
// It underpins Requirements:
//   12.1  The manifest always references the original variant and the
//         normalized transcript.
//   12.2  `avatarAvailable` is true iff a complete, validated avatar variant
//         with valid hashes and recorded provenance exists.
//   12.3  An unavailable generation result yields `avatarMode: "unavailable"`,
//         omits the avatar variant and records the reason.
//   12.4  Package revisions are published as immutable artifacts under
//         versioned paths.
//   12.5  A SHA-256 of every package artifact is recorded.
//   12.6  Partial avatar results are never published.
//
// Design references: the `createManifestWithFallback` function, the
// `TranslationManifest` (schemaVersion 2) contract and the
// `/media/{mediaId}/{revision}/` data-model layout in design.md (manifest.json,
// original.mp4, prototype-avatar.mp4 [optional], transcript.normalized.srt,
// checksums.sha256).
//
// Like the rest of the pipeline, the only side-effecting boundaries (writing
// bytes, probing for an existing path and hashing) are injected, so manifest
// creation and the packaging layout are fully unit-testable without touching a
// real filesystem. An already-existing revision path is treated as immutable
// and is never overwritten.

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import * as nodePath from "node:path";

import { PipelineError } from "../domain/PipelineError.js";
import type {
  AvatarGenerationResult,
  AvatarRuntimeConfig,
  MediaId,
  MediaVariant,
  OriginalMediaVariant,
  ProviderProvenance,
  Sha256,
  TranslationManifest,
  TranslationManifestV3,
  Uri,
} from "../domain/types.js";

// --- Constants ------------------------------------------------------------

/**
 * Permanent experimental-translation disclosure carried by every manifest.
 * This is the exact literal the `TranslationManifest.disclosure` field is
 * typed to, kept consistent with the renderer and the validator.
 */
export const MANIFEST_DISCLOSURE =
  "Tradução automática experimental por avatar; não equivale a intérprete humano." as const;

/** Canonical artifact file names inside a package revision directory. */
export const MANIFEST_FILE_NAME = "manifest.json" as const;
export const ORIGINAL_FILE_NAME = "original.mp4" as const;
export const PROTOTYPE_FILE_NAME = "prototype-avatar.mp4" as const;
export const TRANSCRIPT_FILE_NAME = "transcript.normalized.srt" as const;
export const CHECKSUMS_FILE_NAME = "checksums.sha256" as const;
/**
 * v3 artifact that carries the live-avatar {@link AvatarRuntimeConfig}
 * (bundle, avatar, default speed and license-review id). Written next to the
 * package only when the realtime manifest ships an `avatarRuntime`.
 */
export const AVATAR_RUNTIME_FILE_NAME = "avatar-runtime.json" as const;

/** Matches a 64-character lowercase hex SHA-256 string. */
const SHA256_HEX = /^[0-9a-f]{64}$/;

// --- `createManifestWithFallback` -----------------------------------------

/**
 * Builds a coherent {@link TranslationManifest} from the required original
 * variant, the normalized transcript URI, the avatar generation result and an
 * optional prototype (avatar) variant.
 *
 * Postconditions (design.md):
 *   - The original variant and the transcript are always present (12.1).
 *   - `avatarAvailable` is `true` and `avatarMode` is `"automatic-prototype"`
 *     **if and only if** the generation succeeded (carrying provenance) *and*
 *     a complete, well-hashed prototype variant is supplied (12.2).
 *   - An `unavailable` generation result produces `avatarMode: "unavailable"`,
 *     omits the avatar variant and records the reason in
 *     `generationWarnings` (12.3).
 *   - No partial avatar result is published: a prototype paired with an
 *     unavailable generation, a generated result missing its prototype, or a
 *     prototype with a malformed hash all fail loudly (12.6).
 *
 * The function is pure: it does not touch the filesystem. It throws a blocking
 * {@link PipelineError} on any incoherent combination rather than emitting a
 * manifest that misrepresents avatar availability.
 *
 * @param original     The required `original.mp4` variant.
 * @param transcriptUri The normalized SRT transcript URI.
 * @param generation   The avatar generation result (`generated`/`unavailable`).
 * @param prototype    The optional, already-validated prototype variant.
 */
export function createManifestWithFallback(
  original: MediaVariant,
  transcriptUri: Uri,
  generation: AvatarGenerationResult,
  prototype?: MediaVariant,
): TranslationManifest {
  if (original.kind !== "original") {
    throw PipelineError.assetIntegrityFailed(
      `O manifesto exige a variante 'original', recebida '${original.kind}'.`,
      { details: { kind: original.kind, uri: original.uri } },
    );
  }
  assertVariantHashWellFormed(original);

  // --- Fallback branch: generation unavailable ---------------------------
  //
  // An unavailable result must never ship an avatar variant, even if a
  // prototype was passed in — that would be publishing a partial/ incoherent
  // result (12.6).
  if (generation.kind === "unavailable") {
    if (prototype !== undefined) {
      throw new PipelineError(
        "POLICY_REJECTED",
        "Resultado de geração 'unavailable' não pode publicar variante de avatar; " +
          "isso seria um avatar parcial (Requisito 12.6).",
        {
          details: {
            generationCode: generation.code,
            prototypeUri: prototype.uri,
          },
        },
      );
    }

    return Object.freeze({
      schemaVersion: 2,
      mediaId: deriveMediaId(original),
      durationMs: original.durationMs,
      avatarMode: "unavailable",
      avatarAvailable: false,
      disclosure: MANIFEST_DISCLOSURE,
      variants: Object.freeze([original]),
      transcriptUri,
      generationWarnings: Object.freeze([
        `${generation.code}: ${generation.reason}`,
      ]),
    }) satisfies TranslationManifest;
  }

  // --- Generated branch: a complete prototype is mandatory ---------------
  //
  // A `generated` result with no prototype variant is incoherent: generation
  // succeeded but the renderer produced nothing to publish. Publishing it as
  // an avatar-available package would be false; publishing it as unavailable
  // would silently drop a successful generation. Fail loudly (12.6).
  if (prototype === undefined) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Resultado de geração 'generated' sem variante de protótipo; não é " +
        "possível publicar avatar sem o artefato correspondente (Requisito 12.6).",
      { details: { provenanceKind: generation.provenance.kind } },
    );
  }

  if (prototype.kind !== "automatic-avatar-prototype") {
    throw PipelineError.assetIntegrityFailed(
      `A variante de avatar precisa ser 'automatic-avatar-prototype', ` +
        `recebida '${prototype.kind}'.`,
      { details: { kind: prototype.kind, uri: prototype.uri } },
    );
  }
  assertVariantHashWellFormed(prototype);

  const provenance: ProviderProvenance = generation.provenance;
  const warnings = collectGenerationWarnings(generation);

  return Object.freeze({
    schemaVersion: 2,
    mediaId: deriveMediaId(original),
    durationMs: original.durationMs,
    avatarMode: "automatic-prototype",
    avatarAvailable: true,
    disclosure: MANIFEST_DISCLOSURE,
    variants: Object.freeze([original, prototype]),
    transcriptUri,
    provider: provenance,
    generationWarnings: Object.freeze(warnings),
  }) satisfies TranslationManifest;
}

// --- `createRealtimeManifest` (v3 main path) ------------------------------

/**
 * Builds the v3 ({@link TranslationManifestV3}) manifest for the live-avatar
 * (`realtime-webview-prototype`) path. The real VLibras 3D avatar is rendered
 * live inside a WebView, so the package references only the `original` variant
 * and the normalized transcript — never a pre-rendered avatar variant.
 *
 * Postconditions (design.md "createManifest (atualizado)"):
 *   - The original variant and the transcript are always present; `variants`
 *     holds the original variant only (12.1, 12.4).
 *   - `avatarAvailable` is `true` and `avatarMode` is
 *     `"realtime-webview-prototype"` **if and only if** `avatarRuntime` is
 *     non-null and carries a non-empty `licenseReviewId` (12.2).
 *   - Otherwise `avatarAvailable` is `false`, `avatarMode` is `"unavailable"`
 *     and the reason is recorded in `generationWarnings` (12.3).
 *   - No pre-rendered avatar variant is ever referenced (12.4).
 *
 * The function is pure and never touches the filesystem; the `avatarRuntime`
 * artifact is persisted separately by {@link writeRealtimePackage}.
 *
 * @param original      The required `original.mp4` variant.
 * @param transcriptUri The normalized SRT transcript URI.
 * @param avatarRuntime The live-avatar runtime config, or `null` when no
 *                      authorized/licensed runtime is configured.
 */
export function createRealtimeManifest(
  original: OriginalMediaVariant,
  transcriptUri: Uri,
  avatarRuntime: AvatarRuntimeConfig | null,
): TranslationManifestV3 {
  if (original.kind !== "original") {
    throw PipelineError.assetIntegrityFailed(
      `O manifesto exige a variante 'original', recebida '${original.kind}'.`,
      { details: { kind: original.kind, uri: original.uri } },
    );
  }
  assertVariantHashWellFormed(original);

  const variants = Object.freeze([original]) as readonly OriginalMediaVariant[];

  // Avatar is available iff a runtime config with a recorded (non-empty)
  // license-review id exists (12.2). Anything else falls back to unavailable
  // and records the reason (12.3).
  if (avatarRuntime !== null && avatarRuntime.licenseReviewId.trim() !== "") {
    return Object.freeze({
      schemaVersion: 3,
      mediaId: deriveMediaId(original),
      durationMs: original.durationMs,
      avatarMode: "realtime-webview-prototype",
      avatarAvailable: true,
      disclosure: MANIFEST_DISCLOSURE,
      variants,
      transcriptUri,
      avatarRuntime,
      generationWarnings: Object.freeze([]),
    }) satisfies TranslationManifestV3;
  }

  const reason =
    avatarRuntime === null
      ? "Nenhuma Avatar_Runtime_Config configurada; avatar ao vivo indisponível (Requisito 12.3)."
      : "Avatar_Runtime_Config sem identificador de revisão de licença registrado; avatar ao vivo indisponível (Requisito 12.2/12.3).";

  return Object.freeze({
    schemaVersion: 3,
    mediaId: deriveMediaId(original),
    durationMs: original.durationMs,
    avatarMode: "unavailable",
    avatarAvailable: false,
    disclosure: MANIFEST_DISCLOSURE,
    variants,
    transcriptUri,
    generationWarnings: Object.freeze([reason]),
  }) satisfies TranslationManifestV3;
}

/** Fails fast when a variant's declared SHA-256 is malformed. */
function assertVariantHashWellFormed(variant: MediaVariant): void {
  if (!SHA256_HEX.test(variant.sha256)) {
    throw PipelineError.assetIntegrityFailed(
      `Hash SHA-256 malformado para a variante '${variant.kind}'.`,
      { details: { variant: variant.kind, uri: variant.uri } },
    );
  }
}

/**
 * Collects per-segment warnings from a generated result into the manifest's
 * flat `generationWarnings`, prefixing each with its originating request so the
 * manifest stays auditable.
 */
function collectGenerationWarnings(
  generation: Extract<AvatarGenerationResult, { kind: "generated" }>,
): string[] {
  const warnings: string[] = [];
  for (const segment of generation.segments) {
    for (const warning of segment.warnings) {
      warnings.push(`${segment.request.requestId}: ${warning}`);
    }
  }
  return warnings;
}

/**
 * Derives the media id from the original variant's URI. The `MediaVariant`
 * contract carries no explicit id; the stable segment of its URI (the file
 * base name without extension) is used, matching the `/media/{mediaId}/...`
 * layout where the artifacts live under a media-scoped directory.
 */
function deriveMediaId(original: MediaVariant): MediaId {
  const base = original.uri.split(/[\\/]/).pop() ?? original.uri;
  const withoutExt = base.replace(/\.[^.]+$/, "");
  return withoutExt.length > 0 ? withoutExt : original.uri;
}

// --- Injected boundaries for `writePackage` -------------------------------

/**
 * Reads the raw bytes of a source artifact (the already-produced
 * `original.mp4`, prototype and transcript). Injected so packaging is
 * testable without a real filesystem. Defaults to reading the local file.
 */
export type ArtifactReader = (uri: Uri) => Promise<Uint8Array>;

/**
 * Writes `bytes` to the destination `path`, creating parent directories as
 * needed. Injected so packaging never shells out or touches disk in tests.
 * Defaults to writing the local file (and creating its directory).
 */
export type ArtifactWriter = (path: string, bytes: Uint8Array) => Promise<void>;

/**
 * Reports whether `path` already exists. Used to enforce immutability: an
 * existing revision directory is never overwritten. Injected; defaults to a
 * filesystem existence check.
 */
export type PathExists = (path: string) => Promise<boolean>;

/** Computes the SHA-256 (hex) of a byte buffer. Injected; defaults to crypto. */
export type BytesHasher = (bytes: Uint8Array) => Sha256;

// --- Default boundary implementations -------------------------------------

/** Default artifact reader: streams a local file into memory. */
export const defaultArtifactReader: ArtifactReader = async (uri) => {
  const buffer = await readFile(uri);
  return new Uint8Array(buffer);
};

/** Default artifact writer: ensures the parent directory, then writes bytes. */
export const defaultArtifactWriter: ArtifactWriter = async (path, bytes) => {
  await mkdir(nodePath.dirname(path), { recursive: true });
  await writeFile(path, bytes);
};

/** Default existence check backed by `fs/promises.access`. */
export const defaultPathExists: PathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/** Default byte hasher computing a lowercase hex SHA-256. */
export const defaultBytesHasher: BytesHasher = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

// --- `writePackage` options & result --------------------------------------

export type WritePackageOptions = Readonly<{
  /** Absolute or relative storage root that contains the `/media` tree. */
  rootDir: string;
  /** Immutable revision label (e.g. `"v2"`). */
  revision: string;
  /** The manifest produced by {@link createManifestWithFallback}. */
  manifest: TranslationManifest;
  /** Source URI of the already-produced `original.mp4`. */
  originalUri: Uri;
  /** Source URI of the normalized transcript SRT. */
  transcriptUri: Uri;
  /**
   * Source URI of the prototype variant. Required iff
   * `manifest.avatarAvailable` is `true`; must be omitted otherwise.
   */
  prototypeUri?: Uri;
  /** Reads a source artifact. Defaults to {@link defaultArtifactReader}. */
  readArtifact?: ArtifactReader;
  /** Writes a destination artifact. Defaults to {@link defaultArtifactWriter}. */
  writeArtifact?: ArtifactWriter;
  /** Existence probe for immutability. Defaults to {@link defaultPathExists}. */
  pathExists?: PathExists;
  /** Byte hasher. Defaults to {@link defaultBytesHasher}. */
  hashBytes?: BytesHasher;
}>;

/** One recorded artifact: its file name and the SHA-256 of its bytes. */
export type ArtifactChecksum = Readonly<{
  /** File name relative to the revision directory. */
  fileName: string;
  /** Lowercase hex SHA-256 of the written bytes. */
  sha256: Sha256;
}>;

/** Outcome of a successful {@link writePackage} run. */
export type WritePackageResult = Readonly<{
  /** The versioned, immutable revision directory the artifacts were written to. */
  revisionDir: string;
  /** Every written artifact with its SHA-256 (includes `checksums.sha256`). */
  artifacts: readonly ArtifactChecksum[];
  /** The exact contents written to `checksums.sha256`. */
  checksumsContent: string;
}>;

// --- `writePackage` --------------------------------------------------------

/**
 * Writes the full package as immutable, versioned artifacts under
 * `{rootDir}/media/{mediaId}/{revision}/` and records a SHA-256 for every
 * artifact in `checksums.sha256` (Requirements 12.4 / 12.5).
 *
 * Layout written (design.md data model):
 *   manifest.json
 *   original.mp4
 *   prototype-avatar.mp4        # only when `manifest.avatarAvailable` is true
 *   transcript.normalized.srt
 *   checksums.sha256
 *
 * Immutability (12.4): if the revision directory already exists it is treated
 * as published and nothing is overwritten — the call fails with a blocking
 * `POLICY_REJECTED` error instead. Avatar coherence is re-checked here as a
 * defense in depth: an avatar-available manifest must carry a prototype
 * variant and a `prototypeUri`, and an avatar-unavailable manifest must carry
 * neither (12.6).
 *
 * All side effects go through injected boundaries, so the layout, immutability
 * guard and checksum file can be exercised without a real filesystem.
 *
 * @throws PipelineError `POLICY_REJECTED` when the revision already exists or
 *         the avatar state is incoherent with the provided source URIs.
 */
export async function writePackage(
  options: WritePackageOptions,
): Promise<WritePackageResult> {
  const {
    rootDir,
    revision,
    manifest,
    originalUri,
    transcriptUri,
    prototypeUri,
  } = options;
  const readArtifact = options.readArtifact ?? defaultArtifactReader;
  const writeArtifact = options.writeArtifact ?? defaultArtifactWriter;
  const pathExists = options.pathExists ?? defaultPathExists;
  const hashBytes = options.hashBytes ?? defaultBytesHasher;

  if (revision.trim().length === 0) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "A revisão do pacote não pode ser vazia; é parte do caminho imutável.",
    );
  }

  // Avatar state must agree between manifest and provided source URIs (12.6).
  const hasPrototypeVariant = manifest.variants.some(
    (v) => v.kind === "automatic-avatar-prototype",
  );
  if (manifest.avatarAvailable) {
    if (!hasPrototypeVariant || prototypeUri === undefined) {
      throw new PipelineError(
        "POLICY_REJECTED",
        "Manifesto marca avatar disponível, mas falta a variante de protótipo " +
          "ou seu artefato de origem (Requisito 12.6).",
        {
          details: {
            hasPrototypeVariant,
            prototypeUriProvided: prototypeUri !== undefined,
          },
        },
      );
    }
  } else if (hasPrototypeVariant || prototypeUri !== undefined) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Manifesto marca avatar indisponível, mas há variante/artefato de " +
        "protótipo; avatar parcial não pode ser publicado (Requisito 12.6).",
      {
        details: {
          hasPrototypeVariant,
          prototypeUriProvided: prototypeUri !== undefined,
        },
      },
    );
  }

  // Versioned, immutable revision directory: /media/{mediaId}/{revision}/.
  const revisionDir = nodePath.join(
    rootDir,
    "media",
    manifest.mediaId,
    revision,
  );

  // Immutability guard (12.4): never overwrite a published revision.
  if (await pathExists(revisionDir)) {
    throw new PipelineError(
      "POLICY_REJECTED",
      `A revisão '${revision}' de '${manifest.mediaId}' já existe e é ` +
        "imutável; publicação não sobrescreve artefatos existentes (Requisito 12.4).",
      { details: { revisionDir } },
    );
  }

  // Gather the artifacts to write: name + bytes. The manifest is serialized
  // deterministically (2-space indent, trailing newline) so its hash is stable.
  const manifestBytes = new TextEncoder().encode(
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const artifacts: Array<{ fileName: string; bytes: Uint8Array }> = [
    { fileName: MANIFEST_FILE_NAME, bytes: manifestBytes },
    { fileName: ORIGINAL_FILE_NAME, bytes: await readArtifact(originalUri) },
    {
      fileName: TRANSCRIPT_FILE_NAME,
      bytes: await readArtifact(transcriptUri),
    },
  ];
  if (manifest.avatarAvailable && prototypeUri !== undefined) {
    artifacts.push({
      fileName: PROTOTYPE_FILE_NAME,
      bytes: await readArtifact(prototypeUri),
    });
  }

  // Hash each artifact and build the `checksums.sha256` body. The format
  // mirrors the sha256sum tool: "<hex>  <fileName>" per line.
  const checksums: ArtifactChecksum[] = [];
  const checksumLines: string[] = [];
  for (const artifact of artifacts) {
    const sha256 = hashBytes(artifact.bytes);
    checksums.push({ fileName: artifact.fileName, sha256 });
    checksumLines.push(`${sha256}  ${artifact.fileName}`);
  }
  const checksumsContent = `${checksumLines.join("\n")}\n`;
  const checksumsBytes = new TextEncoder().encode(checksumsContent);

  // Write every data artifact, then the checksums file last. The checksums
  // file covers every other artifact; it records its own name only via the
  // returned result, not a self-hash.
  for (const artifact of artifacts) {
    await writeArtifact(
      nodePath.join(revisionDir, artifact.fileName),
      artifact.bytes,
    );
  }
  await writeArtifact(
    nodePath.join(revisionDir, CHECKSUMS_FILE_NAME),
    checksumsBytes,
  );

  return Object.freeze({
    revisionDir,
    artifacts: Object.freeze([
      ...checksums,
      {
        fileName: CHECKSUMS_FILE_NAME,
        sha256: hashBytes(checksumsBytes),
      },
    ]),
    checksumsContent,
  }) satisfies WritePackageResult;
}

// --- `writeRealtimePackage` (v3 main path) --------------------------------

export type WriteRealtimePackageOptions = Readonly<{
  /** Absolute or relative storage root that contains the `/media` tree. */
  rootDir: string;
  /** Immutable revision label (e.g. `"v3"`). */
  revision: string;
  /** The manifest produced by {@link createRealtimeManifest}. */
  manifest: TranslationManifestV3;
  /** Source URI of the already-produced `original.mp4`. */
  originalUri: Uri;
  /** Source URI of the normalized transcript SRT. */
  transcriptUri: Uri;
  /** Writes a destination artifact. Defaults to {@link defaultArtifactWriter}. */
  readArtifact?: ArtifactReader;
  /** Writes a destination artifact. Defaults to {@link defaultArtifactWriter}. */
  writeArtifact?: ArtifactWriter;
  /** Existence probe for immutability. Defaults to {@link defaultPathExists}. */
  pathExists?: PathExists;
  /** Byte hasher. Defaults to {@link defaultBytesHasher}. */
  hashBytes?: BytesHasher;
}>;

/**
 * Writes the v3 (live-avatar) package as immutable, versioned artifacts under
 * `{rootDir}/media/{mediaId}/{revision}/` and records a SHA-256 for every
 * artifact in `checksums.sha256` (Requirements 12.4 / 12.5 / 12.6).
 *
 * Layout written (design.md data model):
 *   manifest.json
 *   original.mp4
 *   transcript.normalized.srt
 *   avatar-runtime.json          # only when `manifest.avatarRuntime` is set
 *   checksums.sha256
 *
 * No pre-rendered avatar variant is ever written (12.4). The live-avatar
 * runtime config is serialized as `avatar-runtime.json` next to the package
 * and its hash is recorded in `checksums.sha256`, but only when the manifest
 * marks the avatar available and carries an `avatarRuntime`. An
 * avatar-unavailable manifest must not carry a runtime config; a mismatch
 * fails loudly as a partial/incoherent configuration (12.7).
 *
 * Immutability (12.4): an existing revision directory is treated as published
 * and never overwritten — the call fails with a blocking `POLICY_REJECTED`
 * error instead.
 *
 * All side effects go through the same injected boundaries as
 * {@link writePackage}, so the layout, immutability guard and checksum file
 * can be exercised without a real filesystem.
 *
 * @throws PipelineError `POLICY_REJECTED` when the revision already exists or
 *         the avatar availability is incoherent with `avatarRuntime`.
 */
export async function writeRealtimePackage(
  options: WriteRealtimePackageOptions,
): Promise<WritePackageResult> {
  const { rootDir, revision, manifest, originalUri, transcriptUri } = options;
  const readArtifact = options.readArtifact ?? defaultArtifactReader;
  const writeArtifact = options.writeArtifact ?? defaultArtifactWriter;
  const pathExists = options.pathExists ?? defaultPathExists;
  const hashBytes = options.hashBytes ?? defaultBytesHasher;

  if (revision.trim().length === 0) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "A revisão do pacote não pode ser vazia; é parte do caminho imutável.",
    );
  }

  // No pre-rendered avatar variant may ever be published on the v3 path (12.4).
  if (manifest.variants.some((v) => v.kind !== "original")) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "O manifesto em tempo real não pode referenciar variante de avatar " +
        "pré-renderizada (Requisito 12.4).",
    );
  }

  // Avatar availability and the runtime config must agree, so no partial or
  // incomplete avatar configuration is ever published (12.7).
  if (manifest.avatarAvailable && manifest.avatarRuntime === undefined) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Manifesto marca avatar disponível, mas falta a Avatar_Runtime_Config; " +
        "configuração de avatar incompleta não pode ser publicada (Requisito 12.7).",
    );
  }
  if (!manifest.avatarAvailable && manifest.avatarRuntime !== undefined) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Manifesto marca avatar indisponível, mas carrega Avatar_Runtime_Config; " +
        "configuração de avatar parcial não pode ser publicada (Requisito 12.7).",
    );
  }

  // Versioned, immutable revision directory: /media/{mediaId}/{revision}/.
  const revisionDir = nodePath.join(
    rootDir,
    "media",
    manifest.mediaId,
    revision,
  );

  // Immutability guard (12.4): never overwrite a published revision.
  if (await pathExists(revisionDir)) {
    throw new PipelineError(
      "POLICY_REJECTED",
      `A revisão '${revision}' de '${manifest.mediaId}' já existe e é ` +
        "imutável; publicação não sobrescreve artefatos existentes (Requisito 12.4).",
      { details: { revisionDir } },
    );
  }

  // Serialize the manifest deterministically (2-space indent, trailing
  // newline) so its hash is stable.
  const manifestBytes = new TextEncoder().encode(
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const artifacts: Array<{ fileName: string; bytes: Uint8Array }> = [
    { fileName: MANIFEST_FILE_NAME, bytes: manifestBytes },
    { fileName: ORIGINAL_FILE_NAME, bytes: await readArtifact(originalUri) },
    {
      fileName: TRANSCRIPT_FILE_NAME,
      bytes: await readArtifact(transcriptUri),
    },
  ];

  // Write the live-avatar runtime config next to the package and record its
  // hash (12.5), only when the avatar is available.
  if (manifest.avatarRuntime !== undefined) {
    const avatarRuntimeBytes = new TextEncoder().encode(
      `${JSON.stringify(manifest.avatarRuntime, null, 2)}\n`,
    );
    artifacts.push({
      fileName: AVATAR_RUNTIME_FILE_NAME,
      bytes: avatarRuntimeBytes,
    });
  }

  // Hash each artifact and build the `checksums.sha256` body. The format
  // mirrors the sha256sum tool: "<hex>  <fileName>" per line.
  const checksums: ArtifactChecksum[] = [];
  const checksumLines: string[] = [];
  for (const artifact of artifacts) {
    const sha256 = hashBytes(artifact.bytes);
    checksums.push({ fileName: artifact.fileName, sha256 });
    checksumLines.push(`${sha256}  ${artifact.fileName}`);
  }
  const checksumsContent = `${checksumLines.join("\n")}\n`;
  const checksumsBytes = new TextEncoder().encode(checksumsContent);

  // Write every data artifact, then the checksums file last.
  for (const artifact of artifacts) {
    await writeArtifact(
      nodePath.join(revisionDir, artifact.fileName),
      artifact.bytes,
    );
  }
  await writeArtifact(
    nodePath.join(revisionDir, CHECKSUMS_FILE_NAME),
    checksumsBytes,
  );

  return Object.freeze({
    revisionDir,
    artifacts: Object.freeze([
      ...checksums,
      {
        fileName: CHECKSUMS_FILE_NAME,
        sha256: hashBytes(checksumsBytes),
      },
    ]),
    checksumsContent,
  }) satisfies WritePackageResult;
}
