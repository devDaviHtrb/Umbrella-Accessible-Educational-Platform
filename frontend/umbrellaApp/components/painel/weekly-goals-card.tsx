import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { WeeklyGoal } from '@/types/painel';

export type WeeklyGoalsCardProps = {
  goals: WeeklyGoal[];
  onAdjustPress?: () => void;
};

export function WeeklyGoalsCard({ goals, onAdjustPress }: WeeklyGoalsCardProps) {
  return (
    <Card tone="muted">
      <UmbrellaText variant="headline" style={styles.title}>
        Metas Semanais
      </UmbrellaText>

      <View style={styles.goalList}>
        {goals.map((goal) => (
          <View key={goal.id} style={styles.goalItem}>
            <View style={styles.goalRow}>
              <UmbrellaText variant="body">{goal.label}</UmbrellaText>
              <UmbrellaText
                variant="bodyMedium"
                color={goal.completed ? Colors.light.success : Colors.light.text}>
                {goal.progressLabel}
              </UmbrellaText>
            </View>
            <ProgressBar
              progress={goal.progress}
              fillColor={goal.completed ? Colors.light.tertiary : Colors.light.primary}
            />
          </View>
        ))}
      </View>

      <SecondaryButton label="Ajustar Metas" onPress={onAdjustPress} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.lg,
  },
  goalList: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  goalItem: {
    gap: Spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    marginTop: Spacing.xs,
  },
});
