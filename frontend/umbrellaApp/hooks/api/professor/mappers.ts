import { professorActivityTypeOptions, professorMaterialKindOptions, SUBMISSION_STATUS } from '@/constants/professor-options';
import type { ActivityDto, ActivitySubmissionResponseDto, QuestionDto } from '@/types/activities';
import type { ModuleMaterial } from '@/types/materials';
import type {
  CourseDifficulty,
  MaterialKind,
  ProfessorActivity,
  ProfessorActivityDetail,
  ProfessorCourse,
  ProfessorMaterial,
  ProfessorModule,
  ProfessorQuestion,
  StudentSubmission,
  SubmissionStatus,
} from '@/types/professor';
import type { CourseApiDto, CourseDetailApiDto, ModuleApiDto } from '@/types/professor-api';
import { formatFileSize } from '@/utils/files';

const PUBLISHED_LABEL = 'Publicado';

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toDifficulty(value: number | null | undefined): CourseDifficulty {
  return value === 2 || value === 3 ? value : 1;
}

export function mapCourse(dto: CourseApiDto): ProfessorCourse {
  return {
    id: String(dto.id),
    title: dto.name ?? '',
    eyebrow: dto.subjectName ?? '',
    description: dto.description ?? '',
    categoryId: dto.subjectId != null ? String(dto.subjectId) : '',
    status: 'publicado',
    statusLabel: PUBLISHED_LABEL,
    modulesCount: dto.moduleAmount ?? 0,
    difficultyLevel: toDifficulty(dto.difficultyLevel),
    imageUrl: dto.imageUrl ?? undefined,
    studentsCount: dto.studentsCount ?? 0,
  };
}

export function mapCourseDetail(dto: CourseDetailApiDto): ProfessorCourse {
  return {
    id: String(dto.id),
    title: dto.name ?? '',
    eyebrow: dto.subject?.name ?? '',
    description: dto.description ?? '',
    categoryId: dto.subject?.id != null ? String(dto.subject.id) : '',
    status: 'publicado',
    statusLabel: PUBLISHED_LABEL,
    modulesCount: dto.module_amount ?? 0,
    difficultyLevel: toDifficulty(dto.difficulty_level),
    imageUrl: dto.imageUrl ?? undefined,
  };
}

export function mapModule(
  courseId: string,
  dto: ModuleApiDto,
  index: number,
  activitiesCount: number,
): ProfessorModule {
  return {
    id: String(dto.id),
    courseId,
    number: String(index + 1).padStart(2, '0'),
    title: dto.name ?? '',
    description: '',
    status: 'publicado',
    statusLabel: PUBLISHED_LABEL,
    activitiesCount,
  };
}

export function mapActivity(
  courseId: string,
  module: ProfessorModule,
  dto: ActivityDto,
  submissions: ActivitySubmissionResponseDto[],
): ProfessorActivity {
  const type = dto.test ? 'quiz' : 'entrega';

  return {
    id: String(dto.id),
    courseId,
    moduleId: module.id,
    moduleTitle: module.title,
    title: dto.title ?? '',
    type,
    typeLabel: professorActivityTypeOptions.find((option) => option.id === type)?.label ?? type,
    maxScore: dto.maxScore ?? 0,
    questionsCount: (dto.questions ?? []).length,
    submittedCount: submissions.filter((item) => item.status !== SUBMISSION_STATUS.inProgress).length,
    gradedCount: submissions.filter((item) => item.status === SUBMISSION_STATUS.graded).length,
  };
}

export function alternativeLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function mapQuestion(dto: QuestionDto): ProfessorQuestion {
  const alternatives = [...(dto.alternatives ?? [])]
    .sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? '') || a.id - b.id)
    .map((alternative) => ({
      id: String(alternative.id),
      letter: alternative.letter ?? '',
      text: alternative.text ?? '',
      correct: !!alternative.correct,
    }));

  return {
    id: String(dto.id),
    number: dto.number ?? 0,
    statement: dto.statement ?? '',
    points: dto.points ?? 0,
    kind: alternatives.length > 0 ? 'multipla_escolha' : dto.essay ? 'discursiva' : null,
    alternatives,
    essay: dto.essay
      ? {
          id: String(dto.essay.id),
          expectedAnswer: dto.essay.expectedAnswer ?? '',
          minLetters: dto.essay.minLetters ?? undefined,
          maxLetters: dto.essay.maxLetters ?? undefined,
        }
      : undefined,
  };
}

