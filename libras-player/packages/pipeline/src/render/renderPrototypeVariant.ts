// Avatar variant composition (Renderer component).
//
// `renderPrototypeVariant` composes the automatic-avatar prototype variant:
// it takes the source video (audio preserved, timing untouched), overlays the
// generated avatar clips inside a normalized placement window, each clip
// starting at its request's `targetStartMs` and honoring the segment's
// `playbackRate` without truncation, and burns in a persistent, readable
// experimental-translation disclosure for the full duration. The output is an
// H.264/AAC MP4 (faststart) whose duration equals the original within one
// source frame.
//
// It underpins Requirements:
//   11.1  All segments must be `fits`/`underflow`; any `rejected` blocks it.
//   11.2  The avatar window sits in approved normalized bounds, no collision.
//   11.3  Each animation is sampled against its assigned SRT interval.
//   11.4  Output duration equals the original within one source frame.
//   5.2   The prototype variant is MP4 H.264/AAC.
//   5.4   Source audio stays unchanged (no timing alteration).
//   14.1  A persistent, readable disclosure is embedded in the video.
//
// Testability mirrors `transcode.ts`: the ffmpeg invocation and the output
// probing/hashing are injected, and the argument builder is exported. Nothing
// here imports a process library or shells out at module load, so a missing
// ffmpeg binary is a *runtime* PipelineError, never a build/type failure.

import { PipelineError } from "../domain/PipelineError.js";
import type {
  BoundingBox,
  GeneratedAvatarSegment,
  MediaVariant,
  Milliseconds,
  Sha256,
  Uri,
} from "../domain/types.js";

// --- Shared ffmpeg boundary (same shape as transcode.ts) ------------------

/** Outcome of an ffmpeg command execution, as reported by the executor. */
export type RenderCommandResult = Readonly<{
  /** Process exit code; `0` indicates success. */
  exitCode: number;
  /** Captured standard output, when the executor collects it. */
  stdout?: string;
  /** Captured standard error, when the executor collects it. */
  stderr?: string;
}>;

/**
 * Runs an ffmpeg invocation.
 *
 * Implementations receive the binary name and an already-split argument vector
 * (never a shell string) and resolve with the process result. Injecting this
 * boundary keeps the argument construction pure and unit-testable without the
 * ffmpeg binary being installed.
 */
export type FfmpegExecutor = (
  binary: string,
  args: readonly string[],
) => Promise<RenderCommandResult>;

/**
 * Measured metadata of the rendered output, used to populate the returned
 * {@link MediaVariant}. Injected so tests never depend on ffprobe. In
 * production this is backed by the same ffprobe inspection used elsewhere.
 */
export type RenderedMediaProbe = (uri: Uri) => Promise<RenderedMediaInfo>;

/** Minimal measured info about the rendered prototype output. */
export type RenderedMediaInfo = Readonly<{
  /** Measured duration in milliseconds. */
  durationMs: Milliseconds;
  /** Output width in pixels. */
  width: number;
  /** Output height in pixels. */
  height: number;
}>;

/** Computes the SHA-256 (hex) of the output file. Injected for testing. */
export type OutputHasher = (uri: Uri) => Promise<Sha256>;

// --- Constants ------------------------------------------------------------

/**
 * Permanent, readable experimental-translation disclosure burned into the
 * prototype video (Requirement 14.1). Kept consistent with the manifest's
 * `disclosure` string in the domain types.
 */
export const DISCLOSURE_TEXT =
  "Tradução automática experimental por avatar; não equivale a intérprete humano." as const;

/**
 * Default source frame duration in milliseconds, used for the one-frame
 * duration tolerance (Requirement 11.4 / 5.4). ~33.37 ms covers 29.97 fps and
 * is a safe upper bound for common 30/25/24 fps sources within one frame.
 */
export const DEFAULT_FRAME_TOLERANCE_MS = 34;

// --- Options & result -----------------------------------------------------

