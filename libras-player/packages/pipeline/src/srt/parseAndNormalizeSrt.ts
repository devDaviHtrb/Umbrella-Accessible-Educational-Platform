// SRT parser and normalizer for the pipeline.
//
// Implements the `parseAndNormalizeSrt` contract from the design document
// ("Key Functions with Formal Specifications"). It parses the real
// `subtitles.txt` (SRT with timed cues), normalizes line endings without
// altering the text, orders cues stably, and limits cue bounds to the media
// duration. The final cue of the real media ends at 815 400 ms while the
// measured duration is 814 681 ms; the 719 ms discrepancy is clamped and
// reported. Discrepancies beyond the configured tolerance fail with a
// blocking error instead of being silently adjusted.

import type { Milliseconds, TranscriptCue } from "../domain/types.js";
import { PipelineError } from "../domain/PipelineError.js";

/** Options for {@link parseAndNormalizeSrt}. */
export type ParseAndNormalizeSrtOptions = Readonly<{
  /**
   * Maximum amount a cue end may exceed `mediaDurationMs` and still be
   * clamped to the media duration instead of failing validation. The real
   * media overruns by 719 ms, so the default tolerates that.
   */
  clampToleranceMs?: Milliseconds;
  /**
   * Optional sink for clamp discrepancies. Each clamped cue reports the
   * original end, the clamped end and the discrepancy in milliseconds.
   */
  onClamp?: (event: ClampEvent) => void;
}>;

/** A single clamp discrepancy reported while normalizing cue bounds. */
export type ClampEvent = Readonly<{
  cueId: string;
  originalEndMs: Milliseconds;
  clampedEndMs: Milliseconds;
  discrepancyMs: Milliseconds;
}>;

/** Default clamp tolerance: covers the real media's 719 ms overrun. */
export const DEFAULT_CLAMP_TOLERANCE_MS = 719;

type ParsedCue = {
  readonly sourceIndex: number;
  readonly startMs: Milliseconds;
  readonly endMs: Milliseconds;
  readonly textPtBr: string;
};

/**
 * Parse an SRT string and normalize it into ordered, bounded transcript cues.
 *
 * @param srt Decoded Unicode SRT text containing parseable cues.
 * @param mediaDurationMs Measured media duration in ms; must be `> 0`.
 * @param options Clamp tolerance and clamp-reporting hook.
 * @returns Cues stably ordered by start, end and source index, each with
 *   `0 <= startMs < endMs <= mediaDurationMs` and text preserved.
 * @throws {PipelineError} `INVALID_SRT` when the text is not parseable or a
 *   discrepancy exceeds the configured clamp tolerance.
 */
export function parseAndNormalizeSrt(
  srt: string,
  mediaDurationMs: Milliseconds,
  options: ParseAndNormalizeSrtOptions = {},
): readonly TranscriptCue[] {
  if (!Number.isFinite(mediaDurationMs) || mediaDurationMs <= 0) {
    throw new PipelineError(
      "INVALID_SRT",
      `mediaDurationMs must be a positive number, received ${String(mediaDurationMs)}.`,
    );
  }

  const clampToleranceMs =
    options.clampToleranceMs ?? DEFAULT_CLAMP_TOLERANCE_MS;

  const parsed = parseBlocks(normalizeLineEndings(srt));

  // Stable order: start, then end, then source index. Array.prototype.sort is
  // stable in modern engines, but comparing the source index keeps the order
  // explicit and independent of that guarantee.
  const ordered = [...parsed].sort(
    (a, b) =>
      a.startMs - b.startMs ||
      a.endMs - b.endMs ||
      a.sourceIndex - b.sourceIndex,
  );

  const cues: TranscriptCue[] = [];
  for (const cue of ordered) {
    const endMs = clampEnd(cue, mediaDurationMs, clampToleranceMs, options);

    if (cue.startMs < 0) {
      throw new PipelineError(
        "INVALID_SRT",
        `Cue ${cue.sourceIndex} has a negative start (${cue.startMs} ms).`,
        { details: { cueId: String(cue.sourceIndex), startMs: cue.startMs } },
      );
    }
    if (cue.startMs >= endMs) {
      throw new PipelineError(
        "INVALID_SRT",
        `Cue ${cue.sourceIndex} has a non-positive duration ` +
          `(start ${cue.startMs} ms, end ${endMs} ms).`,
        {
          details: { cueId: String(cue.sourceIndex), startMs: cue.startMs, endMs },
        },
      );
    }

    cues.push({
      id: String(cue.sourceIndex),
      index: cue.sourceIndex,
      startMs: cue.startMs,
      endMs,
      textPtBr: cue.textPtBr,
      sourceFormat: "srt",
    });
  }

  return cues;
}

