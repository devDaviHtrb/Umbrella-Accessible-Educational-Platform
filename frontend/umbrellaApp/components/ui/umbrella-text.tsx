import { useContext, useEffect, useRef } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { extractText, ReadAloudContext } from '@/components/layout/read-aloud';
import { Colors, Typography } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type UmbrellaTextVariant = keyof typeof Typography;

export type UmbrellaTextProps = TextProps & {
  variant?: UmbrellaTextVariant;
  color?: string;
};

export function UmbrellaText({ variant = 'body', color, style, children, ...rest }: UmbrellaTextProps) {
  const { translate, fontScale, preferences } = usePreferences();
  const registry = useContext(ReadAloudContext);
  const orderRef = useRef<number | null>(null);

  if (registry && orderRef.current === null) orderRef.current = registry.nextOrder();

  const text = extractText(children);
  const readable = preferences.textToSpeech;

  useEffect(() => {
    const order = orderRef.current;
    if (!registry || order === null || !readable) return;
    registry.set(order, text);
    return () => registry.remove(order);
  }, [registry, readable, text]);

  const flat: TextStyle = StyleSheet.flatten([
    styles.base,
    Typography[variant],
    { color: color ?? Colors.light.text },
    style,
  ]) ?? {};

  const resolved = {
    ...flat,
    color: typeof flat.color === 'string' ? translate(flat.color) : flat.color,
    fontSize: flat.fontSize ? flat.fontSize * fontScale : flat.fontSize,
    lineHeight: flat.lineHeight ? flat.lineHeight * fontScale : flat.lineHeight,
  };

  return (
    <Text style={resolved} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
