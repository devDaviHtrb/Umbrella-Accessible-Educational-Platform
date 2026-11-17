import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type BottomBarItem = {
  key: string;
  label: string;
  icon: IconSymbolName;
  focused: boolean;
  onPress: () => void;
};

export function BottomBar({ items }: { items: BottomBarItem[] }) {
  const insets = useSafeAreaInsets();
  const { translate } = usePreferences();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.md),
          backgroundColor: translate(Colors.light.surface),
          borderTopColor: translate(Colors.light.outline),
        },
      ]}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityState={item.focused ? { selected: true } : {}}
          accessibilityLabel={item.label}
          onPress={item.onPress}
          style={styles.tabItem}>
          <View
            style={[
              styles.pill,
              item.focused && { backgroundColor: translate(Colors.light.secondaryFixed) },
            ]}>
            <IconSymbol
              name={item.icon}
              size={22}
              color={item.focused ? Colors.light.primary : Colors.light.tabIconDefault}
            />
            <UmbrellaText
              variant="caption"
              color={item.focused ? Colors.light.primary : Colors.light.tabIconDefault}
              style={styles.label}
              numberOfLines={1}>
              {item.label}
            </UmbrellaText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    minWidth: 64,
  },
  label: {
    marginTop: 2,
  },
});
