// Variant transcoding (Transcoder component).
//
// `transcodeOriginal` produces the `original.mp4` variant in H.264/AAC from
// the source media (AV1 video + Opus audio in a WebM container). It is the
// first concrete transcode step of the pipeline and underpins Requirement 5:
//
//   5.1  The original variant is MP4 with H.264 video and AAC audio.
//   5.3  The source audio timing is preserved — no filter changes the PTS and
//        no resample alters the audio duration.
//
// The command is built and run through an injectable executor so tests can
// assert the exact ffmpeg argument vector without the binary being present.
// Absence of ffmpeg is a *runtime* failure (surfaced as a PipelineError), not
// a build/type failure: nothing here imports or shells out at module load.

import { PipelineError } from "../domain/PipelineError.js";
import type { Uri } from "../domain/types.js";

/** Outcome of a transcode command execution, as reported by the executor. */
export type TranscodeCommandResult = Readonly<{
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
 * Implementations receive the ffmpeg binary name and its argument vector
 * (already split, never a shell string) and resolve with the process result.
 * Injecting this boundary keeps {@link transcodeOriginal} pure with respect to
 * argument construction, so unit tests can capture `args` without ffmpeg.
 */
export type FfmpegExecutor = (
  binary: string,
  args: readonly string[],
) => Promise<TranscodeCommandResult>;

/** Tuning knobs for {@link transcodeOriginal}. All optional with safe defaults. */
export type TranscodeOriginalOptions = Readonly<{
  /** Command executor. Required in practice; see the overload note below. */
  executor: FfmpegExecutor;
  /** ffmpeg binary name or path. Defaults to `"ffmpeg"`. */
  ffmpegPath?: string;
  /** libx264 CRF quality (lower = higher quality). Defaults to `20`. */
  crf?: number;
  /** libx264 speed/compression preset. Defaults to `"medium"`. */
  preset?: string;
  /** AAC audio bitrate, e.g. `"192k"`. Defaults to `"192k"`. */
  audioBitrate?: string;
  /** Overwrite the destination if it exists. Defaults to `true`. */
  overwrite?: boolean;
}>;

/** Result of a successful {@link transcodeOriginal} run. */
export type TranscodeOriginalResult = Readonly<{
  /** URI of the produced `original.mp4`. */
  outputUri: Uri;
  /** The exact argument vector passed to ffmpeg (auditable / testable). */
  args: readonly string[];
}>;

/**
 * Builds the ffmpeg argument vector that transcodes `sourceUri` to an
 * H.264/AAC MP4 at `outputUri` while preserving the source audio timing.
 *
 * Timing-preservation rules (Requirement 5.3):
 *  - No `-filter`/`-af`/`-vf` that would rewrite presentation timestamps.
 *  - `-async 0` / no `aresample` so the audio is not stretched or padded.
 *  - `-vsync passthrough` keeps the source frame timestamps intact.
 *
 * Exported for direct unit testing of argument construction.
 */
export function buildTranscodeOriginalArgs(
  sourceUri: Uri,
  outputUri: Uri,
  options: TranscodeOriginalOptions,
): readonly string[] {
  const crf = options.crf ?? 20;
  const preset = options.preset ?? "medium";
  const audioBitrate = options.audioBitrate ?? "192k";
  const overwrite = options.overwrite ?? true;

  return [
    // Fail fast rather than block on an interactive overwrite prompt.
    overwrite ? "-y" : "-n",
    "-i",
    sourceUri,
    // Video: decode AV1 and re-encode to H.264 (Requirement 5.1).
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    // Audio: decode Opus and re-encode to AAC (Requirement 5.1).
    "-c:a",
    "aac",
    "-b:a",
    audioBitrate,
    // Timing preservation (Requirement 5.3): keep source PTS untouched and do
    // not let ffmpeg stretch, pad or drop audio samples to "fix" sync.
    "-vsync",
    "passthrough",
    "-async",
    "0",
    // Faststart moves the moov atom up front; it rewrites container layout
    // only, never sample timestamps.
    "-movflags",
    "+faststart",
    outputUri,
  ];
}

/**
 * Transcodes the source media into the `original.mp4` variant in H.264/AAC,
 * preserving the source audio without timing changes.
 *
 * The function only builds the command and delegates execution to
 * `options.executor`; it never imports a process library directly, so a
 * missing ffmpeg binary surfaces as a {@link PipelineError} at call time
 * rather than breaking the build.
 *
 * @throws PipelineError `GENERATION_FAILED` when the executor rejects or the
 *         process exits with a non-zero status.
 */
export async function transcodeOriginal(
  sourceUri: Uri,
  outputUri: Uri,
  options: TranscodeOriginalOptions,
): Promise<TranscodeOriginalResult> {
  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const args = buildTranscodeOriginalArgs(sourceUri, outputUri, options);

  let result: TranscodeCommandResult;
  try {
    result = await options.executor(ffmpegPath, args);
  } catch (cause) {
    throw new PipelineError(
      "GENERATION_FAILED",
      `Falha ao executar ffmpeg para produzir a variante original (${outputUri}).`,
      { cause, details: { sourceUri, outputUri, ffmpegPath } },
    );
  }

  if (result.exitCode !== 0) {
    throw new PipelineError(
      "GENERATION_FAILED",
      `ffmpeg encerrou com código ${result.exitCode} ao produzir a variante original (${outputUri}).`,
      {
        details: {
          sourceUri,
          outputUri,
          exitCode: result.exitCode,
          stderr: result.stderr,
        },
      },
    );
  }

  return { outputUri, args };
}
