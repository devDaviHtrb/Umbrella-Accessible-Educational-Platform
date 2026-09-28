import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export type ProgressBarProps = {
  progress: number;
  fillColor?: string;
  height?: number;
};

export function ProgressBar({ progress, fillColor, height = 8 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: fillColor ?? Colors.light.primary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.light.outline,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.pill,
  },
});
