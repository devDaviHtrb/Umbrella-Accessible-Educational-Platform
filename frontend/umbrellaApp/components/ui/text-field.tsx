import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type TextFieldProps = TextInputProps & {
  label: string;
  icon?: IconSymbolName;
  labelActionText?: string;
  onLabelActionPress?: () => void;
  error?: string;
};

export function TextField({
  label,
  icon,
  labelActionText,
  onLabelActionPress,
  error,
  style,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const { translate, fontScale, preferences } = usePreferences();
  // Quando é um campo de senha, controlamos a visibilidade localmente e
  // mostramos um botão de "olho" para revelar/ocultar o que está digitado.
  const isPassword = secureTextEntry === true;
  const [revealed, setRevealed] = useState(false);
  const effectiveSecure = isPassword && !revealed;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
          {label}
        </UmbrellaText>
        {labelActionText ? (
          <Pressable accessibilityRole="button" onPress={onLabelActionPress} hitSlop={8}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              {labelActionText}
            </UmbrellaText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: translate(Colors.light.surfaceContainerLow),
              color: translate(Colors.light.text),
              fontSize: 15 * fontScale,
            },
            preferences.highContrast && { borderWidth: 1, borderColor: translate(Colors.light.outline) },
            error ? { borderWidth: 1, borderColor: translate(Colors.light.error) } : null,
            style,
          ]}
          placeholderTextColor={translate(Colors.light.textSecondary)}
          secureTextEntry={effectiveSecure}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            style={styles.iconButton}>
            <IconSymbol
              name={revealed ? 'eye.slash.fill' : 'eye.fill'}
              size={20}
              color={error ? Colors.light.error : Colors.light.textSecondary}
            />
          </Pressable>
        ) : icon ? (
          <IconSymbol
            name={icon}
            size={20}
            color={error ? Colors.light.error : Colors.light.textSecondary}
            style={styles.icon}
          />
        ) : null}
      </View>

      {error ? (
        <UmbrellaText variant="caption" color={Colors.light.error} style={styles.errorText}>
          {error}
        </UmbrellaText>
      ) : null}
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
  iconButton: {
    position: 'absolute',
    right: Spacing.md,
    padding: Spacing.xs,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  errorText: {
    fontSize: 12,
    marginTop: -2,
  },
});
