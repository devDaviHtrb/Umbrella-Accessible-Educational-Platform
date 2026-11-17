// Build avatar segment requests from normalized transcript cues.
//
// Implements the `buildAvatarRequests` contract from the design document
// ("Key Functions with Formal Specifications"). It turns the timed cues of
// the normalized SRT into avatar segment requests, deriving the text to
// translate only from timed cues — never from untimed free text.
//
// Postconditions (from the design):
//   - Every spoken cue ID appears in exactly one request.
//   - Adjacent cues may be grouped only when the text order and the total
//     target interval (targetStartMs/targetEndMs) remain traceable via the
//     request's cueIds.
//   - The requestId is deterministic, derived from the grouped cue IDs.
//
// The default is the simplest deterministic baseline: one request per spoken
// cue. Optional adjacency grouping merges consecutive cues whose gap is within
// a configured threshold, preserving chronological text order and a traceable
// total interval.

import type {
  AvatarSegmentRequest,
  Milliseconds,
  TranscriptCue,
} from "../domain/types.js";
import { PipelineError } from "../domain/PipelineError.js";

/** Options for {@link buildAvatarRequests}. */
export type BuildAvatarRequestsOptions = Readonly<{
  /**
   * Maximum gap, in milliseconds, between the end of one cue and the start of
   * the next for the two to be grouped into a single request. The default of
   * `0` disables grouping entirely, yielding one request per cue — the
   * simplest deterministic baseline. Grouping only happens when a positive
   * threshold is configured. Must be a finite value `>= 0`.
   */
  groupMaxGapMs?: Milliseconds;
  /** Text used to join the text of grouped cues. Defaults to a single space. */
  joinWith?: string;
}>;

/** Default grouping gap: disabled (one request per cue). */
export const DEFAULT_GROUP_MAX_GAP_MS = 0;

/** Default separator for joining grouped cue text. */
export const DEFAULT_JOIN_WITH = " ";

/**
 * Build deterministic avatar segment requests from normalized transcript cues.
 *
 * @param cues Normalized, non-empty transcript cues (see
 *   `parseAndNormalizeSrt`). They are expected to be chronologically ordered;
 *   requests follow that same order.
 * @param options Optional adjacency grouping configuration.
 * @returns Requests in chronological order. Each cue ID appears in exactly one
 *   request, and each request's `cueIds`, `targetStartMs` and `targetEndMs`
 *   make its text order and target interval traceable.
 * @throws {PipelineError} `INVALID_SRT` when `cues` is empty or a cue carries
 *   an invalid interval.
 */
export function buildAvatarRequests(
  cues: readonly TranscriptCue[],
  options: BuildAvatarRequestsOptions = {},
): readonly AvatarSegmentRequest[] {
  if (cues.length === 0) {
    throw new PipelineError(
      "INVALID_SRT",
      "buildAvatarRequests requires at least one normalized cue.",
    );
  }

  const groupMaxGapMs = options.groupMaxGapMs ?? DEFAULT_GROUP_MAX_GAP_MS;
  if (!Number.isFinite(groupMaxGapMs) || groupMaxGapMs < 0) {
    throw new PipelineError(
      "INVALID_SRT",
      `groupMaxGapMs must be a finite number >= 0, received ${String(groupMaxGapMs)}.`,
    );
  }
  const joinWith = options.joinWith ?? DEFAULT_JOIN_WITH;

  // Partition cues into groups of adjacent cues. Each cue lands in exactly one
  // group and groups preserve the input (chronological) order.
  const groups: TranscriptCue[][] = [];
  for (const cue of cues) {
    assertCueInterval(cue);

    const currentGroup = groups[groups.length - 1];
    const previous = currentGroup?.[currentGroup.length - 1];

    if (
      currentGroup !== undefined &&
      previous !== undefined &&
      isGroupable(previous, cue, groupMaxGapMs)
    ) {
      currentGroup.push(cue);
    } else {
      groups.push([cue]);
    }
  }

  return groups.map((group) => toRequest(group, joinWith));
}

/**
 * Whether `next` may be grouped with `previous`. Grouping is opt-in: with the
 * default `groupMaxGapMs` of `0` no cues are ever grouped (one request per
 * cue). When a positive threshold is configured, cues are groupable only when
 * `next` starts at or after `previous` ends (no overlap that would scramble
 * text order) and the gap between them is within `groupMaxGapMs`.
 */
function isGroupable(
  previous: TranscriptCue,
  next: TranscriptCue,
  groupMaxGapMs: Milliseconds,
): boolean {
  if (groupMaxGapMs <= 0) {
    return false;
  }
  const gap = next.startMs - previous.endMs;
  return gap >= 0 && gap <= groupMaxGapMs;
}

/** Build a single request from a non-empty group of adjacent cues. */
function toRequest(
  group: readonly TranscriptCue[],
  joinWith: string,
): AvatarSegmentRequest {
  // group is guaranteed non-empty by construction.
  const cueIds = group.map((cue) => cue.id);
  const textPtBr = group.map((cue) => cue.textPtBr).join(joinWith);

  // Text order follows the chronological cue order; the total target interval
  // spans the first cue's start to the last cue's end.
  const targetStartMs = group[0]!.startMs;
  const targetEndMs = group[group.length - 1]!.endMs;

  return {
    requestId: `req-${cueIds.join("_")}`,
    cueIds,
    textPtBr,
    targetStartMs,
    targetEndMs,
  };
}

/** Guard a cue's interval; the normalizer should already enforce this. */
function assertCueInterval(cue: TranscriptCue): void {
  if (
    !Number.isFinite(cue.startMs) ||
    !Number.isFinite(cue.endMs) ||
    cue.startMs < 0 ||
    cue.startMs >= cue.endMs
  ) {
    throw new PipelineError(
      "INVALID_SRT",
      `Cue ${cue.id} has an invalid interval (start ${cue.startMs} ms, end ${cue.endMs} ms).`,
      { details: { cueId: cue.id, startMs: cue.startMs, endMs: cue.endMs } },
    );
  }
}
