import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type SecondaryButtonVariant = 'outline' | 'filled' | 'onDark';

export type SecondaryButtonProps = PressableProps & {
  label: string;
  variant?: SecondaryButtonVariant;
};

export function SecondaryButton({ label, variant = 'outline', style, ...rest }: SecondaryButtonProps) {
  const { translate } = usePreferences();

  const variantStyle =
    variant === 'outline'
      ? {
          backgroundColor: translate(Colors.light.surface),
          borderWidth: 1.5,
          borderColor: translate(Colors.light.primary),
        }
      : variant === 'filled'
        ? { backgroundColor: translate(Colors.light.secondaryFixed) }
        : { backgroundColor: translate(Colors.light.surface) };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, variantStyle, pressed && styles.pressed, style as any]}
      {...rest}>
      <UmbrellaText variant="bodyMedium" color={Colors.light.primary} style={styles.label}>
        {label}
      </UmbrellaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontWeight: '600',
  },
});