/**
 * Limit a cue end to the media duration. Within tolerance the overrun is
 * clamped and reported; beyond tolerance it is a blocking error.
 */
function clampEnd(
  cue: ParsedCue,
  mediaDurationMs: Milliseconds,
  clampToleranceMs: Milliseconds,
  options: ParseAndNormalizeSrtOptions,
): Milliseconds {
  if (cue.endMs <= mediaDurationMs) {
    return cue.endMs;
  }

  const discrepancyMs = cue.endMs - mediaDurationMs;
  if (discrepancyMs > clampToleranceMs) {
    throw new PipelineError(
      "INVALID_SRT",
      `Cue ${cue.sourceIndex} ends at ${cue.endMs} ms, exceeding the media ` +
        `duration of ${mediaDurationMs} ms by ${discrepancyMs} ms, which is ` +
        `beyond the clamp tolerance of ${clampToleranceMs} ms.`,
      {
        details: {
          cueId: String(cue.sourceIndex),
          originalEndMs: cue.endMs,
          mediaDurationMs,
          discrepancyMs,
          clampToleranceMs,
        },
      },
    );
  }

  options.onClamp?.({
    cueId: String(cue.sourceIndex),
    originalEndMs: cue.endMs,
    clampedEndMs: mediaDurationMs,
    discrepancyMs,
  });

  return mediaDurationMs;
}

/** Normalize CRLF and lone CR to LF without touching cue text content. */
function normalizeLineEndings(srt: string): string {
  return srt.replace(/\r\n?/g, "\n");
}

const TIMECODE_LINE =
  /^(\d{1,2}):([0-5]?\d):([0-5]?\d)[,.](\d{1,3})\s*-->\s*(\d{1,2}):([0-5]?\d):([0-5]?\d)[,.](\d{1,3})/;

/**
 * Split normalized text into cue blocks and parse each one. A block is a run
 * of non-empty lines separated by one or more blank lines. The optional
 * numeric index line is tolerated but not required.
 */
function parseBlocks(normalized: string): ParsedCue[] {
  const stripped = normalized.replace(/^\uFEFF/, "");
  const blocks = stripped
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+$/, ""))
    .filter((block) => block.trim().length > 0);

  if (blocks.length === 0) {
    throw new PipelineError(
      "INVALID_SRT",
      "No SRT cues were found in the provided text.",
    );
  }

  const cues: ParsedCue[] = [];
  blocks.forEach((block, blockIndex) => {
    cues.push(parseBlock(block, blockIndex));
  });
  return cues;
}

function parseBlock(block: string, blockIndex: number): ParsedCue {
  const lines = block.split("\n");

  // An optional numeric index may precede the timecode line.
  let cursor = 0;
  let sourceIndex = blockIndex + 1;
  if (lines[0] !== undefined && /^\d+$/.test(lines[0].trim())) {
    sourceIndex = Number.parseInt(lines[0].trim(), 10);
    cursor = 1;
  }

  const timecodeLine = lines[cursor];
  if (timecodeLine === undefined) {
    throw new PipelineError(
      "INVALID_SRT",
      `Cue block ${blockIndex + 1} is missing a timecode line.`,
      { details: { blockIndex } },
    );
  }

  const match = TIMECODE_LINE.exec(timecodeLine.trim());
  if (match === null) {
    throw new PipelineError(
      "INVALID_SRT",
      `Cue block ${blockIndex + 1} has an unparseable timecode line: ` +
        `"${timecodeLine.trim()}".`,
      { details: { blockIndex, line: timecodeLine.trim() } },
    );
  }

  const startMs = toMilliseconds(match[1], match[2], match[3], match[4]);
  const endMs = toMilliseconds(match[5], match[6], match[7], match[8]);

  // Preserve the original text exactly, joined with normalized newlines.
  const textPtBr = lines.slice(cursor + 1).join("\n");

  return { sourceIndex, startMs, endMs, textPtBr };
}

function toMilliseconds(
  hours: string,
  minutes: string,
  seconds: string,
  millis: string,
): Milliseconds {
  // SRT millis are exactly three digits; pad right-truncated matches so "68"
  // reads as 680 ms rather than 68 ms.
  const paddedMillis = millis.padEnd(3, "0");
  return (
    Number.parseInt(hours, 10) * 3_600_000 +
    Number.parseInt(minutes, 10) * 60_000 +
    Number.parseInt(seconds, 10) * 1_000 +
    Number.parseInt(paddedMillis, 10)
  );
}
