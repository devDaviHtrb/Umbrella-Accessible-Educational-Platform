import { MAX_QUESTION_ALTERNATIVES, MIN_QUESTION_ALTERNATIVES } from '@/constants/professor-options';
import type { AlternativeDraft, ProfessorQuestionInput, QuestionKind } from '@/types/professor';

export type QuestionDraft = {
  kind: QuestionKind;
  statement: string;
  points: string;
  alternatives: AlternativeDraft[];
  expectedAnswer: string;
  minLetters: string;
  maxLetters: string;
};

export type QuestionErrors = {
  statement?: string;
  points?: string;
  alternatives?: string;
  emptyAlternatives?: number[];
  expectedAnswer?: string;
  minLetters?: string;
  maxLetters?: string;
};

export type SavedLetterLimits = { minLetters?: number; maxLetters?: number };

const LIMIT_ERROR = 'Informe um número inteiro maior que zero.';

function parseLimit(value: string): number | undefined | 'invalid' {
  const text = value.trim();
  if (text === '') return undefined;
  if (!/^\d+$/.test(text)) return 'invalid';
  const parsed = parseInt(text, 10);
  return parsed > 0 ? parsed : 'invalid';
}

export function validateQuestionDraft(
  draft: QuestionDraft,
  saved?: SavedLetterLimits,
): { errors: QuestionErrors; input?: ProfessorQuestionInput } {
  const errors: QuestionErrors = {};

  const statement = draft.statement.trim();
  if (!statement) errors.statement = 'Informe o enunciado da questão.';

  const pointsText = draft.points.trim().replace(',', '.');
  const points = /^\d+(\.\d+)?$/.test(pointsText) ? Number(pointsText) : NaN;
  if (Number.isNaN(points)) errors.points = 'Informe os pontos (zero ou mais).';

  let minLetters: number | undefined;
  let maxLetters: number | undefined;

  if (draft.kind === 'multipla_escolha') {
    const { alternatives } = draft;

    if (alternatives.length < MIN_QUESTION_ALTERNATIVES) {
      errors.alternatives = `Adicione ao menos ${MIN_QUESTION_ALTERNATIVES} alternativas.`;
    } else if (alternatives.filter((item) => item.correct).length !== 1) {
      errors.alternatives = 'Marque exatamente uma alternativa como correta.';
    }

    const empty = alternatives.flatMap((item, index) => (item.text.trim() ? [] : [index]));
    if (empty.length > 0) {
      errors.emptyAlternatives = empty;
      errors.alternatives = errors.alternatives ?? 'Preencha o texto de todas as alternativas.';
    }
  } else {
    if (!draft.expectedAnswer.trim()) {
      errors.expectedAnswer = 'Informe a resposta esperada, ela é usada na correção.';
    }

    const min = parseLimit(draft.minLetters);
    const max = parseLimit(draft.maxLetters);

    if (min === 'invalid') errors.minLetters = LIMIT_ERROR;
    else if (min === undefined && saved?.minLetters !== undefined) {
      errors.minLetters = 'Depois de salvo, o limite não pode ser removido. Informe um valor.';
    } else minLetters = min;

    if (max === 'invalid') errors.maxLetters = LIMIT_ERROR;
    else if (max === undefined && saved?.maxLetters !== undefined) {
      errors.maxLetters = 'Depois de salvo, o limite não pode ser removido. Informe um valor.';
    } else maxLetters = max;

    if (!errors.minLetters && !errors.maxLetters && minLetters && maxLetters && minLetters > maxLetters) {
      errors.maxLetters = 'O máximo deve ser maior ou igual ao mínimo.';
    }
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    input: {
      kind: draft.kind,
      statement,
      points,
      alternatives: draft.alternatives.map((item) => ({ ...item, text: item.text.trim() })),
      expectedAnswer: draft.expectedAnswer.trim(),
      minLetters,
      maxLetters,
    },
  };
}

export function canAddAlternative(count: number): boolean {
  return count < MAX_QUESTION_ALTERNATIVES;
}
