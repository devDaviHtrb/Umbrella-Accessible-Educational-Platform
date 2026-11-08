import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/layout/bottom-bar';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { buildTabItems } from '@/utils/tab-items';

export function CustomTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props ?? {};

  if (!state || !Array.isArray(state.routes)) {
    if (__DEV__) {
      return (
        <View style={styles.debugWrapper}>
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
        <View style={styles.debugWrapper}>
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

  const items = buildTabItems(state, descriptors, (route) => () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const event = navigation?.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event?.defaultPrevented) {
      navigation?.navigate(route.name, { screen: 'index' });
    }
  });

  return <BottomBar items={items} />;
}

const styles = StyleSheet.create({
  debugWrapper: {
    padding: Spacing.md,
    minHeight: 56,
    backgroundColor: Colors.light.surface,
  },
});
