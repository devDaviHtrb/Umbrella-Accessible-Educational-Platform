import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type PrimaryButtonProps = PressableProps & {
  label: string;
  icon?: IconSymbolName;
  iconPosition?: 'leading' | 'trailing';
};

export function PrimaryButton({ label, icon, iconPosition = 'trailing', style, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, pressed && styles.pressed, style as any]}
      {...rest}>
      <View style={styles.content}>
        {icon && iconPosition === 'leading' ? (
          <IconSymbol name={icon} size={18} color={Colors.light.surface} />
        ) : null}
        <UmbrellaText variant="bodyMedium" color={Colors.light.surface} style={styles.label}>
          {label}
        </UmbrellaText>
        {icon && iconPosition === 'trailing' ? (
          <IconSymbol name={icon} size={18} color={Colors.light.surface} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
});