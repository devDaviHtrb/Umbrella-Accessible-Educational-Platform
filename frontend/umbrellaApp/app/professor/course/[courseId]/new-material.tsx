import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { MaterialForm } from '@/components/professor/material-form';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSubmit } from '@/hooks/use-submit';
import type { ProfessorMaterialInput } from '@/types/professor';

export default function NewMaterialScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getModules, createMaterial } = useProfessorCourses();
  const { data: modules, loading, error: loadError, retry } = useFocusData(() => getModules(courseId));

  const { submit, submitting, error } = useSubmit(
    async (inputs: ProfessorMaterialInput[]) => {
      for (const input of inputs) {
        await createMaterial(input);
      }
      router.back();
    },
    {
      errorMessage:
        'Não foi possível adicionar o material. Confira a lista de materiais antes de tentar novamente.',
    },
  );

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {loading ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando módulos...
        </UmbrellaText>
      ) : loadError && !modules ? (
        <LoadError message="Não foi possível carregar os módulos." onRetry={retry} />
      ) : modules ? (
        <MaterialForm
          key={courseId}
          modules={modules}
          submitting={submitting}
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
