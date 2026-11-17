import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfessorActivity } from '@/types/professor';

export type ActivityRowProps = {
  activity: ProfessorActivity;
  onEditPress: () => void;
  onDeletePress: () => void;
};

export function ActivityRow({ activity, onEditPress, onDeletePress }: ActivityRowProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <View style={styles.badgeRow}>
            <StatusBadge label={activity.typeLabel} tone="primary" />
            <UmbrellaText
              variant="caption"
              color={Colors.light.textSecondary}
              numberOfLines={1}
              style={styles.moduleTitle}>
              {activity.moduleTitle}
            </UmbrellaText>
          </View>
          <UmbrellaText variant="bodyMedium">{activity.title}</UmbrellaText>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar questões da atividade ${activity.title}`}
            onPress={onEditPress}
            hitSlop={8}
            style={styles.deleteButton}>
            <IconSymbol name="square.and.pencil" size={18} color={Colors.light.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Excluir atividade ${activity.title}`}
            onPress={onDeletePress}
            hitSlop={8}
            style={styles.deleteButton}>
            <IconSymbol name="trash.fill" size={18} color={Colors.light.error} />
          </Pressable>
        </View>
      </View>

      <UmbrellaText
        variant="caption"
        color={activity.questionsCount === 0 ? Colors.light.error : Colors.light.textSecondary}>
        {activity.questionsCount === 0
          ? 'Sem questões: os alunos ainda não conseguem responder'
          : activity.questionsCount === 1
            ? '1 questão'
            : `${activity.questionsCount} questões`}
      </UmbrellaText>

      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {activity.submittedCount === 1 ? '1 entrega' : `${activity.submittedCount} entregas`} ·{' '}
        {activity.gradedCount === 1 ? '1 corrigida' : `${activity.gradedCount} corrigidas`} · nota máxima{' '}
        {activity.maxScore}
      </UmbrellaText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  text: {
    flex: 1,
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moduleTitle: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});