import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { ActivityRow } from '@/components/professor/activity-row';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { ProfessorActivity } from '@/types/professor';
import { confirmDestructive, notify } from '@/utils/confirm';

export default function ProfessorActivitiesScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getActivities, deleteActivity } = useProfessorCourses();
  const { data: activities, loading, error, reload, retry } = useFocusData(() => getActivities(courseId));

  function handleDelete(activity: ProfessorActivity) {
    confirmDestructive({
      title: 'Excluir atividade',
      message: `"${activity.title}" será excluída. Essa ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await deleteActivity(courseId, activity.moduleId, activity.id);
          await reload();
        } catch {
          notify('Não foi possível excluir', 'Tente novamente em instantes.');
        }
      },
    });
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        Acompanhe o andamento das entregas de cada atividade do curso.
      </UmbrellaText>

      <PrimaryButton
        label="Criar Atividade"
        icon="plus"
        iconPosition="leading"
        onPress={() => router.push(professorRoutes.newActivity(courseId))}
      />

      <View style={styles.list}>
        {loading ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Carregando atividades...
          </UmbrellaText>
        ) : error && !activities ? (
          <LoadError message="Não foi possível carregar as atividades." onRetry={retry} />
        ) : activities && activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onEditPress={() => router.push(professorRoutes.editActivity(courseId, activity.id))}
              onDeletePress={() => handleDelete(activity)}
            />
          ))
        ) : (
          <Card tone="muted">
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Este curso ainda não tem atividades. Toque em "Criar Atividade" para adicionar a primeira.
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
  list: {
    gap: Spacing.md,
  },
});