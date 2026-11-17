import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ActionRowProps = {
  icon: IconSymbolName;
  title: string;
  subtitle: string;
  onPress: () => void;
  badgeLabel?: string;
};

export function ActionRow({ icon, title, subtitle, onPress, badgeLabel }: ActionRowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.iconCircle}>
          <IconSymbol name={icon} size={18} color={Colors.light.primary} />
        </View>
        <View style={styles.text}>
          <UmbrellaText variant="bodyMedium">{title}</UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {subtitle}
          </UmbrellaText>
        </View>
        {badgeLabel ? <StatusBadge label={badgeLabel} tone="primary" /> : null}
        <IconSymbol name="chevron.right" size={18} color={Colors.light.textSecondary} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});