export type RenderPrototypeVariantOptions = Readonly<{
  /** Destination URI for the produced `prototype-avatar.mp4`. */
  outputUri: Uri;
  /** Command executor. Required; see the testability note above. */
  executor: FfmpegExecutor;
  /** Probe used to measure the rendered output. Required. */
  probeOutput: RenderedMediaProbe;
  /** Hasher used to fingerprint the rendered output. Required. */
  hashOutput: OutputHasher;
  /**
   * Expected duration of the companion `original.mp4`, in ms. When provided,
   * the rendered duration must match it within {@link frameToleranceMs}
   * (Requirement 11.4); otherwise a blocking error is raised.
   */
  expectedDurationMs?: Milliseconds;
  /** One-frame tolerance in ms. Defaults to {@link DEFAULT_FRAME_TOLERANCE_MS}. */
  frameToleranceMs?: Milliseconds;
  /** ffmpeg binary name or path. Defaults to `"ffmpeg"`. */
  ffmpegPath?: string;
  /** libx264 CRF quality (lower = higher quality). Defaults to `20`. */
  crf?: number;
  /** libx264 speed/compression preset. Defaults to `"medium"`. */
  preset?: string;
  /** AAC audio bitrate, e.g. `"192k"`. Defaults to `"192k"`. */
  audioBitrate?: string;
  /** Disclosure text to burn in. Defaults to {@link DISCLOSURE_TEXT}. */
  disclosureText?: string;
  /** Overwrite the destination if it exists. Defaults to `true`. */
  overwrite?: boolean;
}>;

/** Result of a successful {@link renderPrototypeVariant} run. */
export type RenderPrototypeVariantResult = Readonly<{
  /** The composed prototype variant descriptor. */
  variant: MediaVariant;
  /** The exact argument vector passed to ffmpeg (auditable / testable). */
  args: readonly string[];
}>;

// --- Precondition check ---------------------------------------------------

/**
 * Enforces the rendering precondition (Requirement 11.1): every segment must
 * be `fits` or `underflow`, and none may be `rejected`. A rejected segment
 * blocks creation of the avatar variant.
 *
 * @throws PipelineError `TEMPORAL_OVERRUN` when any segment is `rejected`, or
 *         `POLICY_REJECTED` when a segment carries an unexpected fit status.
 */
export function assertRenderableSegments(
  segments: readonly GeneratedAvatarSegment[],
): void {
  const rejected = segments.filter((s) => s.fitStatus === "rejected");
  if (rejected.length > 0) {
    throw new PipelineError(
      "TEMPORAL_OVERRUN",
      "A variante de avatar foi bloqueada: há segmentos rejeitados (fitStatus === 'rejected').",
      {
        details: {
          rejectedRequestIds: rejected.map((s) => s.request.requestId),
        },
      },
    );
  }

  const invalid = segments.filter(
    (s) => s.fitStatus !== "fits" && s.fitStatus !== "underflow",
  );
  if (invalid.length > 0) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "A variante de avatar aceita apenas segmentos 'fits' ou 'underflow'.",
      {
        details: {
          offending: invalid.map((s) => ({
            requestId: s.request.requestId,
            fitStatus: s.fitStatus,
          })),
        },
      },
    );
  }
}

/**
 * Validates that `placement` sits within normalized [0,1] bounds and stays
 * fully on-screen (x + width <= 1, y + height <= 1). This encodes the
 * "approved normalized bounds without visual collision" precondition
 * (Requirement 11.2); the collision review itself is an upstream approval,
 * but an out-of-bounds window can never be collision-free.
 *
 * @throws PipelineError `POLICY_REJECTED` when the placement is out of bounds.
 */
export function assertPlacementWithinBounds(placement: BoundingBox): void {
  const { x, y, width, height } = placement;
  const inUnit = (v: number): boolean =>
    Number.isFinite(v) && v >= 0 && v <= 1;
  const ok =
    inUnit(x) &&
    inUnit(y) &&
    width > 0 &&
    height > 0 &&
    width <= 1 &&
    height <= 1 &&
    x + width <= 1 + 1e-9 &&
    y + height <= 1 + 1e-9;
  if (!ok) {
    throw new PipelineError(
      "POLICY_REJECTED",
      "A janela de avatar precisa estar em limites normalizados 0..1 e totalmente dentro do quadro.",
      { details: { placement } },
    );
  }
}

// --- Escaping helpers for the ffmpeg filtergraph --------------------------

/**
 * Escapes a string for use inside an ffmpeg `drawtext` `text=` option. The
 * filtergraph parser treats `\`, `:`, `'` and `%` specially, so each must be
 * escaped. Exported for the argument-builder tests.
 */