export function mapActivityDetail(
  courseId: string,
  module: ProfessorModule,
  dto: ActivityDto,
): ProfessorActivityDetail {
  const type = dto.test ? 'quiz' : 'entrega';

  return {
    id: String(dto.id),
    courseId,
    moduleId: module.id,
    moduleTitle: module.title,
    title: dto.title ?? '',
    type,
    typeLabel: professorActivityTypeOptions.find((option) => option.id === type)?.label ?? type,
    maxScore: dto.maxScore ?? 0,
    questions: (dto.questions ?? []).map(mapQuestion).sort((a, b) => a.number - b.number || Number(a.id) - Number(b.id)),
  };
}

const SLIDE_EXTENSIONS = ['ppt', 'pptx', 'odp'];
const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls', 'ods', 'csv'];

function extensionOf(dto: ModuleMaterial): string {
  const fromType = (dto.fileType ?? '').toLowerCase().replace(/^\./, '');
  if (fromType && fromType.length <= 5) return fromType;

  const path = (dto.url ?? '').split(/[?#]/)[0];
  const dot = path.lastIndexOf('.');
  return dot > -1 ? path.slice(dot + 1).toLowerCase() : '';
}

function materialKindOf(dto: ModuleMaterial): MaterialKind {
  if (dto.resourceType === 'image') return 'images';
  if (dto.resourceType === 'video') return 'videos';

  const extension = extensionOf(dto);
  if (SLIDE_EXTENSIONS.includes(extension)) return 'slides';
  if (SPREADSHEET_EXTENSIONS.includes(extension)) return 'spreadsheets';
  return 'documents';
}

export function mapMaterial(courseId: string, module: ProfessorModule, dto: ModuleMaterial): ProfessorMaterial {
  const kind = materialKindOf(dto);

  return {
    id: String(dto.id),
    courseId,
    moduleId: module.id,
    moduleTitle: module.title,
    title: dto.title ?? '',
    description: dto.description ?? '',
    kind,
    kindLabel: professorMaterialKindOptions.find((option) => option.id === kind)?.label ?? kind,
    url: dto.url ?? '',
    fileSizeLabel: dto.size > 0 ? formatFileSize(dto.size) : undefined,
  };
}

const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  pendente: 'Pendente',
  entregue: 'Entregue',
  atrasado: 'Atrasado',
  corrigido: 'Corrigido',
};

function mapSubmissionStatus(status: string): SubmissionStatus {
  if (status === SUBMISSION_STATUS.graded) return 'corrigido';
  if (status === SUBMISSION_STATUS.completed) return 'entregue';
  return 'pendente';
}

function formatSubmittedAt(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;

  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Entregue em ${day}, ${time}`;
}

export function mapSubmission(
  courseId: string,
  module: ProfessorModule,
  activity: ActivityDto,
  dto: ActivitySubmissionResponseDto,
): StudentSubmission {
  const status = mapSubmissionStatus(dto.status);

  return {
    id: String(dto.id),
    courseId,
    moduleId: module.id,
    studentId: String(dto.userId),
    studentName: dto.userName?.trim() || `Aluno #${dto.userId}`,
    activityId: String(activity.id),
    activityTitle: activity.title ?? '',
    moduleTitle: module.title,
    maxScore: activity.maxScore ?? 0,
    status,
    statusLabel: SUBMISSION_STATUS_LABEL[status],
    submittedAtLabel: formatSubmittedAt(dto.submittedAt),
    grade: status === 'corrigido' ? dto.score : undefined,
    suggestedGrade: typeof dto.score === 'number' ? dto.score : undefined,
    answers: (dto.answers ?? []).map((answer) => ({
      id: String(answer.id),
      questionId: String(answer.questionId),
      chosenAlternativeId:
        answer.chosenAlternativeId != null ? String(answer.chosenAlternativeId) : undefined,
      essayAnswer: answer.essayAnswer ?? undefined,
      isCorrect: answer.isCorrect ?? undefined,
      score: typeof answer.score === 'number' ? answer.score : undefined,
    })),
  };
}
