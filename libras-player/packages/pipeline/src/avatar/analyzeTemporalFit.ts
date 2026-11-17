// Temporal fit analysis for a single generated avatar segment.
//
// Implements the `analyzeTemporalFit` contract from the design document
// ("Key Functions with Formal Specifications"). Given a generated avatar
// `asset` and the `request` that produced it, it decides whether the complete
// animation fits the target SRT interval without ever truncating signs, and
// classifies the result into one of the design's `FitStatus` values.
//
// Postconditions (from the design):
//   - Returns `fits` only when the complete animation fits at rate 1
//     (Req 10.1).
//   - May return an adjusted `playbackRate` only when
//     `1 <= playbackRate <= maxPlaybackRate` AND a legibility policy permits
//     it (Req 10.2).
//   - Never truncates hand, body or facial animation to force a fit
//     (Req 10.3): the full `asset.durationMs` is always presented.
//   - An overrun that cannot be resolved within policy returns `rejected` and
//     blocks creation of the avatar variant (Req 10.4).
//   - Gaps (animation shorter than the target interval) are represented by an
//     idle pose / transparent absence as `underflow`, never by shifting later
//     cues out of sync (Req 10.5).
//
// The analysis is pure and local to one segment: it does not look at or move
// neighbouring cues. Keeping later cues anchored to their SRT timecodes is a
// property of the pipeline that composes these segments; this function only
// guarantees it never asks for a shift by refusing to truncate and by
// rejecting an unresolvable overrun outright.

import type {
  AvatarAsset,
  AvatarSegmentRequest,
  FitStatus,
  GeneratedAvatarSegment,
  Milliseconds,
} from "../domain/types.js";
import { PipelineError } from "../domain/PipelineError.js";

/** Default tolerance (ms) within which an animation is considered to fit. */
export const DEFAULT_FIT_TOLERANCE_MS = 1;

/** Options for {@link analyzeTemporalFit}. */
export type AnalyzeTemporalFitOptions = Readonly<{
  /**
   * Slack, in milliseconds, allowed when comparing the animation duration to
   * the target interval. Absorbs sub-millisecond rounding from the generator
   * so a segment that is e.g. 0.4 ms longer than its interval still counts as
   * fitting at rate 1. Must be finite and `>= 0`. Defaults to
   * {@link DEFAULT_FIT_TOLERANCE_MS}.
   */
  fitToleranceMs?: Milliseconds;
  /**
   * Legibility policy gate. When speeding an animation up to fit, the required
   * `playbackRate` is offered to this predicate; returning `false` forbids the
   * speed-up even when the rate is within `[1, maxPlaybackRate]`, which turns
   * the segment into a `rejected` overrun. Defaults to always allowing a rate
   * that is already within the bound (the bound itself is the policy).
   */
  isLegibleAtRate?: (playbackRate: number) => boolean;
}>;

/**
 * Classifies how a generated avatar animation fits its target SRT interval.
 *
 * @param asset The generated avatar asset. Its `durationMs` must be positive.
 * @param request The originating request, carrying the target interval
 *   (`targetStartMs`/`targetEndMs`). The interval must be positive.
 * @param maxPlaybackRate The legibility ceiling for speeding up an animation.
 *   Must be `>= 1`; a value of exactly `1` forbids any speed-up.
 * @param options Optional fit tolerance and legibility policy.
 * @returns A {@link GeneratedAvatarSegment} whose `fitStatus` is:
 *   - `fits` when the full animation fits the interval at rate 1;
 *   - `underflow` when the animation is shorter than the interval (idle pose /
 *     transparent absence fills the gap, no later cue is shifted);
 *   - `fits` with `playbackRate > 1` when the animation only fits by speeding
 *     up within `[1, maxPlaybackRate]` and the legibility policy permits it;
 *   - `rejected` when the overrun cannot be resolved within policy, blocking
 *     the avatar variant.
 *   The animation is never truncated: `playbackRate` is the only lever, and a
 *   `rejected` segment keeps its full animation for auditing.
 * @throws {PipelineError} `TEMPORAL_OVERRUN` when the inputs are invalid
 *   (non-positive duration/interval or `maxPlaybackRate < 1`).
 */