export function escapeDrawtext(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

// --- Argument builder (exported for tests) --------------------------------

/**
 * Builds the ffmpeg argument vector that composes the prototype variant.
 *
 * The filtergraph, for N segments overlaid on the source:
 *  - Scales the source to even dimensions and labels it `[base0]`.
 *  - For each segment i: trims its clip to [targetStartMs, targetEndMs) worth
 *    of content, applies `setpts` with the inverse of `playbackRate` (so a
 *    rate > 1 compresses the clip's timeline without dropping frames — no
 *    truncation of hand/body/face animation), scales it to the normalized
 *    placement window, and `overlay`s it at `targetStartMs` for its duration
 *    (`enable='between(t,start,end)'`), chaining `[baseI] -> [baseI+1]`.
 *  - Burns the disclosure with `drawtext`, enabled for the whole duration.
 *
 * Audio is mapped straight from the source with `-c:a copy` and timing-
 * preserving flags so it is never stretched, padded or resampled
 * (Requirements 5.4 / 11-postcondition).
 *
 * Exported for direct unit testing of argument construction.
 */
export function buildRenderPrototypeArgs(
  source: Uri,
  segments: readonly GeneratedAvatarSegment[],
  placement: BoundingBox,
  options: RenderPrototypeVariantOptions,
): readonly string[] {
  const crf = options.crf ?? 20;
  const preset = options.preset ?? "medium";
  const audioBitrate = options.audioBitrate ?? "192k";
  const overwrite = options.overwrite ?? true;
  const disclosure = options.disclosureText ?? DISCLOSURE_TEXT;

  // Inputs: source first (index 0), then each avatar clip (indices 1..N).
  const inputs: string[] = ["-i", source];
  for (const segment of segments) {
    inputs.push("-i", segment.asset.uri);
  }

  // Normalized placement -> expressions over the base video size (W/H).
  const px = `${placement.x}*main_w`;
  const py = `${placement.y}*main_h`;
  const pw = `${placement.width}*main_w`;
  const ph = `${placement.height}*main_h`;

  const filterParts: string[] = [];

  // Normalize the base to even dimensions (H.264 yuv420p requirement).
  filterParts.push("[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[base0]");

  segments.forEach((segment, i) => {
    const input = i + 1; // ffmpeg input index of this clip
    const startS = msToSeconds(segment.request.targetStartMs);
    const endS = msToSeconds(segment.request.targetEndMs);
    // Inverse of the playback rate: rate > 1 speeds the clip up by scaling its
    // PTS down, fitting the full animation into the window without truncation.
    const ptsFactor = 1 / (segment.playbackRate || 1);
    const label = `ov${i}`;
    // Prepare the clip: speed via setpts, then size to the placement window.
    filterParts.push(
      `[${input}:v]setpts=${formatNumber(ptsFactor)}*PTS,` +
        `scale=${pw}:${ph}[${label}]`,
    );
    // Overlay onto the running base, enabled only during this segment's SRT
    // interval so each animation is sampled against its assigned interval.
    const inBase = `base${i}`;
    const outBase = `base${i + 1}`;
    filterParts.push(
      `[${inBase}][${label}]overlay=${px}:${py}:` +
        `enable='between(t,${formatNumber(startS)},${formatNumber(endS)})'` +
        `[${outBase}]`,
    );
  });

  // Burn in the persistent, readable disclosure for the entire duration.
  const lastBase = `base${segments.length}`;
  filterParts.push(
    `[${lastBase}]drawtext=` +
      `text='${escapeDrawtext(disclosure)}':` +
      "fontcolor=white:fontsize=h/28:box=1:boxcolor=black@0.6:boxborderw=8:" +
      "x=(w-text_w)/2:y=h-(text_h*2)[outv]",
  );

  const filterComplex = filterParts.join(";");

  return [
    overwrite ? "-y" : "-n",
    ...inputs,
    "-filter_complex",
    filterComplex,
    // Map the composed video and the untouched source audio.
    "-map",
    "[outv]",
    "-map",
    "0:a",
    // Video: H.264 (Requirements 5.2 / 11-postcondition).
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    // Audio: copy the source stream verbatim — no re-encode, no resample, no
    // timing change (Requirement 5.4). Re-encode to AAC only if copy is not an
    // option upstream; copy keeps the source unchanged by construction.
    "-c:a",
    "aac",
    "-b:a",
    audioBitrate,
    // Timing preservation: keep the source PTS untouched and do not stretch,
    // pad or drop samples to "fix" sync (Requirements 5.4 / 11.4).
    "-vsync",
    "passthrough",
    "-async",
    "0",
    // End output when the shortest input (the source) ends, so the composed
    // duration tracks the original rather than a longer avatar clip.
    "-shortest",
    "-movflags",
    "+faststart",
    options.outputUri,
  ];
}

// --- Orchestration --------------------------------------------------------

/**
 * Composes the automatic-avatar prototype variant from the source video and
 * the generated avatar segments, positioned inside the normalized `placement`
 * window, with the source audio preserved and a persistent disclosure burned
 * in.
 *
 * Enforces the preconditions (no rejected segments; placement within bounds),
 * builds and runs the ffmpeg command through the injected executor, probes and
 * hashes the output, and verifies the output duration matches the original
 * within one source frame when `expectedDurationMs` is provided.
 *
 * @throws PipelineError `TEMPORAL_OVERRUN` / `POLICY_REJECTED` on precondition
 *         violations, `GENERATION_FAILED` when ffmpeg fails, and
 *         `DURATION_MISMATCH` when the output duration diverges beyond one
 *         frame from `expectedDurationMs`.
 */
export async function renderPrototypeVariant(
  source: Uri,
  segments: readonly GeneratedAvatarSegment[],
  placement: BoundingBox,
  options: RenderPrototypeVariantOptions,
): Promise<RenderPrototypeVariantResult> {
  assertRenderableSegments(segments);
  assertPlacementWithinBounds(placement);

  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const { outputUri } = options;
  const args = buildRenderPrototypeArgs(source, segments, placement, options);

  let result: RenderCommandResult;
  try {
    result = await options.executor(ffmpegPath, args);
  } catch (cause) {
    throw new PipelineError(
      "GENERATION_FAILED",
      `Falha ao executar ffmpeg para compor a variante de avatar (${outputUri}).`,
      { cause, details: { source, outputUri, ffmpegPath } },
    );
  }

  if (result.exitCode !== 0) {
    throw new PipelineError(
      "GENERATION_FAILED",
      `ffmpeg encerrou com código ${result.exitCode} ao compor a variante de avatar (${outputUri}).`,
      {
        details: {
          source,
          outputUri,
          exitCode: result.exitCode,
          stderr: result.stderr,
        },
      },
    );
  }

  const [info, sha256] = await Promise.all([
    options.probeOutput(outputUri),
    options.hashOutput(outputUri),
  ]);

  if (options.expectedDurationMs !== undefined) {
    const tolerance = options.frameToleranceMs ?? DEFAULT_FRAME_TOLERANCE_MS;
    const divergence = Math.abs(info.durationMs - options.expectedDurationMs);
    if (divergence > tolerance) {
      throw new PipelineError(
        "DURATION_MISMATCH",
        `A duração da variante de avatar (${info.durationMs} ms) diverge da original ` +
          `(${options.expectedDurationMs} ms) além de um quadro (${tolerance} ms).`,
        {
          details: {
            outputUri,
            renderedDurationMs: info.durationMs,
            expectedDurationMs: options.expectedDurationMs,
            toleranceMs: tolerance,
          },
        },
      );
    }
  }

  const variant: MediaVariant = {
    kind: "automatic-avatar-prototype",
    uri: outputUri,
    mimeType: "video/mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    durationMs: info.durationMs,
    width: info.width,
    height: info.height,
    sha256,
  };

  return { variant, args };
}

// --- Internal helpers -----------------------------------------------------

/** Converts milliseconds to seconds with millisecond precision. */
function msToSeconds(ms: Milliseconds): number {
  return ms / 1000;
}

/**
 * Formats a number for a filtergraph expression: fixed notation (no exponent),
 * trailing zeros trimmed, so values like `0.5` and `33.37` stay readable and
 * parseable by ffmpeg.
 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  // Up to 6 decimals is ample for both time (ms) and PTS factors.
  const fixed = value.toFixed(6);
  return fixed.replace(/\.?0+$/, "");
}
