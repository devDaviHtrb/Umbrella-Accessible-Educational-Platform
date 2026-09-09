import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

const TAB_ICON: Record<string, IconSymbolName> = {
  index: 'square.grid.2x2.fill',
  courses: 'graduationcap.fill',
  tutor: 'brain.head.profile',
  agenda: 'calendar',
  settings: 'gearshape.fill',
};

export function CustomTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { state, descriptors, navigation } = props ?? {};

  if (!state || !Array.isArray(state.routes)) {
    if (__DEV__) {
      return (
        <View style={[styles.wrapper, styles.debugWrapper]}>
          <UmbrellaText variant="caption" color={Colors.light.error}>
            CustomTabBar: state.routes ausente ou inválido (recebido: {JSON.stringify(state)}).
            Isso indica que o problema está em como o Tabs navigator está montado em
            app/(tabs)/_layout.tsx, não neste componente.
          </UmbrellaText>
        </View>
      );
    }
    return null;
  }

  if (state.routes.length === 0) {
    if (__DEV__) {
      return (
        <View style={[styles.wrapper, styles.debugWrapper]}>
          <UmbrellaText variant="caption" color={Colors.light.error}>
            CustomTabBar: state.routes chegou como array vazio. As 5 Tabs.Screen
            declaradas em app/(tabs)/_layout.tsx não estão sendo reconhecidas pelo
            Expo Router — verifique esse arquivo e reinicie com /npx expo start -c/.
          </UmbrellaText>
        </View>
      );
    }
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, Spacing.md) },
      ]}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors?.[route.key];
        const options = descriptor?.options ?? {};

        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name ?? '');
        const isFocused = state.index === index;
        const iconName = TAB_ICON[route.name] ?? 'circle';

        const onPress = () => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation?.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event?.defaultPrevented) {
            navigation?.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={String(label)}
            onPress={onPress}
            style={styles.tabItem}>
            <View style={[styles.pill, isFocused && styles.pillActive]}>
              <IconSymbol
                name={iconName}
                size={22}
                color={isFocused ? Colors.light.primary : Colors.light.tabIconDefault}
              />
              <UmbrellaText
                variant="caption"
                color={isFocused ? Colors.light.primary : Colors.light.tabIconDefault}
                style={styles.label}
                numberOfLines={1}>
                {label}
              </UmbrellaText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outline,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  debugWrapper: {
    padding: Spacing.md,
    minHeight: 56,
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
  pillActive: {
    backgroundColor: Colors.light.secondaryFixed,
  },
  label: {
    marginTop: 2,
  },
});