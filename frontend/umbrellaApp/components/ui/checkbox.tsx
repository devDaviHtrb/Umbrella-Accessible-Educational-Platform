import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const { translate } = usePreferences();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
      hitSlop={8}>
      <View
        style={[
          styles.circle,
          { borderColor: translate(Colors.light.outline) },
          checked && {
            backgroundColor: translate(Colors.light.primary),
            borderColor: translate(Colors.light.primary),
          },
        ]}>
        {checked ? <IconSymbol name="checkmark" size={12} color={Colors.light.surface} /> : null}
      </View>
      {label ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          {label}
        </UmbrellaText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
});
