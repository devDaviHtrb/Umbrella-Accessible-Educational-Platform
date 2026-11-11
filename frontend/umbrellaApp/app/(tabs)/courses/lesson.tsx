import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { VLibrasPanel } from '@/components/recorded/vlibras-panel';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useVLibras } from '@/hooks/use-vlibras';
import { openMaterial } from '@/utils/open-material';

type LessonParams = {
  title?: string;
  description?: string;
  url?: string;
  category?: string;
  moduleTitle?: string;
  sizeLabel?: string;
};

export default function RecordedLessonScreen() {
  const { title = '', description = '', url, category, moduleTitle, sizeLabel } = useLocalSearchParams<LessonParams>();
  const vlibras = useVLibras();

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {category ? (
          <UmbrellaText variant="label" color={Colors.light.primary}>
            {category.toUpperCase()}
          </UmbrellaText>
        ) : null}
        <UmbrellaText variant="display">{title}</UmbrellaText>
        {moduleTitle ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Módulo: {moduleTitle}
          </UmbrellaText>
        ) : null}
        {description ? <UmbrellaText variant="body">{description}</UmbrellaText> : null}
      </View>

      <Card style={styles.original}>
        <View style={styles.originalHeader}>
          <UmbrellaText variant="headline" style={styles.originalTitle}>
            Vídeo original
          </UmbrellaText>
          {sizeLabel ? <StatusBadge label={sizeLabel} tone="neutral" /> : null}
        </View>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          O vídeo é aberto no navegador do aparelho.
        </UmbrellaText>
        <PrimaryButton
          label="Abrir vídeo"
          icon="play.fill"
          iconPosition="leading"
          onPress={() => openMaterial({ title, url, description })}
        />
      </Card>

      <VLibrasPanel status={vlibras.status} message={vlibras.message} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  original: {
    gap: Spacing.md,
  },
  originalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  originalTitle: {
    flex: 1,
  },
});
