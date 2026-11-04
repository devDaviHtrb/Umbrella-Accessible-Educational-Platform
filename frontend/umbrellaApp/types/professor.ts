export type ProfessorCourseStatus = 'publicado' | 'rascunho';

export type ProfessorCourse = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  categoryId: string;
  status: ProfessorCourseStatus;
  statusLabel: string;
  modulesCount: number;
  activitiesCount?: number;
  materialsCount?: number;
  pendingSubmissionsCount?: number;
};

export type ProfessorCourseInput = {
  title: string;
  categoryId: string;
  description: string;
};

export type ProfessorCategory = {
  id: string;
  label: string;
};

export type ProfessorModuleStatus = 'publicado' | 'rascunho';

export type ProfessorModule = {
  id: string;
  courseId: string;
  number: string;
  title: string;
  description: string;
  status: ProfessorModuleStatus;
  statusLabel: string;
  activitiesCount: number;
};

export type ProfessorModuleInput = {
  title: string;
  description: string;
};

export type ActivityType = 'quiz' | 'entrega';

export type ActivityTypeOption = {
  id: ActivityType;
  label: string;
};

export type ProfessorActivity = {
  id: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  maxScore: number;
  questionsCount: number;
  submittedCount: number;
  gradedCount: number;
};

export type ProfessorActivityInput = {
  moduleId: string;
  title: string;
  type: ActivityType;
};

export type QuestionKind = 'multipla_escolha' | 'discursiva';

export type QuestionKindOption = {
  id: QuestionKind;
  label: string;
};

export type ProfessorAlternative = {
  id: string;
  letter: string;
  text: string;
  correct: boolean;
};

export type ProfessorEssay = {
  id: string;
  expectedAnswer: string;
  minLetters?: number;
  maxLetters?: number;
};

export type ProfessorQuestion = {
  id: string;
  number: number;
  statement: string;
  points: number;
  kind: QuestionKind | null;
  alternatives: ProfessorAlternative[];
  essay?: ProfessorEssay;
};

export type AlternativeDraft = {
  id?: string;
  text: string;
  correct: boolean;
};

export type ProfessorQuestionInput = {
  kind: QuestionKind;
  statement: string;
  points: number;
  alternatives: AlternativeDraft[];
  expectedAnswer: string;
  minLetters?: number;
  maxLetters?: number;
};

export type ProfessorActivityDetail = {
  id: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  type: ActivityType;
  typeLabel: string;
  maxScore: number;
  questions: ProfessorQuestion[];
};

export type MaterialKind = 'documents' | 'slides' | 'images' | 'spreadsheets' | 'videos';

export type MaterialKindOption = {
  id: MaterialKind;
  label: string;
};

export type ProfessorMaterial = {
  id: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  description: string;
  kind: MaterialKind;
  kindLabel: string;
  url: string;
  fileName?: string;
  fileSizeLabel?: string;
};

export type ProfessorMaterialInput = {
  moduleId: string;
  title: string;
  description: string;
  kind: MaterialKind;
  url: string;
  fileName?: string;
  fileSizeLabel?: string;
  mimeType?: string;
};

export type SubmissionStatus = 'pendente' | 'entregue' | 'atrasado' | 'corrigido';

export type StudentSubmission = {
  id: string;
  courseId: string;
  moduleId: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  moduleTitle: string;
  maxScore: number;
  status: SubmissionStatus;
  statusLabel: string;
  submittedAtLabel?: string;
  grade?: number;
};

export type GradeSubmissionInput = {
  grade: number;
};
