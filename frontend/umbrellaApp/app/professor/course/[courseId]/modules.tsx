import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { ModuleRow } from '@/components/professor/module-row';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { ProfessorModule } from '@/types/professor';
import { confirmDestructive, notify } from '@/utils/confirm';

export default function ProfessorModulesScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getModules, deleteModule } = useProfessorCourses();
  const { data: modules, loading, error, reload, retry } = useFocusData(() => getModules(courseId));

  function handleDelete(module: ProfessorModule) {
    const hasActivities = module.activitiesCount > 0;
    confirmDestructive({
      title: 'Excluir módulo',
      message: hasActivities
        ? `"${module.title}" e as ${module.activitiesCount} atividade(s) deste módulo serão excluídos. Essa ação não pode ser desfeita.`
        : `"${module.title}" será excluído. Essa ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await deleteModule(courseId, module.id);
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
        Organize o conteúdo do curso em módulos.
      </UmbrellaText>

      <PrimaryButton
        label="Criar Módulo"
        icon="plus"
        iconPosition="leading"
        onPress={() => router.push(professorRoutes.newModule(courseId))}
      />

      <View style={styles.list}>
        {loading ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Carregando módulos...
          </UmbrellaText>
        ) : error && !modules ? (
          <LoadError message="Não foi possível carregar os módulos." onRetry={retry} />
        ) : modules && modules.length > 0 ? (
          modules.map((module) => (
            <ModuleRow
              key={module.id}
              module={module}
              onEditPress={() => router.push(professorRoutes.editModule(courseId, module.id))}
              onDeletePress={() => handleDelete(module)}
            />
          ))
        ) : (
          <Card tone="muted">
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Este curso ainda não tem módulos. Toque em "Criar Módulo" para adicionar o primeiro.
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