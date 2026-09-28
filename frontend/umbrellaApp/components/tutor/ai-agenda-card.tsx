import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type AIAgendaCardProps = {
  items: string[];
  onConfirm?: () => void;
  onAdjust?: () => void;
};

export function AIAgendaCard({ items, onConfirm, onAdjust }: AIAgendaCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconSymbol name="calendar" size={16} color={Colors.light.tertiary} />
        <UmbrellaText variant="label" color={Colors.light.tertiary} style={styles.headerLabel}>
          AGENDA DE HOJE
        </UmbrellaText>
      </View>

      <View style={styles.itemList}>
        {items.map((item) => (
          <View key={item} style={styles.itemRow}>
            <View style={styles.bullet} />
            <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.itemText}>
              {item}
            </UmbrellaText>
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <SecondaryButton variant="filled" label="Confirmar" onPress={onConfirm} style={styles.actionButton} />
        <SecondaryButton variant="outline" label="Ajustar" onPress={onAdjust} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerLabel: {
    letterSpacing: 0.4,
  },
  itemList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.textSecondary,
    marginTop: 8,
  },
  itemText: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
});