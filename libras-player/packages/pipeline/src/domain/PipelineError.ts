// Reusable blocking error for the pipeline.
//
// The pipeline signals blocking failures with a typed error that carries a
// `PipelineErrorCode` (defined in the design document) plus optional
// structured details for logging and auditing. Any pipeline stage (SRT
// normalization, media inspection, generation, validation, ...) throws this
// error so callers can branch on `code` without string matching.

import type { PipelineErrorCode } from "./types.js";

export type PipelineErrorDetails = Readonly<Record<string, unknown>>;

export type PipelineErrorOptions = Readonly<{
  /** Structured, serializable context about the failure. */
  details?: PipelineErrorDetails;
  /** Underlying error that triggered this failure, if any. */
  cause?: unknown;
}>;

/**
 * Blocking pipeline error tagged with a `PipelineErrorCode`.
 *
 * Use the static helpers (e.g. {@link PipelineError.durationMismatch}) for the
 * common codes, or construct directly for less common cases.
 */
export class PipelineError extends Error {
  /** Stable, machine-readable error code from the design contract. */
  public readonly code: PipelineErrorCode;

  /** Structured, serializable context about the failure. */
  public readonly details?: PipelineErrorDetails;

  public constructor(
    code: PipelineErrorCode,
    message: string,
    options: PipelineErrorOptions = {},
  ) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "PipelineError";
    this.code = code;
    if (options.details !== undefined) {
      this.details = options.details;
    }
    // Restore prototype chain for environments that downlevel `extends Error`.
    Object.setPrototypeOf(this, PipelineError.prototype);
  }

  /**
   * Type guard for a specific `code`. Useful in `catch` blocks that only
   * want to handle one kind of failure.
   */
  public static hasCode(
    value: unknown,
    code: PipelineErrorCode,
  ): value is PipelineError {
    return value instanceof PipelineError && value.code === code;
  }

  // --- Convenience factories for the common codes ------------------------

  public static invalidSrt(
    message: string,
    options?: PipelineErrorOptions,
  ): PipelineError {
    return new PipelineError("INVALID_SRT", message, options);
  }

  public static durationMismatch(
    message: string,
    options?: PipelineErrorOptions,
  ): PipelineError {
    return new PipelineError("DURATION_MISMATCH", message, options);
  }

  public static assetIntegrityFailed(
    message: string,
    options?: PipelineErrorOptions,
  ): PipelineError {
    return new PipelineError("ASSET_INTEGRITY_FAILED", message, options);
  }
}

/** Type guard: narrows an unknown value to {@link PipelineError}. */
export function isPipelineError(value: unknown): value is PipelineError {
  return value instanceof PipelineError;
}
