import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { LoadError } from '@/components/professor/load-error';
import { MaterialRow } from '@/components/professor/material-row';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { ProfessorRecordedLesson } from '@/types/professor';
import { openMaterial } from '@/utils/open-material';

export default function ProfessorRecordedScreen() {
  const { getRecordedLessons } = useProfessorCourses();
  const { data: lessons, loading, error, retry } = useFocusData(getRecordedLessons);

  const lessonsByCourse = useMemo(() => {
    const groups = new Map<string, ProfessorRecordedLesson[]>();
    (lessons ?? []).forEach((lesson) => groups.set(lesson.courseTitle, [...(groups.get(lesson.courseTitle) ?? []), lesson]));
    return Array.from(groups);
  }, [lessons]);

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        Cadastre videoaulas, como conteúdos em Libras, em cada módulo dos seus cursos. Os alunos matriculados
        encontram os vídeos em Aulas Gravadas.
      </UmbrellaText>

      <PrimaryButton
        label="Adicionar Aula Gravada"
        icon="plus"
        iconPosition="leading"
        onPress={() => router.push(professorRoutes.newRecorded)}
      />

      {loading ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando aulas gravadas...
        </UmbrellaText>
      ) : error && !lessons ? (
        <LoadError message="Não foi possível carregar as aulas gravadas." onRetry={retry} />
      ) : lessonsByCourse.length > 0 ? (
        lessonsByCourse.map(([courseTitle, courseLessons]) => (
          <View key={courseTitle} style={styles.section}>
            <SectionHeader title={courseTitle} />
            {courseLessons.map((lesson) => (
              <MaterialRow
                key={lesson.id}
                material={lesson}
                onOpenPress={() => openMaterial({ title: lesson.title, url: lesson.url, description: lesson.description })}
              />
            ))}
          </View>
        ))
      ) : (
        <Card tone="muted">
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhuma aula gravada cadastrada ainda. Toque em &ldquo;Adicionar Aula Gravada&rdquo; para enviar o primeiro
            vídeo.
          </UmbrellaText>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
});
