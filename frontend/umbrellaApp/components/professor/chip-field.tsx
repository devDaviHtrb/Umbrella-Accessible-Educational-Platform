import { StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/ui/category-chip';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';

export type ChipFieldOption<T extends string> = {
  id: T;
  label: string;
};

export type ChipFieldProps<T extends string> = {
  label: string;
  options: ChipFieldOption<T>[];
  value: T | null;
  onChange: (id: T) => void;
};

export function ChipField<T extends string>({ label, options, value, onChange }: ChipFieldProps<T>) {
  return (
    <View style={styles.wrapper}>
      <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
        {label}
      </UmbrellaText>
      <View style={styles.chips}>
        {options.map((option) => (
          <CategoryChip
            key={option.id}
            label={option.label}
            selected={option.id === value}
            onPress={() => onChange(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  label: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});