import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { ProfessorCourseCard } from '@/components/professor/professor-course-card';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaLogo, hasUmbrellaLogo } from '@/components/layout/umbrella-logo';
import { ProfessorBottomBar } from '@/components/professor/professor-bottom-bar';
import { SectionHeader } from '@/components/layout/section-header';
import { ActionRow } from '@/components/professor/action-row';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { loginHref, professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';

export default function ProfessorCoursesScreen() {
  const { getCourses } = useProfessorCourses();
  const { logout } = useAuthContext();
  const { data: courses, loading, error, retry } = useFocusData(getCourses);

  async function handleSignOut() {
    await logout();
    router.replace(loginHref);
  }

  return (
    <ScreenContainer
      disableTopInset
      contentContainerStyle={styles.content}
      footer={<ProfessorBottomBar active="home" />}>
      <Stack.Screen
        options={{
          headerLeft: hasUmbrellaLogo ? () => <UmbrellaLogo height={28} /> : undefined,
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

      <ActionRow
        icon="rectangle.stack.fill"
        title="Aulas Gravadas"
        subtitle="Videoaulas e conteúdos em Libras"
        onPress={() => router.push(professorRoutes.recorded)}
      />

      <View style={styles.section}>
        <SectionHeader title="Meus Cursos" />

        <View style={styles.list}>
          {loading ? (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Carregando cursos...
            </UmbrellaText>
          ) : error && !courses ? (
            <LoadError message="Não foi possível carregar os cursos." onRetry={retry} />
          ) : courses && courses.length > 0 ? (
            courses.map((course) => (
              <ProfessorCourseCard
                key={course.id}
                course={course}
                onPress={() => router.push(professorRoutes.course(course.id))}
              />
            ))
          ) : (
            <Card tone="muted">
              <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                Você ainda não tem cursos. Toque em "Criar Curso" para começar.
              </UmbrellaText>
            </Card>
          )}
        </View>
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
  list: {
    gap: Spacing.lg,
  },
});