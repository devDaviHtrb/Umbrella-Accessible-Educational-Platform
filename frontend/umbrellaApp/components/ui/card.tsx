import { StyleSheet, View, type ViewProps } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CardProps = ViewProps & {
  tone?: 'surface' | 'muted';
  padded?: boolean;
};

export function Card({ tone = 'surface', padded = true, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        tone === 'surface' ? styles.surface : styles.muted,
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
    backgroundColor: Colors.light.surface,
    shadowColor: '#0B1E4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  muted: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  padded: {
    padding: Spacing.lg,
  },
});
