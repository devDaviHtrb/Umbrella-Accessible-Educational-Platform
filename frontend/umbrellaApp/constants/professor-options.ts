import type {
  ActivityTypeOption,
  CourseDifficultyOption,
  MaterialKindOption,
  QuestionKindOption,
} from '@/types/professor';

export const professorActivityTypeOptions: ActivityTypeOption[] = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'entrega', label: 'Entrega' },
];

export const professorDifficultyOptions: CourseDifficultyOption[] = [
  { id: 1, label: 'Iniciante' },
  { id: 2, label: 'Intermediário' },
  { id: 3, label: 'Avançado' },
];

export function difficultyLabel(level: number | null | undefined): string {
  return professorDifficultyOptions.find((option) => option.id === level)?.label ?? 'Iniciante';
}

export const professorQuestionKindOptions: QuestionKindOption[] = [
  { id: 'multipla_escolha', label: 'Múltipla escolha' },
  { id: 'discursiva', label: 'Discursiva' },
];

export const MIN_QUESTION_ALTERNATIVES = 2;
export const MAX_QUESTION_ALTERNATIVES = 6;

export const professorMaterialKindOptions: MaterialKindOption[] = [
  { id: 'documents', label: 'Documentos' },
  { id: 'slides', label: 'Slides' },
  { id: 'images', label: 'Imagens' },
  { id: 'spreadsheets', label: 'Planilhas' },
  { id: 'videos', label: 'Vídeos' },
];

export const COURSE_TEXT_MAX_LENGTH = 255;

export const DEFAULT_COURSE_DIFFICULTY = 1;
export const DEFAULT_ACTIVITY_MAX_SCORE = 10;
export const DEFAULT_MODULE_REQUIRED = true;

export const SUBMISSION_STATUS = {
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  graded: 'GRADED',
} as const;
