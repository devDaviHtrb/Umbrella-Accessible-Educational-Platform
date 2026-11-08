import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type CardProps = ViewProps & {
  tone?: 'surface' | 'muted';
  padded?: boolean;
};

export function Card({ tone = 'surface', padded = true, style, ...rest }: CardProps) {
  const { translate, preferences } = usePreferences();
  const outlined = preferences.highContrast || preferences.focusMode;

  return (
    <View
      style={[
        styles.base,
        tone === 'surface'
          ? [styles.surface, { backgroundColor: translate(Colors.light.surface) }]
          : { backgroundColor: translate(Colors.light.surfaceContainerLow) },
        preferences.focusMode && styles.flat,
        outlined && { borderWidth: 1, borderColor: translate(Colors.light.outline) },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
  },
  surface: {
    shadowColor: '#0B1E4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  padded: {
    padding: Spacing.lg,
  },
});
