import { useState, useEffect, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import type {
  ActivityDto,
  ActivitySubmissionResponseDto,
  StudentAnswerCorrectionDto,
} from '@/types/activities';

export function useModuleActivities(moduleId: string | number) {
  const { get } = useUmbrellaApi();
  const [activities, setActivities] = useState<ActivityDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!moduleId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await get<ActivityDto[]>(`public/courses/modules/${moduleId}/activities`);
      setActivities(Array.isArray(response) ? response : []);
      setError(null);
    } catch (err) {
      console.log(`[useModuleActivities] Error fetching activities for module ${moduleId}`, err);
      setError('Erro ao carregar atividades do módulo.');
    } finally {
      setLoading(false);
    }
  }, [moduleId, get]);

  useEffect(() => {
    loadActivities();
  }, [moduleId]);

  return { activities, loading, error, refetch: loadActivities };
}

export function useActivityDetail(
  courseId: string | number,
  moduleId: string | number,
  activityId: string | number
) {
  const { get, post } = useUmbrellaApi();
  const { userId: authUserId } = useAuthContext();
  const [activity, setActivity] = useState<ActivityDto | null>(null);
  const [submissions, setSubmissions] = useState<ActivitySubmissionResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const actData = await get<ActivityDto>(`public/courses/activities/${activityId}`);
      setActivity(actData);

      const targetUserId = authUserId;
      if (targetUserId) {
        const validModuleId = moduleId || actData?.moduleId || '1';
        const validCourseId = courseId || '1';

        const subsData = await get<ActivitySubmissionResponseDto[]>(
          `public/courses/${validCourseId}/modules/${validModuleId}/activities/${activityId}/submissions/users/${targetUserId}`
        );
        setSubmissions(Array.isArray(subsData) ? subsData : []);
      }
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados da atividade:', err);
      setError('Erro ao carregar atividade.');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId, activityId, authUserId, get]);

  useEffect(() => {
    loadDetails();
  }, [courseId, moduleId, activityId, authUserId]);

  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const hasSubmitted = !!latestSubmission;

  const submit = async (answers: StudentAnswerCorrectionDto[]) => {
    const validCourseId = courseId || '1';
    const validModuleId = moduleId || activity?.moduleId || '1';
    const validActivityId = activityId || activity?.id;

    if (!validActivityId) {
      throw new Error('ID da atividade não encontrado');
    }

    const relativeUrl = `public/courses/${validCourseId}/modules/${validModuleId}/activities/${validActivityId}/submit`;
    const payload = {
      activityId: Number(validActivityId),
      answers,
    };

    const response = await post<ActivitySubmissionResponseDto>(relativeUrl, payload);
    if (response) {
      setSubmissions((prev) => [...prev, response]);
    }
    return response;
  };

  return {
    activity,
    submissions,
    latestSubmission,
    hasSubmitted,
    loading,
    error,
    submit,
    refetch: loadDetails,
  };
}

export function useActivity() {
  const { get, post } = useUmbrellaApi();
  const { userId: authUserId } = useAuthContext();

  const getActivitiesByModuleId = useCallback(
    async (moduleId: string | number): Promise<ActivityDto[]> => {
      if (!moduleId) return [];
      try {
        const response = await get<ActivityDto[]>(`public/courses/modules/${moduleId}/activities`);
        return Array.isArray(response) ? response : [];
      } catch (err) {
        console.log(`[useActivity] Error fetching activities for module ${moduleId}`, err);
        return [];
      }
    },
    [get]
  );

  const getActivityById = useCallback(
    async (activityId: string | number): Promise<ActivityDto | null> => {
      if (!activityId) return null;
      try {
        const response = await get<ActivityDto>(`public/courses/activities/${activityId}`);
        return response;
      } catch (err) {
        console.log(`[useActivity] Error fetching activity ${activityId}`, err);
        return null;
      }
    },
    [get]
  );

  const getSubmissionsByUserId = useCallback(
    async (
      courseId: string | number,
      moduleId: string | number,
      activityId: string | number,
      userId?: string | number
    ): Promise<ActivitySubmissionResponseDto[]> => {
      const targetUserId = userId || authUserId;
      if (!targetUserId || !activityId) return [];

      const validCourseId = courseId || '1';
      const validModuleId = moduleId || '1';

      try {
        const response = await get<ActivitySubmissionResponseDto[]>(
          `public/courses/${validCourseId}/modules/${validModuleId}/activities/${activityId}/submissions/users/${targetUserId}`
        );
        return Array.isArray(response) ? response : [];
      } catch (err) {
        console.log(
          `[useActivity] Error fetching submissions for activity ${activityId} and user ${targetUserId}`,
          err
        );
        return [];
      }
    },
    [get, authUserId]
  );

  const submitActivity = useCallback(
    async (
      courseId: string | number,
      moduleId: string | number,
      activityId: string | number,
      answers: StudentAnswerCorrectionDto[]
    ): Promise<ActivitySubmissionResponseDto | null> => {
      const validCourseId = courseId || '1';
      const validModuleId = moduleId || '1';
      const validActivityId = activityId;

      const relativeUrl = `public/courses/${validCourseId}/modules/${validModuleId}/activities/${validActivityId}/submit`;
      const payload = {
        activityId: Number(validActivityId),
        answers,
      };

      try {
        const response = await post<ActivitySubmissionResponseDto>(relativeUrl, payload);
        return response;
      } catch (err: any) {
        console.log(`[useActivity] Error submitting activity ${validActivityId}`, err.response?.data || err.message);
        throw err;
      }
    },
    [post]
  );

  const getLatestScore = useCallback(async (courseId: string | number, moduleId: string | number, activityId: string | number): Promise<number | null> => {
    const submissions = await getSubmissionsByUserId(courseId, moduleId, activityId);
    if (submissions.length === 0) return null;
    const latest = submissions[submissions.length - 1];
    return latest.score ?? null;
  }, [getSubmissionsByUserId]);
  return {
    getActivitiesByModuleId,
    getActivityById,
    getSubmissionsByUserId,
    submitActivity,
    useModuleActivities,
    useActivityDetail,
    getLatestScore,
  };
}
