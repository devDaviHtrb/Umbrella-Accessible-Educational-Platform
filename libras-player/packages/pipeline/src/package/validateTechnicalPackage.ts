// Technical package validation (Package Validator component).
//
// `validateTechnicalPackage` is the last integrity gate before artifacts reach
// storage/CDN. It checks the technical integrity of each produced variant and
// exposes the translation's limitations without ever certifying linguistic
// quality. It is intentionally offline and deterministic: the only external
// dependency (recomputing a file's SHA-256) is injected, so the function is
// unit-testable without touching the filesystem or any binary.
//
// It underpins Requirements:
//   16.1  Verify codec, duration and hash of each variant.
//   16.2  Block the affected asset when its hash, codec or duration fails.
//   16.3  Expose translation limitations without certifying linguistic quality.
//   16.4  Confirm original and prototype share audio, temporal origin and
//         duration within one source frame.
//   14.3  Confirm the Disclosure is present before validating the avatar
//         variant.
//
// Design references: the `validatePackage`/`validateTechnicalPackage` function
// and the validation report type described in design.md, invoked from the
// `preparePrototypePackage` pseudocode right before the manifest is created.

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

import { PipelineError } from "../domain/PipelineError.js";
import type {
  AvatarGenerationResult,
  MediaVariant,
  Milliseconds,
  Sha256,
  TranscriptCue,
  Uri,
} from "../domain/types.js";

// --- Expected technical shape ---------------------------------------------

/**
 * The only codecs a published variant may carry: H.264 video / AAC audio
 * (Requirements 5.2 / 16.1). Kept as literal unions matching `MediaVariant`.
 */
export const EXPECTED_VIDEO_CODEC = "h264" as const;
export const EXPECTED_AUDIO_CODEC = "aac" as const;

/** Only `video/mp4` variants are published. */
export const EXPECTED_MIME_TYPE = "video/mp4" as const;

/**
 * One-frame duration tolerance in milliseconds. ~34 ms covers 29.97 fps and
 * is a safe upper bound for common 24/25/30 fps sources within one frame
 * (Requirement 16.4). Mirrors the renderer's `DEFAULT_FRAME_TOLERANCE_MS`.
 */
export const DEFAULT_FRAME_TOLERANCE_MS = 34;

/**
 * Permanent experimental-translation disclosure the avatar variant must carry
 * (Requirement 14.3). Matches the manifest `disclosure` string and the text
 * burned into the prototype video by the renderer.
 */
export const DISCLOSURE_TEXT =
  "Tradução automática experimental por avatar; não equivale a intérprete humano." as const;

/**
 * Fixed statement of the translation's limitations, surfaced in every report
 * (Requirement 16.3). The validator describes the output as automatic and
 * experimental and explicitly does not certify linguistic quality.
 */
export const TRANSLATION_LIMITATIONS =
  "Tradução automática e experimental por avatar; não equivale a intérprete humano e não recebe selo de qualidade linguística. A validação técnica verifica integridade de mídia (codec, duração, hash e equivalência técnica entre variantes), não a correção da tradução." as const;

// --- Injected boundary ----------------------------------------------------

/**
 * Recomputes the SHA-256 (hex) of a file at `uri`. Injected so the validator
 * can re-hash each variant and compare against its declared `sha256` without
 * the test depending on the filesystem. Defaults to streaming the file bytes
 * through Node's crypto.
 */
export type VariantHasher = (uri: Uri) => Promise<Sha256>;

