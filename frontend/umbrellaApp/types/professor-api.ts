
export interface CourseApiDto {
  id: number;
  name: string;
  description?: string | null;
  difficultyLevel?: number | null;
  moduleAmount: number;
  subjectId?: number | null;
  subjectName?: string | null;
  imageUrl?: string | null;
}

export interface CourseDetailApiDto {
  id: number;
  name: string;
  description?: string | null;
  module_amount: number;
  difficulty_level: number;
  subject?: SubjectApiDto | null;
  userDto?: { id: number; name: string; email: string } | null;
  imageUrl?: string | null;
}

export interface SubjectApiDto {
  id: number;
  name: string;
}

export interface ModuleApiDto {
  id: number;
  name: string;
  required: boolean;
  creation_date?: string | null;
  time_limit?: string | number | null;
}

export interface CourseCreateRequest {
  name: string;
  description: string;
  difficulty_level: number;
  subjectId: number;
}

export interface ActivityUpdateRequest {
  title?: string;
  test?: boolean;
}

export interface ModuleCreateRequest {
  name: string;
  description: string;
  isRequired: boolean;
  creationDate: string;
  courseId: number;
}

export interface ModuleUpdateRequest {
  name: string;
  description: string;
  isRequired: boolean;
  timeLimit: string | number | null;
}

export interface ActivityCreateRequest {
  title: string;
  test: boolean;
  maxScore: number;
  moduleId: number;
}

export interface SubmissionGradeRequest {
  score: number;
  status: string;
}

export interface QuestionCreateRequest {
  points: number;
  number: number;
  statement: string;
  activityId: number;
}

export interface QuestionUpdateRequest {
  points?: number;
  number?: number;
  statement?: string;
}

export interface AlternativeCreateRequest {
  correct: boolean;
  letter: string;
  text: string;
  questionId: number;
}

export interface AlternativeUpdateRequest {
  correct?: boolean;
  letter?: string;
  text?: string;
}

export interface EssayCreateRequest {
  expectedAnswer: string;
  minLetters?: number;
  maxLetters?: number;
  questionId: number;
}

export interface EssayUpdateRequest {
  expectedAnswer?: string;
  minLetters?: number;
  maxLetters?: number;
}

export interface ActivityMaxScoreRequest {
  maxScore: number;
}
