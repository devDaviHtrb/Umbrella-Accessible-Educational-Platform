import { useState, useEffect, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import type {
  ActivityDto,
  ActivitySubmissionResponseDto,
  StudentAnswerCorrectionDto,
} from '@/types/activities';

const activitiesUrl = (moduleId: string | number) => `public/courses/modules/${moduleId}/activities`;

const activityPath = (courseId: string | number, moduleId: string | number, activityId: string | number) =>
  `public/courses/${courseId}/modules/${moduleId}/activities/${activityId}`;

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
      const response = await get<ActivityDto[]>(activitiesUrl(moduleId));
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
  }, [loadActivities]);

  return { activities, loading, error, refetch: loadActivities };
}

export function useActivityDetail(
  courseId: string | number,
  moduleId: string | number,
  activityId: string | number
) {
  const { get, post } = useUmbrellaApi();
  const { userId } = useAuthContext();
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
      const activityData = await get<ActivityDto>(`public/courses/activities/${activityId}`);
      setActivity(activityData);

      if (userId && courseId) {
        const path = activityPath(courseId, moduleId || activityData.moduleId, activityId);
        const submissionsData = await get<ActivitySubmissionResponseDto[]>(`${path}/submissions/users/${userId}`);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      }
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados da atividade:', err);
      setError('Erro ao carregar atividade.');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId, activityId, userId, get]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const hasSubmitted = !!latestSubmission;

  const submit = async (answers: StudentAnswerCorrectionDto[]) => {
    if (!activityId) {
      throw new Error('ID da atividade não encontrado');
    }

    const path = activityPath(courseId, moduleId || activity?.moduleId || '', activityId);
    const response = await post<ActivitySubmissionResponseDto>(`${path}/submit`, {
      activityId: Number(activityId),
      answers,
    });
    if (response) {
      setSubmissions((prev) => [...prev, response]);
    }
    return response;
  };

  return {
    activity,
    latestSubmission,
    hasSubmitted,
    loading,
    error,
    submit,
  };
}

export function useActivity() {
  const { get } = useUmbrellaApi();
  const { userId } = useAuthContext();

  const getActivitiesByModuleId = useCallback(
    async (moduleId: string | number): Promise<ActivityDto[]> => {
      try {
        const response = await get<ActivityDto[]>(activitiesUrl(moduleId));
        return Array.isArray(response) ? response : [];
      } catch (err) {
        console.log(`[useActivity] Error fetching activities for module ${moduleId}`, err);
        return [];
      }
    },
    [get]
  );

  const getSubmissionsByUserId = useCallback(
    async (
      courseId: string | number,
      moduleId: string | number,
      activityId: string | number
    ): Promise<ActivitySubmissionResponseDto[]> => {
      if (!userId) return [];

      try {
        const response = await get<ActivitySubmissionResponseDto[]>(
          `${activityPath(courseId, moduleId, activityId)}/submissions/users/${userId}`
        );
        return Array.isArray(response) ? response : [];
      } catch (err) {
        console.log(`[useActivity] Error fetching submissions for activity ${activityId}`, err);
        return [];
      }
    },
    [get, userId]
  );

  const getLatestScore = useCallback(
    async (
      courseId: string | number,
      moduleId: string | number,
      activityId: string | number
    ): Promise<number | null> => {
      const submissions = await getSubmissionsByUserId(courseId, moduleId, activityId);
      return submissions.length > 0 ? submissions[submissions.length - 1].score ?? null : null;
    },
    [getSubmissionsByUserId]
  );

  return { getActivitiesByModuleId, getSubmissionsByUserId, getLatestScore };
}
