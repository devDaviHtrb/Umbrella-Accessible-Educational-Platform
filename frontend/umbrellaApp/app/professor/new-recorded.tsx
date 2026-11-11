import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { LoadError } from '@/components/professor/load-error';
import { RecordedLessonForm } from '@/components/professor/recorded-lesson-form';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSubmit } from '@/hooks/use-submit';
import type { ProfessorMaterialInput, ProfessorModule } from '@/types/professor';
import { notify } from '@/utils/confirm';

export default function NewRecordedLessonScreen() {
  const { courseId: initialCourseId } = useLocalSearchParams<{ courseId?: string }>();
  const { getCourses, getModules, createMaterial } = useProfessorCourses();
  const { data: courses, loading, error: loadError, retry } = useFocusData(getCourses);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<ProfessorModule[] | null>(null);
  const [modulesFailed, setModulesFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (courseId || !courses || courses.length === 0) return;
    const preferred = initialCourseId && courses.some((course) => course.id === initialCourseId)
      ? initialCourseId
      : courses[0].id;
    setCourseId(preferred);
  }, [courses, courseId, initialCourseId]);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    setModules(null);
    setModulesFailed(false);
    getModules(courseId)
      .then((result) => active && setModules(result))
      .catch(() => active && setModulesFailed(true));
    return () => {
      active = false;
    };
  }, [courseId, getModules]);

  const { submit, submitting, error } = useSubmit(
    async (input: ProfessorMaterialInput) => {
      setProgress(0);
      await createMaterial(input, setProgress);
      notify('Aula enviada', 'O vídeo foi cadastrado e já aparece na lista de aulas gravadas.');
      router.back();
    },
    { errorMessage: 'Não foi possível enviar o vídeo. Confira a lista de aulas gravadas antes de tentar novamente.' },
  );

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {loading ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando cursos...
        </UmbrellaText>
      ) : loadError && !courses ? (
        <LoadError message="Não foi possível carregar os cursos." onRetry={retry} />
      ) : courses ? (
        <RecordedLessonForm
          courses={courses}
          courseId={courseId}
          onCourseChange={setCourseId}
          modules={modules}
          modulesFailed={modulesFailed}
          submitting={submitting}
          progress={progress}
          submitError={error}
          onSubmit={submit}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
});
