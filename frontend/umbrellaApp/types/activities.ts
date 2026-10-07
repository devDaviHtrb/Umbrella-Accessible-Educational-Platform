export interface AlternativeDto {
  id: number;
  correct: boolean;
  letter: string;
  text: string;
  questionId: number;
}

export interface EssayDto {
  id: number;
  expectedAnswer?: string | null;
  minLines?: number | null;
  maxLines?: number | null;
  questionId: number;
}

export interface QuestionDto {
  id: number;
  points: number;
  status: string;
  number: number;
  statement: string;
  activityId: number;
  essay?: EssayDto | null;
  alternatives?: AlternativeDto[];
}

export interface ActivityDto {
  id: number;
  title: string;
  test: boolean;
  maxScore: number;
  status: string;
  moduleId: number;
  questions: QuestionDto[];
}

export interface StudentAnswerCorrectionDto {
  questionId: number;
  chosenAlternativeId?: number | null;
  essayAnswer?: string | null;
}

export interface SubmitActivityRequestDto {
  activityId: number;
  answers: StudentAnswerCorrectionDto[];
}

export interface StudentAnswerResponseDto {
  id: number;
  submissionId: number;
  questionId: number;
  chosenAlternativeId?: number | null;
  essayAnswer?: string | null;
  isCorrect?: boolean | null;
}

export interface ActivitySubmissionResponseDto {
  id: number;
  score: number;
  status: string;
  submittedAt: string;
  userId: number;
  activityId: number;
  answers: StudentAnswerResponseDto[];
}
