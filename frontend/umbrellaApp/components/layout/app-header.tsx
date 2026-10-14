import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';

export type AppHeaderProps = {
  onSearchPress?: () => void;
};

export function AppHeader({ onSearchPress }: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <UmbrellaText variant="title" color={Colors.light.primary}>
        Umbrella
      </UmbrellaText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buscar"
        onPress={onSearchPress}
        hitSlop={12}>
        <IconSymbol name="magnifyingglass" size={24} color={Colors.light.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
