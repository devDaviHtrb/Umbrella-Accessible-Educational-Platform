import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  icon?: IconSymbolName;
  labelActionText?: string;
  onLabelActionPress?: () => void;
};

export function TextField({
  label,
  icon,
  labelActionText,
  onLabelActionPress,
  style,
  ...rest
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
          {label}
        </UmbrellaText>
        {labelActionText ? (
          <Pressable onPress={onLabelActionPress} hitSlop={8}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              {labelActionText}
            </UmbrellaText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.light.textSecondary}
          {...rest}
        />
        {icon ? (
          <IconSymbol name={icon} size={20} color={Colors.light.textSecondary} style={styles.icon} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xxxl,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
  },
  icon: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
