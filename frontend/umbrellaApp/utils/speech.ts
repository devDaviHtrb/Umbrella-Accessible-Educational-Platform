import * as Speech from 'expo-speech';

const MAX_CHUNK_LENGTH = 3500;
const SPEECH_LANGUAGE = 'pt-BR';

export function normalizeForSpeech(texts: string[]): string {
  return texts
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 0)
    .map((text) => (/[.!?:;]$/.test(text) ? text : `${text}.`))
    .join(' ');
}

export function chunkText(text: string, maxLength: number = MAX_CHUNK_LENGTH): string[] {
  const content = text.trim();
  if (!content) return [];
  if (content.length <= maxLength) return [content];

  const sentences = content.match(/[^.!?]+[.!?]*\s*/g) ?? [content];
  const chunks: string[] = [];
  let current = '';

  const push = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
    current = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      push();
      for (let start = 0; start < sentence.length; start += maxLength) {
        chunks.push(sentence.slice(start, start + maxLength).trim());
      }
      continue;
    }
    if ((current + sentence).length > maxLength) push();
    current += sentence;
  }
  push();

  return chunks.filter((chunk) => chunk.length > 0);
}

let session = 0;

export function startReading(texts: string[], onFinish: () => void): boolean {
  const chunks = chunkText(normalizeForSpeech(texts));
  if (chunks.length === 0) return false;

  session += 1;
  const current = session;
  let index = 0;

  const finish = () => {
    if (current === session) onFinish();
  };

  const next = () => {
    if (current !== session) return;
    if (index >= chunks.length) {
      onFinish();
      return;
    }
    Speech.speak(chunks[index++], {
      language: SPEECH_LANGUAGE,
      onDone: next,
      onStopped: finish,
      onError: finish,
    });
  };

  Speech.stop();
  next();
  return true;
}

export function stopReading() {
  session += 1;
  Speech.stop();
}
