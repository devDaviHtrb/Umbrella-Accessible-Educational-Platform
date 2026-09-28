import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ActiveModule } from '@/types/painel';

export type ModuleCardProps = {
  module: ActiveModule;
};

export function ModuleCard({ module }: ModuleCardProps) {
  const isNewTask = module.status === 'nova-tarefa';

  return (
    <Card style={isNewTask ? styles.accentBorder : undefined}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <IconSymbol name={module.icon} size={22} color={Colors.light.primary} />
        </View>
        <StatusBadge
          label={module.statusLabel}
          tone={module.status === 'em-andamento' ? 'teal' : 'neutral'}
        />
      </View>

      <UmbrellaText variant="headline" style={styles.title}>
        {module.title}
      </UmbrellaText>
      <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.description}>
        {module.description}
      </UmbrellaText>

      <View style={styles.progressRow}>
        <UmbrellaText variant="label" color={Colors.light.textSecondary}>
          Conclusão do Módulo
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
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
