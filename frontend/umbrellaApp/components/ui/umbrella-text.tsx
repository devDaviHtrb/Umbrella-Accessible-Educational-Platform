import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

export type UmbrellaTextVariant = keyof typeof Typography;

export type UmbrellaTextProps = TextProps & {
  variant?: UmbrellaTextVariant;
  color?: string;
};

export function UmbrellaText({ variant = 'body', color, style, ...rest }: UmbrellaTextProps) {
  return (
    <Text
      style={[styles.base, Typography[variant], { color: color ?? Colors.light.text }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
