import { createContext } from 'react';

export type ReadAloudRegistry = {
  nextOrder: () => number;
  set: (order: number, text: string) => void;
  remove: (order: number) => void;
  collect: () => string[];
};

export function createReadAloudRegistry(): ReadAloudRegistry {
  const entries = new Map<number, string>();
  let counter = 0;

  return {
    nextOrder: () => {
      counter += 1;
      return counter;
    },
    set: (order, text) => {
      const trimmed = text.trim();
      if (trimmed) entries.set(order, trimmed);
      else entries.delete(order);
    },
    remove: (order) => {
      entries.delete(order);
    },
    collect: () =>
      [...entries.entries()].sort((first, second) => first[0] - second[0]).map(([, text]) => text),
  };
}

export const ReadAloudContext = createContext<ReadAloudRegistry | null>(null);

export function extractText(children: unknown): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  return '';
}
