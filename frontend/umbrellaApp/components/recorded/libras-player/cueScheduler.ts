// CueScheduler — dirige o avatar a partir do relógio-mestre do vídeo.
// Portado de apps/mobile; emite uma transição apenas quando o cue ativo muda.

import { findActiveCue, type Milliseconds, type TranscriptCue } from './srt';

export type CueChangeHandler = (cue: TranscriptCue | null) => void;
export type Unsubscribe = () => void;

export interface CueScheduler {
  update(positionMs: Milliseconds): void;
  onCueChange(handler: CueChangeHandler): Unsubscribe;
  reset(): void;
}

export function createCueScheduler(cues: readonly TranscriptCue[]): CueScheduler {
  const list = [...cues];
  const handlers = new Set<CueChangeHandler>();
  let activeCue: TranscriptCue | null = null;
  let hasActive = false;

  const sameCue = (a: TranscriptCue | null, b: TranscriptCue | null): boolean => {
    if (a === null || b === null) return a === b;
    return a.id === b.id;
  };

  const emit = (cue: TranscriptCue | null): void => {
    for (const handler of [...handlers]) handler(cue);
  };

  return {
    update(positionMs: Milliseconds): void {
      const next = findActiveCue(list, positionMs) ?? null;
      if (hasActive && sameCue(next, activeCue)) return;
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
    reset(): void {
      activeCue = null;
      hasActive = false;
    },
  };
}
