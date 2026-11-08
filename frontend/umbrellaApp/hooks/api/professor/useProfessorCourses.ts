import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthContext } from '@/hooks/api/auth/authContext';
import umbrellaApi from '@/services/umbrellaApi';
import {
  DEFAULT_ACTIVITY_MAX_SCORE,
  DEFAULT_COURSE_DIFFICULTY,
  DEFAULT_MODULE_REQUIRED,
  SUBMISSION_STATUS,
} from '@/constants/professor-options';
import type { ActivityDto, ActivitySubmissionResponseDto } from '@/types/activities';
import type { ModuleMaterial } from '@/types/materials';
import type {
  GradeSubmissionInput,
  MaterialKind,
  ProfessorActivity,
  ProfessorActivityDetail,
  ProfessorActivityInput,
  ProfessorCategory,
  ProfessorCourse,
  ProfessorCourseInput,
  ProfessorMaterial,
  ProfessorMaterialInput,
  ProfessorModule,
  ProfessorModuleInput,
  ProfessorQuestion,
  ProfessorQuestionInput,
  ProfessorStudent,
  StudentSubmission,
} from '@/types/professor';
import type {
  ActivityCreateRequest,
  ActivityMaxScoreRequest,
  ActivityUpdateRequest,
  AlternativeCreateRequest,
  AlternativeUpdateRequest,
  AnswerScoreRequest,
  CourseApiDto,
  CourseCreateRequest,
  CourseDetailApiDto,
  EnrolledStudentApiDto,
  EssayCreateRequest,
  EssayUpdateRequest,
  ModuleApiDto,
  ModuleCreateRequest,
  ModuleUpdateRequest,
  QuestionCreateRequest,
  QuestionUpdateRequest,
  SubjectApiDto,
  SubmissionGradeRequest,
} from '@/types/professor-api';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import {
  alternativeLetter,
  asArray,
  mapActivity,
  mapActivityDetail,
  mapCourse,
  mapCourseDetail,
  mapMaterial,
  mapModule,
  mapSubmission,
} from './mappers';

type ModuleBundle = { module: ProfessorModule; activities: ActivityDto[] };

type ActivityRef = Pick<ProfessorActivityDetail, 'id' | 'courseId' | 'moduleId'>;

export class QuestionSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionSaveError';
    Object.setPrototypeOf(this, QuestionSaveError.prototype);
  }
}

export const QUESTION_ROLLED_BACK_MESSAGE =
  'Não foi possível salvar as alternativas. A questão não foi criada; seus dados continuam aqui para tentar de novo.';
export const QUESTION_INCOMPLETE_MESSAGE =
  'A questão foi criada, mas não foi possível concluí-la nem desfazê-la. Ela aparece na lista como incompleta: edite ou exclua.';

const questionsUrl = (activity: ActivityRef) =>
  `public/courses/${activity.courseId}/modules/${activity.moduleId}/activities/${activity.id}/questions`;

const RESOURCE_TYPE_BY_KIND: Record<MaterialKind, 'image' | 'video' | 'raw'> = {
  documents: 'raw',
  slides: 'raw',
  spreadsheets: 'raw',
  images: 'image',
  videos: 'video',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
};

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isNotFound(error: any): boolean {
  return error?.response?.status === 404;
}

