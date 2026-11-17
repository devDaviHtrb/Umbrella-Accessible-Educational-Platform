import { StyleSheet } from 'react-native';

import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';

export type LoadErrorProps = {
  message?: string;
  onRetry: () => void;
};

export function LoadError({ message = 'Não foi possível carregar os dados.', onRetry }: LoadErrorProps) {
  return (
    <Card tone="muted" style={styles.card} accessibilityRole="alert">
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {message}
      </UmbrellaText>
      <SecondaryButton label="Tentar novamente" onPress={onRetry} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
});