export function analyzeTemporalFit(
  asset: AvatarAsset,
  request: AvatarSegmentRequest,
  maxPlaybackRate: number,
  options: AnalyzeTemporalFitOptions = {},
): GeneratedAvatarSegment {
  const animationMs = asset.durationMs;
  const intervalMs = request.targetEndMs - request.targetStartMs;

  // --- Precondition guards (design: durations/intervals are positive) ----
  if (!Number.isFinite(animationMs) || animationMs <= 0) {
    throw new PipelineError(
      "TEMPORAL_OVERRUN",
      `Asset do request ${request.requestId} tem duração inválida (${String(animationMs)} ms).`,
      { details: { requestId: request.requestId, durationMs: animationMs } },
    );
  }
  if (
    !Number.isFinite(request.targetStartMs) ||
    !Number.isFinite(request.targetEndMs) ||
    intervalMs <= 0
  ) {
    throw new PipelineError(
      "TEMPORAL_OVERRUN",
      `Request ${request.requestId} tem intervalo-alvo inválido ` +
        `(start ${request.targetStartMs} ms, end ${request.targetEndMs} ms).`,
      {
        details: {
          requestId: request.requestId,
          targetStartMs: request.targetStartMs,
          targetEndMs: request.targetEndMs,
        },
      },
    );
  }
  if (!Number.isFinite(maxPlaybackRate) || maxPlaybackRate < 1) {
    throw new PipelineError(
      "TEMPORAL_OVERRUN",
      `maxPlaybackRate deve ser um número finito >= 1, recebido ${String(maxPlaybackRate)}.`,
      { details: { requestId: request.requestId, maxPlaybackRate } },
    );
  }

  const fitToleranceMs = options.fitToleranceMs ?? DEFAULT_FIT_TOLERANCE_MS;
  if (!Number.isFinite(fitToleranceMs) || fitToleranceMs < 0) {
    throw new PipelineError(
      "TEMPORAL_OVERRUN",
      `fitToleranceMs deve ser um número finito >= 0, recebido ${String(fitToleranceMs)}.`,
      { details: { requestId: request.requestId, fitToleranceMs } },
    );
  }
  const isLegibleAtRate = options.isLegibleAtRate ?? (() => true);

  // --- Case 1: animation is shorter than the interval → underflow (10.5) --
  // The gap is filled by an idle pose / transparent absence. The animation
  // plays complete at rate 1; later cues keep their own SRT timecodes.
  if (animationMs < intervalMs - fitToleranceMs) {
    return segment(request, asset, "underflow", 1, [
      `Animação (${animationMs} ms) mais curta que o intervalo-alvo ` +
        `(${intervalMs} ms); lacuna representada por pose ociosa/ausência ` +
        `transparente sem deslocar cues posteriores.`,
    ]);
  }

  // --- Case 2: animation fits the interval at rate 1 → fits (10.1) --------
  // Within tolerance the complete animation already fits without acceleration.
  if (animationMs <= intervalMs + fitToleranceMs) {
    return segment(request, asset, "fits", 1, []);
  }

  // --- Case 3: animation is longer than the interval → try a speed-up -----
  // The only lever is playbackRate; the animation is never truncated (10.3).
  // The rate that would make the full animation land inside the interval:
  const requiredRate = animationMs / intervalMs;

  // A speed-up is admissible only when it stays within [1, maxPlaybackRate]
  // AND the legibility policy permits that rate (Req 10.2). Otherwise the
  // overrun cannot be resolved within policy and the segment is rejected
  // (Req 10.4) — blocking the avatar variant downstream.
  if (requiredRate <= maxPlaybackRate && isLegibleAtRate(requiredRate)) {
    return segment(request, asset, "fits", requiredRate, [
      `Animação (${animationMs} ms) excede o intervalo-alvo (${intervalMs} ms); ` +
        `ajustada à taxa ${requiredRate.toFixed(4)} dentro do limite de ` +
        `legibilidade (max ${maxPlaybackRate}). Nenhum quadro é descartado.`,
    ]);
  }

  return segment(request, asset, "rejected", 1, [
    `Overrun não resolúvel dentro da política: animação (${animationMs} ms) ` +
      `exigiria taxa ${requiredRate.toFixed(4)} para caber no intervalo ` +
      `(${intervalMs} ms), acima do limite de legibilidade (max ${maxPlaybackRate}) ` +
      `ou reprovada pela política. A variante de avatar é bloqueada; a ` +
      `animação não é truncada.`,
  ]);
}

/** Assemble a `GeneratedAvatarSegment` with the computed classification. */
function segment(
  request: AvatarSegmentRequest,
  asset: AvatarAsset,
  fitStatus: FitStatus,
  playbackRate: number,
  warnings: readonly string[],
): GeneratedAvatarSegment {
  return {
    request,
    asset,
    fitStatus,
    playbackRate,
    warnings,
  };
}