export function useProfessorCourses() {
  const { get, post, put, del } = useUmbrellaApi();
  const { userId } = useAuthContext();

  const fetchOwnedCourse = useCallback(
    async (courseId: string): Promise<CourseDetailApiDto | undefined> => {
      try {
        const detail = await get<CourseDetailApiDto>(`public/courses/${courseId}`);
        return userId && String(detail?.userDto?.id) === userId ? detail : undefined;
      } catch (err) {
        if (isNotFound(err)) return undefined;
        throw err;
      }
    },
    [get, userId],
  );

  const fetchModuleDtos = useCallback(
    async (courseId: string): Promise<ModuleApiDto[]> =>
      asArray<ModuleApiDto>(await get(`public/courses/${courseId}/modules`)),
    [get],
  );

  const fetchModuleBundles = useCallback(
    async (courseId: string): Promise<ModuleBundle[]> => {
      const moduleDtos = await fetchModuleDtos(courseId);
      return Promise.all(
        moduleDtos.map(async (dto, index) => {
          const activities = asArray<ActivityDto>(
            await get(`public/courses/modules/${dto.id}/activities`).catch(() => []),
          );
          return { module: mapModule(courseId, dto, index, activities.length), activities };
        }),
      );
    },
    [get, fetchModuleDtos],
  );

  const fetchSubmissions = useCallback(
    async (courseId: string, moduleId: string, activityId: number | string) =>
      asArray<ActivitySubmissionResponseDto>(
        await get(
          `public/courses/${courseId}/modules/${moduleId}/activities/${activityId}/submissions`,
        ).catch(() => []),
      ),
    [get],
  );

  const getCategories = useCallback(async (): Promise<ProfessorCategory[]> => {
    const subjects = asArray<SubjectApiDto>(await get('public/courses/subjects'));
    return subjects.map((subject) => ({ id: String(subject.id), label: subject.name ?? '' }));
  }, [get]);

  const createCategory = useCallback(
    async (name: string): Promise<ProfessorCategory> => {
      const created = await post<{ id: number | string; subject?: string }>(
        'public/courses/subjects/register',
        name,
        { 'Content-Type': 'text/plain' },
      );
      return { id: String(created.id), label: created.subject ?? name };
    },
    [post],
  );

  const getCourses = useCallback(async (): Promise<ProfessorCourse[]> => {
    if (!userId) throw new Error('Usuário não identificado.');

    const all = asArray<CourseApiDto>(await get('public/courses/list'));
    const owned = await Promise.all(
      all.map(async (course): Promise<ProfessorCourse | null> => {
        try {
          const detail = await get<CourseDetailApiDto>(`public/courses/${course.id}`);
          if (String(detail?.userDto?.id) !== userId) return null;

          // studentsCount already comes from the list endpoint.
          return mapCourse(course);
        } catch {
          return null;
        }
      }),
    );

    return owned
      .filter((course): course is ProfessorCourse => course !== null)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [get, userId]);

  const deleteCourse = useCallback(
    async (courseId: string): Promise<void> => {
      await del(`public/courses/${courseId}`);
    },
    [del],
  );

  const getCourse = useCallback(
    async (courseId: string): Promise<ProfessorCourse | undefined> => {
      const detail = await fetchOwnedCourse(courseId);
      if (!detail) return undefined;

      const bundles = await fetchModuleBundles(courseId);

      const materialsCount = (
        await Promise.all(
          bundles.map(async ({ module }) =>
            asArray<ModuleMaterial>(await get(`public/storage/module/${module.id}`).catch(() => [])).length,
          ),
        )
      ).reduce((sum, count) => sum + count, 0);

      const submissions = await Promise.all(
        bundles.flatMap(({ module, activities }) =>
          activities.map((activity) => fetchSubmissions(courseId, module.id, activity.id)),
        ),
      );
      const pendingSubmissionsCount = submissions
        .flat()
        .filter((item) => item.status === SUBMISSION_STATUS.completed).length;

      return {
        ...mapCourseDetail(detail),
        activitiesCount: bundles.reduce((sum, bundle) => sum + bundle.activities.length, 0),
        materialsCount,
        pendingSubmissionsCount,
      };
    },
    [get, fetchOwnedCourse, fetchModuleBundles, fetchSubmissions],
  );

  const getCourseBasics = useCallback(
    async (courseId: string): Promise<ProfessorCourse | undefined> => {
      const detail = await fetchOwnedCourse(courseId);
      return detail ? mapCourseDetail(detail) : undefined;
    },
    [fetchOwnedCourse],
  );

  const uploadCourseImage = useCallback(
    async (input: ProfessorCourseInput): Promise<{ url: string; publicId?: string } | undefined> => {
      // An already-hosted image (e.g. kept during edit) is sent as-is.
      if (!input.imageLocalUri) {
        return input.imageUrl ? { url: input.imageUrl } : undefined;
      }

      const token = await AsyncStorage.getItem('@user_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const name = input.imageFileName ?? 'capa';
      const mimeType = input.imageMimeType || 'image/jpeg';

      const formData = new FormData();
      if (input.imageLocalUri.startsWith('blob:') || input.imageLocalUri.startsWith('data:')) {
        const blob = await (await fetch(input.imageLocalUri)).blob();
        formData.append('file', blob, name);
      } else {
        formData.append('file', { uri: input.imageLocalUri, name, type: mimeType } as any);
      }
      formData.append('resourceType', 'image');
      formData.append('fileName', input.title || name);
      formData.append('alternativeText', `Capa do curso ${input.title}`.trim());

      const response = await umbrellaApi.post<{ url: string; publicId?: string }>('storage/upload', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });
      return { url: response.data.url, publicId: response.data.publicId };
    },
    [],
  );

  const createCourse = useCallback(
    async (input: ProfessorCourseInput): Promise<string | undefined> => {
      const image = await uploadCourseImage(input);

      const body: CourseCreateRequest = {
        name: input.title,
        description: input.description,
        difficulty_level: input.difficultyLevel ?? DEFAULT_COURSE_DIFFICULTY,
        subjectId: Number(input.categoryId),
        imageUrl: image?.url,
        imagePublicId: image?.publicId,
      };
      const created = await post<{ id?: number | string } | null>('public/courses/register', body);
      return created?.id != null ? String(created.id) : undefined;
    },
    [post, uploadCourseImage],
  );

  const getModules = useCallback(
    async (courseId: string): Promise<ProfessorModule[]> =>
      (await fetchModuleBundles(courseId)).map((bundle) => bundle.module),
    [fetchModuleBundles],
  );

  const getModule = useCallback(
    async (courseId: string, moduleId: string): Promise<ProfessorModule | undefined> =>
      (await getModules(courseId)).find((module) => module.id === moduleId),
    [getModules],
  );

  const createModule = useCallback(
    async (courseId: string, input: ProfessorModuleInput): Promise<void> => {
      const body: ModuleCreateRequest = {
        name: input.title,
        description: input.description,
        isRequired: DEFAULT_MODULE_REQUIRED,
        creationDate: todayIsoDate(),
        courseId: Number(courseId),
      };
      await post(`public/courses/${courseId}/add_module`, body);
    },
    [post],
  );

  const updateModule = useCallback(
    async (courseId: string, moduleId: string, input: ProfessorModuleInput): Promise<void> => {
      const current = await get<ModuleApiDto>(`public/courses/modules/${moduleId}`);
      const body: ModuleUpdateRequest = {
        name: input.title,
        description: input.description,
        isRequired: current.required,
        timeLimit: current.time_limit ?? null,
      };
      await put(`public/courses/${courseId}/modules/${moduleId}`, body);
    },
    [get, put],
  );

  const deleteModule = useCallback(
    async (courseId: string, moduleId: string): Promise<void> => {
      await del(`public/courses/${courseId}/modules/${moduleId}`);
    },
    [del],
  );

  const getActivities = useCallback(
    async (courseId: string): Promise<ProfessorActivity[]> => {
      const bundles = await fetchModuleBundles(courseId);
      return Promise.all(
        bundles.flatMap(({ module, activities }) =>
          activities.map(async (activity) =>
            mapActivity(courseId, module, activity, await fetchSubmissions(courseId, module.id, activity.id)),
          ),
        ),
      );
    },
    [fetchModuleBundles, fetchSubmissions],
  );

  const createActivity = useCallback(
    async (courseId: string, input: ProfessorActivityInput): Promise<string> => {
      const body: ActivityCreateRequest = {
        title: input.title,
        test: input.type === 'quiz',
        maxScore: DEFAULT_ACTIVITY_MAX_SCORE,
        moduleId: Number(input.moduleId),
      };
      const created = await post<{ id: number }>(`public/courses/${courseId}/modules/${input.moduleId}/activities`, body);
      return String(created.id);
    },
    [post],
  );

  const getActivity = useCallback(
    async (courseId: string, activityId: string): Promise<ProfessorActivityDetail | undefined> => {
      if (!(await fetchOwnedCourse(courseId))) return undefined;

      let dto: ActivityDto;
      try {
        dto = await get<ActivityDto>(`public/courses/activities/${activityId}`);
      } catch (err) {
        if (isNotFound(err)) return undefined;
        throw err;
      }

      const moduleDtos = await fetchModuleDtos(courseId);
      const index = moduleDtos.findIndex((item) => item.id === dto.moduleId);
      if (index === -1) return undefined;

      return mapActivityDetail(courseId, mapModule(courseId, moduleDtos[index], index, 0), dto);
    },
    [get, fetchOwnedCourse, fetchModuleDtos],
  );

  const updateActivity = useCallback(
    async (activity: ActivityRef, input: Pick<ProfessorActivityInput, 'title' | 'type'>): Promise<void> => {
      const body: ActivityUpdateRequest = { title: input.title, test: input.type === 'quiz' };
      await put(`public/courses/${activity.courseId}/modules/${activity.moduleId}/activities/${activity.id}`, body);
    },
    [put],
  );

  const syncActivityMaxScore = useCallback(
    async (activity: ActivityRef): Promise<void> => {
      try {
        const dto = await get<ActivityDto>(`public/courses/activities/${activity.id}`);
        const total = Math.round((dto.questions ?? []).reduce((sum, item) => sum + (item.points ?? 0), 0) * 100) / 100;
        if (total > 0 && Math.abs(total - (dto.maxScore ?? 0)) > 0.001) {
          const body: ActivityMaxScoreRequest = { maxScore: total };
          await put(`public/courses/${activity.courseId}/modules/${activity.moduleId}/activities/${activity.id}`, body);
        }
      } catch {
      }
    },
    [get, put],
  );

  const createQuestion = useCallback(
    async (activity: ActivityRef, input: ProfessorQuestionInput, number: number): Promise<void> => {
      const base = questionsUrl(activity);
      const body: QuestionCreateRequest = {
        points: input.points,
        number,
        statement: input.statement,
        activityId: Number(activity.id),
      };
      const created = await post<{ id: number }>(base, body);

      try {
        if (input.kind === 'multipla_escolha') {
          for (const [index, draft] of input.alternatives.entries()) {
            const alternative: AlternativeCreateRequest = {
              correct: draft.correct,
              letter: alternativeLetter(index),
              text: draft.text,
              questionId: created.id,
            };
            await post(`${base}/${created.id}/alternatives`, alternative);
          }
        } else {
          const essay: EssayCreateRequest = {
            expectedAnswer: input.expectedAnswer,
            minLetters: input.minLetters,
            maxLetters: input.maxLetters,
            questionId: created.id,
          };
          await post(`${base}/${created.id}/essays`, essay);
        }
      } catch {
        try {
          await del(`${base}/${created.id}`);
        } catch {
          throw new QuestionSaveError(QUESTION_INCOMPLETE_MESSAGE);
        }
        throw new QuestionSaveError(QUESTION_ROLLED_BACK_MESSAGE);
      }

      await syncActivityMaxScore(activity);
    },
    [post, del, syncActivityMaxScore],
  );

  const updateQuestion = useCallback(
    async (activity: ActivityRef, question: ProfessorQuestion, input: ProfessorQuestionInput): Promise<void> => {
      if (question.kind && question.kind !== input.kind) {
        throw new Error('O tipo de uma questão salva não pode ser alterado.');
      }

      const base = questionsUrl(activity);
      const questionBody: QuestionUpdateRequest = { points: input.points, statement: input.statement };
      await put(`${base}/${question.id}`, questionBody);

      if (input.kind === 'multipla_escolha') {
        const keptIds = new Set(input.alternatives.flatMap((draft) => (draft.id ? [draft.id] : [])));

        for (const saved of question.alternatives) {
          if (keptIds.has(saved.id)) continue;
          try {
            await del(`${base}/${question.id}/alternatives/${saved.id}`);
          } catch (err) {
            if (!isNotFound(err)) throw err;
          }
        }

        for (const [index, draft] of input.alternatives.entries()) {
          const letter = alternativeLetter(index);
          const saved = draft.id ? question.alternatives.find((item) => item.id === draft.id) : undefined;

          if (!saved) {
            const alternative: AlternativeCreateRequest = {
              correct: draft.correct,
              letter,
              text: draft.text,
              questionId: Number(question.id),
            };
            await post(`${base}/${question.id}/alternatives`, alternative);
          } else if (saved.text !== draft.text || saved.correct !== draft.correct || saved.letter !== letter) {
            const alternative: AlternativeUpdateRequest = { correct: draft.correct, letter, text: draft.text };
            await put(`${base}/${question.id}/alternatives/${saved.id}`, alternative);
          }
        }
      } else if (question.essay) {
        const essay: EssayUpdateRequest = {
          expectedAnswer: input.expectedAnswer,
          minLetters: input.minLetters,
          maxLetters: input.maxLetters,
        };
        await put(`${base}/${question.id}/essays/${question.essay.id}`, essay);
      } else {
        const essay: EssayCreateRequest = {
          expectedAnswer: input.expectedAnswer,
          minLetters: input.minLetters,
          maxLetters: input.maxLetters,
          questionId: Number(question.id),
        };
        await post(`${base}/${question.id}/essays`, essay);
      }

      await syncActivityMaxScore(activity);
    },
    [put, post, del, syncActivityMaxScore],
  );

  const deleteQuestion = useCallback(
    async (activity: ActivityRef, questionId: string): Promise<void> => {
      await del(`${questionsUrl(activity)}/${questionId}`);
      await syncActivityMaxScore(activity);
    },
    [del, syncActivityMaxScore],
  );

  const deleteActivity = useCallback(
    async (courseId: string, moduleId: string, activityId: string): Promise<void> => {
      await del(`public/courses/${courseId}/modules/${moduleId}/activities/${activityId}`);
    },
    [del],
  );

  const getSubmissions = useCallback(
    async (courseId: string): Promise<StudentSubmission[]> => {
      const bundles = await fetchModuleBundles(courseId);
      const rows = await Promise.all(
        bundles.flatMap(({ module, activities }) =>
          activities.map(async (activity) => {
            const items = await fetchSubmissions(courseId, module.id, activity.id);
            return items.map((item) => ({ item, module, activity }));
          }),
        ),
      );

      return rows
        .flat()
        .sort((a, b) => String(b.item.submittedAt).localeCompare(String(a.item.submittedAt)))
        .map(({ item, module, activity }) => mapSubmission(courseId, module, activity, item));
    },
    [fetchModuleBundles, fetchSubmissions],
  );

  const getStudents = useCallback(
    async (courseId: string): Promise<ProfessorStudent[]> => {
      const students = asArray<EnrolledStudentApiDto>(
        await get(`public/courses/${courseId}/students`).catch(() => []),
      );
      return students
        .map((student) => ({
          id: String(student.id),
          name: student.name?.trim() || `Aluno #${student.id}`,
          email: student.email ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
    [get],
  );

  const gradeSubmission = useCallback(
    async (courseId: string, submission: StudentSubmission, input: GradeSubmissionInput): Promise<void> => {
      // Persist the per-question grades first; the backend recomputes the
      // submission total from these answers.
      for (const questionGrade of input.questionGrades) {
        const answerBody: AnswerScoreRequest = { score: questionGrade.score };
        await put(`public/courses/student-answers/${questionGrade.answerId}`, answerBody);
      }

      // Mark the submission as graded (and send the total as a safeguard).
      const body: SubmissionGradeRequest = {
        score: input.grade,
        status: SUBMISSION_STATUS.graded,
      };
      await put(
        `public/courses/${courseId}/modules/${submission.moduleId}/activities/${submission.activityId}/submissions/${submission.id}`,
        body,
      );
    },
    [put],
  );

  const getMaterials = useCallback(
    async (courseId: string): Promise<ProfessorMaterial[]> => {
      const moduleDtos = await fetchModuleDtos(courseId);
      const groups = await Promise.all(
        moduleDtos.map(async (dto, index) => {
          const module = mapModule(courseId, dto, index, 0);
          const files = asArray<ModuleMaterial>(await get(`public/storage/module/${dto.id}`).catch(() => []));
          return files.map((file) => mapMaterial(courseId, module, file));
        }),
      );
      return groups.flat();
    },
    [get, fetchModuleDtos],
  );

  const deleteMaterial = useCallback(
    async (materialId: string): Promise<void> => {
      await del(`public/storage/material/${materialId}`);
    },
    [del],
  );

  const createMaterial = useCallback(async (input: ProfessorMaterialInput): Promise<void> => {
    const token = await AsyncStorage.getItem('@user_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const resourceType = RESOURCE_TYPE_BY_KIND[input.kind];
    const partName = input.fileName ?? input.title;
    const extension = partName.includes('.') ? (partName.split('.').pop() ?? '').toLowerCase() : '';
    const mimeType = input.mimeType || MIME_BY_EXTENSION[extension] || 'application/octet-stream';

    const formData = new FormData();
    if (input.url.startsWith('blob:') || input.url.startsWith('data:')) {
      const blob = await (await fetch(input.url)).blob();
      formData.append('file', blob, partName);
    } else {
      formData.append('file', { uri: input.url, name: partName, type: mimeType } as any);
    }

    formData.append('resourceType', resourceType);
    formData.append('fileName', input.title);
    formData.append('moduleId', input.moduleId);
    if (input.description) formData.append('fileDescription', input.description);
    if (resourceType === 'image') formData.append('alternativeText', input.title);

    try {
      await umbrellaApi.post('storage/upload', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      });
    } catch (error: any) {
      console.log('[useProfessorCourses upload]', error.response?.data || error.message);
      throw error;
    }
  }, []);

  return {
    getCategories,
    createCategory,
    getCourses,
    getCourse,
    getCourseBasics,
    createCourse,
    deleteCourse,
    getModules,
    getModule,
    createModule,
    updateModule,
    deleteModule,
    getActivities,
    createActivity,
    getActivity,
    updateActivity,
    deleteActivity,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getSubmissions,
    getStudents,
    gradeSubmission,
    getMaterials,
    createMaterial,
    deleteMaterial,
  };
}