/** Default streaming SHA-256 hasher over a local file path/URI. */
export async function hashFileSha256(uri: Uri): Promise<Sha256> {
  return await new Promise<Sha256>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(uri);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

// --- Options & report -----------------------------------------------------

export type ValidateTechnicalPackageOptions = Readonly<{
  /**
   * Re-hashes each variant to confirm its declared `sha256`. When omitted the
   * declared hashes are trusted (no recomputation) and `hashVerified` is
   * `false` in the report. Inject a hasher (or {@link hashFileSha256}) to
   * actually verify integrity on disk.
   */
  hashVariant?: VariantHasher;
  /** One-frame tolerance in ms. Defaults to {@link DEFAULT_FRAME_TOLERANCE_MS}. */
  frameToleranceMs?: Milliseconds;
  /**
   * Explicit confirmation from the render step that the permanent Disclosure
   * was embedded in the prototype variant (Requirement 14.3). When `true`, the
   * Disclosure presence check passes regardless of manifest metadata. Defaults
   * to `false`, in which case the check relies on {@link manifestDisclosure}.
   */
  disclosureBurnedIn?: boolean;
  /**
   * Disclosure text as it will appear in the manifest metadata. When it
   * matches {@link DISCLOSURE_TEXT} the presence check passes even without the
   * render flag. Pass the manifest's `disclosure` field here.
   */
  manifestDisclosure?: string;
}>;

/** Per-variant technical check outcome. */
export type VariantReport = Readonly<{
  kind: MediaVariant["kind"];
  uri: Uri;
  /** Codec/MIME checks passed (Requirement 16.1). */
  codecOk: boolean;
  /** Declared duration is a positive, finite number of ms. */
  durationOk: boolean;
  /** Declared `sha256` is well-formed. */
  hashWellFormed: boolean;
  /** The file was re-hashed and matched its declared `sha256`. */
  hashVerified: boolean;
  /** Measured/declared duration in ms, echoed for auditing. */
  durationMs: Milliseconds;
}>;

/**
 * Structured outcome of a successful validation. The validator throws a
 * blocking {@link PipelineError} on any failure (so callers do not have to
 * branch on `valid`), but the report is still returned on success for logging
 * and for the manifest/report artifacts.
 */
export type ValidationReport = Readonly<{
  /** Always `true` when returned — failures throw before this point. */
  valid: true;
  /** Per-variant technical checks (Requirement 16.1 / 16.2). */
  variants: readonly VariantReport[];
  /** Whether a prototype (avatar) variant was present and validated. */
  avatarVariantValidated: boolean;
  /** Whether the permanent Disclosure was confirmed (Requirement 14.3). */
  disclosurePresent: boolean;
  /**
   * Plain-language translation limitations, never a quality certification
   * (Requirement 16.3).
   */
  limitations: typeof TRANSLATION_LIMITATIONS;
}>;

// --- Per-variant technical checks -----------------------------------------

/** Matches a 64-character lowercase hex SHA-256 string. */
const SHA256_HEX = /^[0-9a-f]{64}$/;

/**
 * Validates a single variant's technical shape: MIME, codecs, positive finite
 * duration and a well-formed SHA-256. When `hashVariant` is provided the file
 * is re-hashed and compared to the declared value. Any failure blocks the
 * affected asset with a `ASSET_INTEGRITY_FAILED` error (Requirement 16.2).
 */
async function validateVariant(
  variant: MediaVariant,
  options: ValidateTechnicalPackageOptions,
): Promise<VariantReport> {
  const codecOk =
    variant.mimeType === EXPECTED_MIME_TYPE &&
    variant.videoCodec === EXPECTED_VIDEO_CODEC &&
    variant.audioCodec === EXPECTED_AUDIO_CODEC;
  if (!codecOk) {
    throw PipelineError.assetIntegrityFailed(
      `Codec/MIME inválido para a variante '${variant.kind}': esperado ` +
        `${EXPECTED_MIME_TYPE} ${EXPECTED_VIDEO_CODEC}/${EXPECTED_AUDIO_CODEC}.`,
      {
        details: {
          variant: variant.kind,
          uri: variant.uri,
          mimeType: variant.mimeType,
          videoCodec: variant.videoCodec,
          audioCodec: variant.audioCodec,
        },
      },
    );
  }

  const durationOk =
    Number.isFinite(variant.durationMs) && variant.durationMs > 0;
  if (!durationOk) {
    throw PipelineError.assetIntegrityFailed(
      `Duração inválida para a variante '${variant.kind}': ` +
        `${String(variant.durationMs)} ms.`,
      { details: { variant: variant.kind, uri: variant.uri } },
    );
  }

  const hashWellFormed = SHA256_HEX.test(variant.sha256);
  if (!hashWellFormed) {
    throw PipelineError.assetIntegrityFailed(
      `Hash SHA-256 malformado para a variante '${variant.kind}'.`,
      { details: { variant: variant.kind, uri: variant.uri } },
    );
  }

  let hashVerified = false;
  if (options.hashVariant) {
    const actual = await options.hashVariant(variant.uri);
    if (actual !== variant.sha256) {
      throw PipelineError.assetIntegrityFailed(
        `Hash SHA-256 divergente para a variante '${variant.kind}': ` +
          `o arquivo não corresponde ao hash declarado.`,
        {
          details: {
            variant: variant.kind,
            uri: variant.uri,
            declaredSha256: variant.sha256,
            actualSha256: actual,
          },
        },
      );
    }
    hashVerified = true;
  }

  return {
    kind: variant.kind,
    uri: variant.uri,
    codecOk,
    durationOk,
    hashWellFormed,
    hashVerified,
    durationMs: variant.durationMs,
  };
}

// --- Cross-variant equivalence --------------------------------------------

/**
 * Confirms that the original and prototype variants share the same audio,
 * temporal origin and duration within one source frame (Requirement 16.4).
 *
 * "Same audio" and "same temporal origin" cannot be re-derived from a
 * `MediaVariant` alone, so this relies on the renderer's contract: the
 * prototype is composed with the source audio copied verbatim and the source
 * PTS untouched (see `renderPrototypeVariant`). The technical check that
 * remains measurable at this stage is matching audio codec and matching
 * duration within one frame — a duration that drifts beyond a frame is the
 * observable symptom of audio stretching or a shifted temporal origin, so it
 * blocks the asset.
 */
function assertTechnicalEquivalence(
  original: MediaVariant,
  prototype: MediaVariant,
  toleranceMs: Milliseconds,
): void {
  if (original.audioCodec !== prototype.audioCodec) {
    throw PipelineError.assetIntegrityFailed(
      "A variante de avatar não compartilha o mesmo áudio da original " +
        "(codecs de áudio divergentes).",
      {
        details: {
          originalAudioCodec: original.audioCodec,
          prototypeAudioCodec: prototype.audioCodec,
        },
      },
    );
  }

  const divergence = Math.abs(original.durationMs - prototype.durationMs);
  if (divergence > toleranceMs) {
    throw PipelineError.durationMismatch(
      `A variante de avatar (${prototype.durationMs} ms) e a original ` +
        `(${original.durationMs} ms) divergem além de um quadro (${toleranceMs} ms); ` +
        "isso indica deriva temporal entre as variantes.",
      {
        details: {
          originalDurationMs: original.durationMs,
          prototypeDurationMs: prototype.durationMs,
          divergenceMs: divergence,
          toleranceMs,
        },
      },
    );
  }
}

// --- Disclosure presence --------------------------------------------------

/**
 * Confirms the permanent Disclosure is present before the avatar variant is
 * considered valid (Requirement 14.3). It is satisfied by the render step's
 * explicit `disclosureBurnedIn` flag or by a matching manifest `disclosure`
 * string; otherwise the avatar variant is blocked.
 */
function assertDisclosurePresent(
  options: ValidateTechnicalPackageOptions,
): void {
  const fromRender = options.disclosureBurnedIn === true;
  const fromManifest = options.manifestDisclosure === DISCLOSURE_TEXT;
  if (!fromRender && !fromManifest) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "A variante de avatar não pode ser validada sem a Disclosure de tradução " +
        "automática experimental (Requisito 14.3).",
      {
        details: {
          disclosureBurnedIn: options.disclosureBurnedIn ?? false,
          manifestDisclosure: options.manifestDisclosure,
          expectedDisclosure: DISCLOSURE_TEXT,
        },
      },
    );
  }
}

