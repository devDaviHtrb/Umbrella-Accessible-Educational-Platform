import { Pressable, StyleSheet } from 'react-native';

import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CategoryChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}>
      <UmbrellaText
        variant="bodyMedium"
        color={selected ? Colors.light.surface : Colors.light.text}>
        {label}
      </UmbrellaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
  },
  chipUnselected: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
});
