// SRT parsing para o player de Libras (portado de apps/mobile/packages/pipeline,
// versão autossuficiente e pura — sem dependências de Node).
//
// Converte o texto SRT (legenda normal ou Libras) em cues ordenados usados para
// (a) exibir a caption sincronizada e (b) enviar o texto ao avatar VLibras.

export type Milliseconds = number;

export type TranscriptCue = {
  id: string;
  index: number;
  startMs: Milliseconds;
  endMs: Milliseconds;
  textPtBr: string;
};

const TIMECODE_LINE =
  /^(\d{1,2}):([0-5]?\d):([0-5]?\d)[,.](\d{1,3})\s*-->\s*(\d{1,2}):([0-5]?\d):([0-5]?\d)[,.](\d{1,3})/;

function normalizeLineEndings(srt: string): string {
  return srt.replace(/\r\n?/g, '\n');
}

function toMilliseconds(h: string, m: string, s: string, ms: string): Milliseconds {
  const paddedMs = ms.padEnd(3, '0');
  return (
    parseInt(h, 10) * 3_600_000 +
    parseInt(m, 10) * 60_000 +
    parseInt(s, 10) * 1_000 +
    parseInt(paddedMs, 10)
  );
}

/**
 * Parseia um SRT em cues ordenados por início. Tolera o índice numérico opcional
 * de cada bloco. Nunca lança por discrepância de duração: apenas descarta cues
 * inválidos (início negativo ou duração não positiva), para um player robusto.
 */
export function parseSrt(srt: string): TranscriptCue[] {
  const normalized = normalizeLineEndings(srt).replace(/^\uFEFF/, '');
  const blocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.replace(/\s+$/, ''))
    .filter((b) => b.trim().length > 0);

  const parsed: { index: number; startMs: number; endMs: number; text: string }[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n');
    let cursor = 0;
    let sourceIndex = blockIndex + 1;
    if (lines[0] !== undefined && /^\d+$/.test(lines[0].trim())) {
      sourceIndex = parseInt(lines[0].trim(), 10);
      cursor = 1;
    }
    const timecodeLine = lines[cursor];
    if (timecodeLine === undefined) return;
    const match = TIMECODE_LINE.exec(timecodeLine.trim());
    if (match === null) return;

    const startMs = toMilliseconds(match[1], match[2], match[3], match[4]);
    const endMs = toMilliseconds(match[5], match[6], match[7], match[8]);
    const text = lines.slice(cursor + 1).join('\n').trim();

    if (startMs < 0 || startMs >= endMs || text.length === 0) return;
    parsed.push({ index: sourceIndex, startMs, endMs, text });
  });

  parsed.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs || a.index - b.index);

  return parsed.map((c) => ({
    id: String(c.index),
    index: c.index,
    startMs: c.startMs,
    endMs: c.endMs,
    textPtBr: c.text,
  }));
}

/** Cue ativo (o que cobre `positionMs`), ou undefined num intervalo sem fala. */
export function findActiveCue(
  cues: readonly TranscriptCue[],
  positionMs: Milliseconds,
): TranscriptCue | undefined {
  return cues.find((cue) => positionMs >= cue.startMs && positionMs < cue.endMs);
}
