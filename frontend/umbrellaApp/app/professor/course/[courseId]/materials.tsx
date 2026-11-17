import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { LoadError } from '@/components/professor/load-error';
import { MaterialRow } from '@/components/professor/material-row';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { ProfessorMaterial } from '@/types/professor';

export default function ProfessorMaterialsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getMaterials } = useProfessorCourses();
  const { data: materials, loading, error, retry } = useFocusData(async () =>
    (await getMaterials(courseId)).filter((material) => material.kind !== 'videos'),
  );

  async function handleOpen(material: ProfessorMaterial) {
    try {
      await WebBrowser.openBrowserAsync(material.url);
    } catch {
    }
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
      Anexe documentos, slides, imagens e planilhas de apoio a cada módulo do curso.
      </UmbrellaText>

      <PrimaryButton
        label="Adicionar Material"
        icon="plus"
        iconPosition="leading"
        onPress={() => router.push(professorRoutes.newMaterial(courseId))}
      />

      <View style={styles.list}>
        {loading ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Carregando materiais...
          </UmbrellaText>
        ) : error && !materials ? (
          <LoadError message="Não foi possível carregar os materiais." onRetry={retry} />
        ) : materials && materials.length > 0 ? (
          materials.map((material) => (
            <MaterialRow
              key={material.id}
              material={material}
              onOpenPress={() => handleOpen(material)}
            />
          ))
        ) : (
          <Card tone="muted">
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Este curso ainda não tem materiais. Toque em &ldquo;Adicionar Material&rdquo; para anexar o primeiro.
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
