// CueScheduler — drives the Libras avatar from the native video clock.
//
// Task 4.1 — implements `resolveCueAt` (pure) and the `CueScheduler`
// contract (`resolveCueAt` / `onCueChange`) from design.md, plus an
// `update(positionMs)` driver that recomputes the active cue from the
// player's current position and emits a transition only when the active
// cue actually changes.
//
// It underpins Requirements:
//   6.1  The CueScheduler resolves the active cue solely from the
//        normalized SRT timestamps as the native player position advances.
//   6.3  While the position is inside a gap with no speech, no new
//        translation transition is emitted.
//   6.4  A seek re-positions the active cue coherently with the new
//        native player position.
//   6.5  The active cue is derived exclusively from the native player
//        position; the scheduler never redefines the video position — it
//        only reads position values handed to it.
//
// Design references: the `CueScheduler` interface and the `resolveCueAt`
// formal specification (pure function returning the single cue `c` with
// `c.startMs <= positionMs < c.endMs`, or `null` in a speech gap).
//
// The native video player is the master clock. This module is a pure
// scheduler: it takes positions as input and never writes them back.

import type { Milliseconds, TranscriptCue } from "@libras/pipeline/client";

// --- Pure resolution ------------------------------------------------------

/**
 * Resolves the single active cue at `positionMs`, or `null` in a speech gap.
 *
 * Pure function: it reads `cues` and `positionMs` and returns a cue (or
 * `null`) without mutating playback state or the transcript.
 *
 * A cue `c` is active iff `c.startMs <= positionMs < c.endMs` (start
 * inclusive, end exclusive). `cues` are expected to be the normalized,
 * stably-ordered cues produced by `parseAndNormalizeSrt`; when they are
 * ordered a binary search is used, otherwise a linear scan is a correct
 * fallback.
 *
 * Preconditions: `cues` normalized and ordered; `positionMs >= 0`.
 */
export function resolveCueAt(
  cues: readonly TranscriptCue[],
  positionMs: Milliseconds,
): TranscriptCue | null {
  if (cues.length === 0 || !Number.isFinite(positionMs) || positionMs < 0) {
    // No cues, or a non-finite/negative position: no defined active cue.
    return null;
  }

  // Binary search over cues ordered by `startMs`. If the collection is not
  // sorted (should not happen for normalized input) we fall back to a linear
  // scan so correctness never depends on the ordering assumption.
  if (isSortedByStart(cues)) {
    return binarySearchActiveCue(cues, positionMs);
  }
  return linearSearchActiveCue(cues, positionMs);
}

function isSortedByStart(cues: readonly TranscriptCue[]): boolean {
  for (let i = 1; i < cues.length; i += 1) {
    if (cues[i].startMs < cues[i - 1].startMs) return false;
  }
  return true;
}

function binarySearchActiveCue(
  cues: readonly TranscriptCue[],
  positionMs: Milliseconds,
): TranscriptCue | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cue = cues[mid];
    if (positionMs < cue.startMs) {
      hi = mid - 1;
    } else if (positionMs >= cue.endMs) {
      lo = mid + 1;
    } else {
      // startMs <= positionMs < endMs
      return cue;
    }
  }
  return null;
}

function linearSearchActiveCue(
  cues: readonly TranscriptCue[],
  positionMs: Milliseconds,
): TranscriptCue | null {
  for (const cue of cues) {
    if (positionMs >= cue.startMs && positionMs < cue.endMs) {
      return cue;
    }
  }
  return null;
}

// --- Scheduler ------------------------------------------------------------

/** A listener notified when the active cue changes (to a cue or to `null`). */
export type CueChangeHandler = (cue: TranscriptCue | null) => void;

/** Unsubscribe function returned by `onCueChange`. */
export type Unsubscribe = () => void;

/**
 * The `CueScheduler` contract from design.md, driven by the native video
 * clock (the master clock).
 */
export interface CueScheduler {
  /**
   * Resolves the active cue at `positionMs` (pure read; does not emit a
   * transition and does not mutate scheduler state).
   */
  resolveCueAt(positionMs: Milliseconds): TranscriptCue | null;
  /**
   * Recomputes the active cue from `positionMs` and, when it differs from the
   * previously active cue, notifies every `onCueChange` handler once with the
   * new cue (or `null`). A seek is just another position update.
   */
  update(positionMs: Milliseconds): void;
  /** Registers a cue-change listener; returns an unsubscribe function. */
  onCueChange(handler: CueChangeHandler): Unsubscribe;
}

/**
 * Creates a `CueScheduler` over a fixed set of normalized cues.
 *
 * The scheduler only reads positions handed to it via `update`; it never
 * writes the video position back (Requirement 6.5). `update` recomputes the
 * active cue and emits a transition only when it changes relative to the
 * previous one, so a seek re-positions the active cue coherently and a
 * speech gap resolves to `null` without a spurious re-trigger.
 */
export function createCueScheduler(
  cues: readonly TranscriptCue[],
): CueScheduler {
  // Snapshot the cues so later mutations of the caller's array cannot change
  // scheduling behavior mid-playback.
  const normalizedCues: readonly TranscriptCue[] = [...cues];
  const handlers = new Set<CueChangeHandler>();

  // Active-cue state. `hasActive` distinguishes "never updated yet" from
  // "updated and currently in a speech gap" so the first transition into a
  // gap is still emitted exactly once.
  let activeCue: TranscriptCue | null = null;
  let hasActive = false;

  const resolveCueAtPosition = (
    positionMs: Milliseconds,
  ): TranscriptCue | null => resolveCueAt(normalizedCues, positionMs);

  const sameCue = (
    a: TranscriptCue | null,
    b: TranscriptCue | null,
  ): boolean => {
    if (a === null || b === null) return a === b;
    return a.id === b.id;
  };

  const emit = (cue: TranscriptCue | null): void => {
    // Copy so an unsubscribe during dispatch does not skip a handler.
    for (const handler of [...handlers]) {
      handler(cue);
    }
  };

  return {
    resolveCueAt: resolveCueAtPosition,
    update(positionMs: Milliseconds): void {
      const next = resolveCueAtPosition(positionMs);
      if (hasActive && sameCue(next, activeCue)) {
        // No transition: same active cue (or still the same gap).
        return;
      }
      activeCue = next;
      hasActive = true;
      emit(next);
    },
    onCueChange(handler: CueChangeHandler): Unsubscribe {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}
