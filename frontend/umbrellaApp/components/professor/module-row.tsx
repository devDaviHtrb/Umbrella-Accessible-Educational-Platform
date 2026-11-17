import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfessorModule } from '@/types/professor';

export type ModuleRowProps = {
  module: ProfessorModule;
  onEditPress: () => void;
  onDeletePress: () => void;
};

export function ModuleRow({ module, onEditPress, onDeletePress }: ModuleRowProps) {
  const activitiesLabel =
    module.activitiesCount === 1 ? '1 atividade' : `${module.activitiesCount} atividades`;

  return (
    <Card style={styles.card}>
      <View style={styles.numberCircle}>
        <UmbrellaText variant="label" color={Colors.light.primary}>
          {module.number}
        </UmbrellaText>
      </View>

      <View style={styles.text}>
        <UmbrellaText variant="bodyMedium">{module.title}</UmbrellaText>
        {module.description ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2}>
            {module.description}
          </UmbrellaText>
        ) : null}
        <View style={styles.metaRow}>
          <StatusBadge
            label={module.statusLabel}
            tone={module.status === 'publicado' ? 'teal' : 'neutral'}
          />
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {activitiesLabel}
          </UmbrellaText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar módulo ${module.title}`}
          onPress={onEditPress}
          hitSlop={8}
          style={styles.actionButton}>
          <IconSymbol name="square.and.pencil" size={18} color={Colors.light.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Excluir módulo ${module.title}`}
          onPress={onDeletePress}
          hitSlop={8}
          style={styles.actionButton}>
          <IconSymbol name="trash.fill" size={18} color={Colors.light.error} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});