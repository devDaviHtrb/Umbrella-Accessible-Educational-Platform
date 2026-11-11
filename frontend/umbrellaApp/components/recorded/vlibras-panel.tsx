import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { VLibrasStatus } from '@/hooks/use-vlibras';

const STATUS_BADGE = {
  unavailable: { label: 'INDISPONÍVEL', tone: 'neutral' },
  loading: { label: 'CARREGANDO', tone: 'primary' },
  ready: { label: 'DISPONÍVEL', tone: 'teal' },
  failed: { label: 'FALHA', tone: 'error' },
} as const;

export type VLibrasPanelProps = {
  status: VLibrasStatus;
  message: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function VLibrasPanel({ status, message, onRetry, children }: VLibrasPanelProps) {
  const badge = STATUS_BADGE[status];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="person.2.wave.2.fill" size={20} color={Colors.light.primary} />
        <UmbrellaText variant="headline" style={styles.title}>
          Tradução em Libras
        </UmbrellaText>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>

      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        O VLibras traduz textos em português para Libras com um intérprete virtual. Ele não traduz o vídeo: o
        conteúdo traduzível desta aula é o título e a descrição.
      </UmbrellaText>

      {status === 'ready' ? (
        children
      ) : (
        <View style={styles.state}>
          {status === 'loading' ? <ActivityIndicator color={Colors.light.primary} /> : null}
          <UmbrellaText variant="body" color={Colors.light.textSecondary} accessibilityRole="alert">
            {message}
          </UmbrellaText>
          {status === 'failed' && onRetry ? <SecondaryButton label="Tentar novamente" onPress={onRetry} /> : null}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    flex: 1,
  },
  state: {
    gap: Spacing.md,
  },
});
