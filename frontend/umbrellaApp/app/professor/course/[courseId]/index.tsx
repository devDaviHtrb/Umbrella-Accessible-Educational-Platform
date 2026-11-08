import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CourseHero } from '@/components/courses/course-hero';
import { ActionRow } from '@/components/professor/action-row';
import { LoadError } from '@/components/professor/load-error';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useFocusData } from '@/hooks/use-focus-data';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <UmbrellaText variant="title" color={Colors.light.primary}>
        {value}
      </UmbrellaText>
      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {label}
      </UmbrellaText>
    </View>
  );
}

export default function ProfessorCourseOverviewScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getCourse } = useProfessorCourses();
  const { data: course, loading, error, retry } = useFocusData(() => getCourse(courseId));

  if (loading) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando curso...
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  if (error && !course) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <LoadError message="Não foi possível carregar o curso." onRetry={retry} />
      </ScreenContainer>
    );
  }

  if (!course) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="title">Curso não encontrado</UmbrellaText>
      </ScreenContainer>
    );
  }

  const pending = course.pendingSubmissionsCount ?? 0;
  const materials = course.materialsCount ?? 0;

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <CourseHero title={course.title} badgeLabel={course.eyebrow} imageUrl={course.imageUrl} />

      <Card style={styles.summary}>
        <View style={styles.summaryHeader}>
          <StatusBadge
            label={course.statusLabel}
            tone={course.status === 'publicado' ? 'teal' : 'neutral'}
          />
        </View>

        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          {course.description || 'Este curso ainda não tem descrição.'}
        </UmbrellaText>

        <View style={styles.stats}>
          <StatBlock value={course.modulesCount} label="Módulos" />
          <StatBlock value={course.activitiesCount ?? 0} label="Atividades" />
          <StatBlock value={pending} label="A corrigir" />
        </View>
      </Card>

      <View style={styles.actions}>
        <ActionRow
          icon="square.and.pencil"
          title="Dados do Curso"
          subtitle="Consulte título, categoria e descrição"
          onPress={() => router.push(professorRoutes.editCourse(course.id))}
        />
        <ActionRow
          icon="list.bullet"
          title="Módulos"
          subtitle="Crie, edite e organize o conteúdo"
          onPress={() => router.push(professorRoutes.modules(course.id))}
        />
        <ActionRow
          icon="book.fill"
          title="Materiais"
          subtitle="Documentos, slides, imagens, planilhas e vídeos de apoio"
          badgeLabel={
            materials > 0
              ? `${materials} ${materials === 1 ? 'item' : 'itens'}`
              : undefined
          }
          onPress={() => router.push(professorRoutes.materials(course.id))}
        />
        <ActionRow
          icon="doc.fill"
          title="Atividades"
          subtitle="Quizzes, entregas e discussões"
          onPress={() => router.push(professorRoutes.activities(course.id))}
        />
        <ActionRow
          icon="person.2.fill"
          title="Alunos & Entregas"
          subtitle="Acompanhe a turma e corrija trabalhos"
          badgeLabel={pending > 0 ? `${pending} para corrigir` : undefined}
          onPress={() => router.push(professorRoutes.students(course.id))}
        />
        <ActionRow
          icon="video.fill"
          title="Aula ao Vivo"
          subtitle="Transmita para a turma e converse no chat"
          onPress={() => router.push(professorRoutes.live(course.id))}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
  summary: {
    gap: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  actions: {
    gap: Spacing.md,
  },
});
