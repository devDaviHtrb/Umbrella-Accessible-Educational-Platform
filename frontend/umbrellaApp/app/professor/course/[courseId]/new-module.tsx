import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { ModuleForm } from '@/components/professor/module-form';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSubmit } from '@/hooks/use-submit';
import type { ProfessorModuleInput } from '@/types/professor';

export default function ProfessorModuleFormScreen() {
  const { courseId, moduleId } = useLocalSearchParams<{ courseId: string; moduleId?: string }>();
  const isEditing = !!moduleId;

  const { getModule, createModule, updateModule } = useProfessorCourses();

  const { data: module, loading, error: loadError, retry } = useFocusData(() =>
    moduleId ? getModule(courseId, moduleId) : Promise.resolve(undefined),
  );

  const { submit, submitting, error } = useSubmit(
    async (input: ProfessorModuleInput) => {
      if (isEditing && moduleId) {
        await updateModule(courseId, moduleId, input);
      } else {
        await createModule(courseId, input);
      }
      router.back();
    },
    { errorMessage: 'Não foi possível salvar o módulo. Tente novamente.' },
  );

  const screenOptions = (
    <Stack.Screen options={{ headerTitle: isEditing ? 'Editar Módulo' : 'Novo Módulo' }} />
  );

  if (loading) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando módulo...
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  if (loadError && !module) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <LoadError message="Não foi possível carregar o módulo." onRetry={retry} />
      </ScreenContainer>
    );
  }

  if (isEditing && !module) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <UmbrellaText variant="title">Módulo não encontrado</UmbrellaText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {screenOptions}
      <ModuleForm
        key={module?.id ?? 'novo'}
        initialValues={
          module
            ? { title: module.title, description: module.description }
            : undefined
        }
        descriptionHint={
          isEditing
            ? 'A descrição atual não é exibida aqui. Ao salvar, o texto acima substitui a descrição do módulo.'
            : undefined
        }
        submitLabel={isEditing ? 'Salvar Alterações' : 'Criar Módulo'}
        submitting={submitting}
        submitError={error}
        onSubmit={submit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
});