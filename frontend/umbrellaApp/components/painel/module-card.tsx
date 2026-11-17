import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { ActiveModule } from '@/types/painel';

export type ModuleCardProps = {
  module: ActiveModule;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const isNewTask = module.status === 'nova-tarefa';

  return (
    <Card style={isNewTask ? styles.accentBorder : undefined}>
      <View style={styles.topRow}>
        <Avatar uri={module.imageUrl} name={module.title} size={40} shape="rounded" fallbackIcon={module.icon} />
        <StatusBadge
          label={module.statusLabel}
          tone={module.status === 'em-andamento' ? 'teal' : 'neutral'}
        />
      </View>

      <UmbrellaText variant="headline" style={styles.title} numberOfLines={2}>
        {module.title}
      </UmbrellaText>
      <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.description} numberOfLines={2}>
        {module.description}
      </UmbrellaText>

      <View style={styles.progressRow}>
        <UmbrellaText variant="label" color={Colors.light.textSecondary}>
          Progresso
        </UmbrellaText>
        <UmbrellaText variant="label" color={Colors.light.text}>
          {module.progress}%
        </UmbrellaText>
      </View>
      <ProgressBar progress={module.progress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  accentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
});
