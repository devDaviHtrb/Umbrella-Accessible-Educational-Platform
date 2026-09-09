import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ActiveReminder } from '@/types/agenda';

export type ReminderCardProps = {
  reminder: ActiveReminder;
  onComplete: () => void;
  onDelete: () => void;
};

const ICON_MAP: Record<ActiveReminder['icon'], IconSymbolName> = {
  'exclamationmark.circle.fill': 'exclamationmark.circle.fill',
  'book.fill': 'book.fill',
};

export function ReminderCard({ reminder, onComplete, onDelete }: ReminderCardProps) {
  const isCompleted = Boolean(reminder.completed);
  const iconTone = reminder.iconTone === 'error' ? Colors.light.error : Colors.light.primary;
  const iconBg = reminder.iconTone === 'error' ? '#FBE4E4' : Colors.light.secondaryFixed;

  function handleDeletePress() {
    Alert.alert('Excluir lembrete?', `"${reminder.title}" será removido da sua lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <View style={[styles.row, isCompleted && styles.rowCompleted]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <IconSymbol name={ICON_MAP[reminder.icon]} size={18} color={iconTone} />
      </View>

      <View style={styles.textColumn}>
        <UmbrellaText
          variant="bodyMedium"
          color={isCompleted ? Colors.light.textSecondary : Colors.light.text}
          style={isCompleted && styles.strikethrough}>
          {reminder.title}
        </UmbrellaText>
        <UmbrellaText
          variant="caption"
          color={
            isCompleted
              ? Colors.light.success
              : reminder.urgent
                ? Colors.light.error
                : Colors.light.textSecondary
          }>
          {isCompleted ? 'Concluído' : reminder.dueLabel}
        </UmbrellaText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCompleted ? 'Lembrete concluído' : 'Marcar como concluído'}
          onPress={onComplete}
          disabled={isCompleted}
          hitSlop={8}>
          <IconSymbol
            name="checkmark.circle.fill"
            size={22}
            color={isCompleted ? Colors.light.success : Colors.light.outline}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Excluir lembrete"
          onPress={handleDeletePress}
          hitSlop={8}>
          <IconSymbol name="trash.fill" size={20} color={Colors.light.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  rowCompleted: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});