// --- Public entry point ---------------------------------------------------

/**
 * Validates the technical integrity of a prepared package.
 *
 * Checks codec, duration and hash of each variant (blocking the affected asset
 * on any failure); when a prototype variant is present, confirms the Disclosure
 * is in place and that original and prototype share audio, temporal origin and
 * duration within one source frame. The returned report exposes the
 * translation's limitations without certifying linguistic quality.
 *
 * On success it resolves with a {@link ValidationReport}; on any failure it
 * throws a blocking {@link PipelineError}.
 *
 * @param original   The required `original.mp4` variant.
 * @param prototype  The optional `prototype-avatar.mp4` variant. When present
 *                   it is subject to the Disclosure and equivalence checks.
 * @param _cues      Normalized transcript cues (present for auditing/trace; the
 *                   technical checks here do not re-derive timing from them).
 * @param generation The avatar generation result, used to assert that no
 *                   prototype is validated for an unavailable generation.
 */
export async function validateTechnicalPackage(
  original: MediaVariant,
  prototype: MediaVariant | undefined,
  _cues: readonly TranscriptCue[],
  generation: AvatarGenerationResult,
  options: ValidateTechnicalPackageOptions = {},
): Promise<ValidationReport> {
  const toleranceMs = options.frameToleranceMs ?? DEFAULT_FRAME_TOLERANCE_MS;

  if (original.kind !== "original") {
    throw PipelineError.assetIntegrityFailed(
      `A primeira variante precisa ser 'original', recebida '${original.kind}'.`,
      { details: { kind: original.kind, uri: original.uri } },
    );
  }

  const variantReports: VariantReport[] = [];
  variantReports.push(await validateVariant(original, options));

  // A prototype can only be validated for a successfully generated result; a
  // prototype paired with an unavailable generation is incoherent and blocked.
  if (prototype !== undefined && generation.kind !== "generated") {
    throw new PipelineError(
      "POLICY_REJECTED",
      "Há variante de avatar, mas o resultado de geração é 'unavailable'; " +
        "um protótipo parcial não pode ser validado.",
      { details: { generationKind: generation.kind } },
    );
  }

  let avatarVariantValidated = false;
  let disclosurePresent = false;

  if (prototype !== undefined) {
    if (prototype.kind !== "automatic-avatar-prototype") {
      throw PipelineError.assetIntegrityFailed(
        `A variante de avatar precisa ser 'automatic-avatar-prototype', ` +
          `recebida '${prototype.kind}'.`,
        { details: { kind: prototype.kind, uri: prototype.uri } },
      );
    }

    // Disclosure must be confirmed *before* validating the avatar variant.
    assertDisclosurePresent(options);
    disclosurePresent = true;

    variantReports.push(await validateVariant(prototype, options));
    assertTechnicalEquivalence(original, prototype, toleranceMs);
    avatarVariantValidated = true;
  }

  return {
    valid: true,
    variants: variantReports,
    avatarVariantValidated,
    disclosurePresent,
    limitations: TRANSLATION_LIMITATIONS,
  };
}
