import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useCourses } from '@/hooks/api/courses/useCourse';
import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import type { ModuleMaterial } from '@/types/materials';
import type { RecordedLesson } from '@/types/recorded-classes';
import { formatFileSize } from '@/utils/files';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function useRecordedLessons() {
  const { get } = useUmbrellaApi();
  const { refetchEnrolledCourses } = useCourses();
  const [lessons, setLessons] = useState<RecordedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const courses = await refetchEnrolledCourses();

      const byCourse = await Promise.all(
        courses.map(async (course) => {
          const modules = asArray<{ id: number; title?: string; name?: string }>(
            await get(`public/courses/${course.id}/modules`),
          );

          const byModule = await Promise.all(
            modules.map(async (module): Promise<RecordedLesson[]> => {
              const files = asArray<ModuleMaterial>(await get(`public/storage/module/${module.id}`).catch(() => []));
              return files
                .filter((file) => file.resourceType === 'video')
                .map((file) => ({
                  id: String(file.id),
                  categoryId: course.id,
                  category: course.title,
                  title: file.title,
                  description: file.description || 'Vídeo do módulo.',
                  moduleTitle: module.title ?? module.name ?? '',
                  sizeLabel: formatFileSize(file.size),
                  url: file.url,
                }));
            }),
          );
          return byModule.flat();
        }),
      );

      setLessons(byCourse.flat());
      setError(null);
    } catch {
      setError('Não foi possível carregar as aulas gravadas.');
    } finally {
      setLoading(false);
    }
  }, [get, refetchEnrolledCourses]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { lessons, loading, error, reload: load };
}
