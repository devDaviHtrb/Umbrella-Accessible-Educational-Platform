import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type AITutorHeaderProps = {
  statusLabel: string;
  providerBadge: string;
  onMenuPress?: () => void;
};

export function AITutorHeader({ statusLabel, providerBadge, onMenuPress }: AITutorHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <IconSymbol name="sparkles" size={20} color={Colors.light.surface} />
      </View>

      <View style={styles.textColumn}>
        <UmbrellaText variant="headline">IA Umbrella</UmbrellaText>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.statusLabel}>
            {statusLabel}
          </UmbrellaText>
        </View>
      </View>

      <View style={styles.providerBadge}>
        <IconSymbol name="sparkles" size={12} color={Colors.light.primary} />
        <UmbrellaText variant="caption" color={Colors.light.primary}>
          {providerBadge}
        </UmbrellaText>
      </View>

      <Pressable accessibilityRole="button" onPress={onMenuPress} hitSlop={8}>
        <IconSymbol name="ellipsis" size={20} color={Colors.light.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tertiary,
  },
  statusLabel: {
    letterSpacing: 0.4,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.secondaryFixed,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
});