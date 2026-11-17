import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BottomBar } from '@/components/layout/bottom-bar';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { buildTabItems } from '@/utils/tab-items';

const TAB_HREF: Record<string, Href> = {
  index: '/(tabs)' as Href,
  courses: '/(tabs)/courses' as Href,
  messages: '/(tabs)/messages' as Href,
  tutor: '/(tabs)/tutor' as Href,
  agenda: '/(tabs)/agenda' as Href,
  settings: '/(tabs)/settings' as Href,
};

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

    if (event?.defaultPrevented) {
      return;
    }

    const href = TAB_HREF[route.name];
    if (href) {
      router.navigate(href);
    } else {
      navigation?.navigate(route.name);
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
