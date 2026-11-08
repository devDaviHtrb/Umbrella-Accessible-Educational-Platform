import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { ProfessorCourseCard } from '@/components/professor/professor-course-card';
import { ScreenContainer } from '@/components/layout/screen-container';
import { ProfessorBottomBar } from '@/components/professor/professor-bottom-bar';
import { SectionHeader } from '@/components/layout/section-header';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { loginHref, professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { confirmDestructive, notify } from '@/utils/confirm';
import type { ProfessorCourse } from '@/types/professor';

const SCREEN_HORIZONTAL_PADDING = Spacing.lg * 2;
const GRID_GAP = Spacing.md;
const TARGET_CARD_WIDTH = 240;
const MAX_COLUMNS = 5;

export default function ProfessorCoursesScreen() {
  const { getCourses, deleteCourse } = useProfessorCourses();
  const { logout } = useAuthContext();
  const { data: courses, loading, error, retry, reload } = useFocusData(getCourses);

  const { width } = useWindowDimensions();
  const available = Math.max(width - SCREEN_HORIZONTAL_PADDING, 0);
  // At least 2 columns (keeps cards compact on phones), more as the window grows.
  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.floor(available / TARGET_CARD_WIDTH)));
  const cardWidth = (available - GRID_GAP * (columns - 1)) / columns;

  async function handleSignOut() {
    await logout();
    router.replace(loginHref);
  }

  function handleDelete(course: ProfessorCourse) {
    const students = course.studentsCount ?? 0;
    confirmDestructive({
      title: 'Excluir curso',
      message:
        `"${course.title}" será excluído permanentemente, junto com seus módulos, atividades e materiais` +
        (students > 0 ? `, e os ${students} aluno(s) matriculados perderão o acesso` : '') +
        '. Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await deleteCourse(course.id);
          await reload();
        } catch {
          notify('Não foi possível excluir', 'Tente novamente em instantes.');
        }
      },
    });
  }

  return (
    <ScreenContainer
      disableTopInset
      contentContainerStyle={styles.content}
      footer={<ProfessorBottomBar active="home" />}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da Área do Professor"
              onPress={handleSignOut}
              hitSlop={8}>
              <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
                Sair
              </UmbrellaText>
            </Pressable>
          ),
        }}
      />

      <View>
        <UmbrellaText variant="display">Gerencie seus cursos</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Crie cursos, organize módulos e acompanhe as entregas da sua turma.
        </UmbrellaText>
      </View>

      <PrimaryButton
        label="Criar Curso"
        icon="plus"
        iconPosition="leading"
        onPress={() => router.push(professorRoutes.newCourse)}
      />

      <View style={styles.section}>
        <SectionHeader title="Meus Cursos" />

        {loading ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Carregando cursos...
          </UmbrellaText>
        ) : error && !courses ? (
          <LoadError message="Não foi possível carregar os cursos." onRetry={retry} />
        ) : courses && courses.length > 0 ? (
          <View style={styles.grid}>
            {courses.map((course) => (
              <View key={course.id} style={{ width: cardWidth }}>
                <ProfessorCourseCard
                  course={course}
                  onPress={() => router.push(professorRoutes.course(course.id))}
                  onDeletePress={() => handleDelete(course)}
                />
              </View>
            ))}
          </View>
        ) : (
          <Card tone="muted">
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Você ainda não tem cursos. Toque em "Criar Curso" para começar.
            </UmbrellaText>
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.sm,
  },
  section: {
    gap: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});