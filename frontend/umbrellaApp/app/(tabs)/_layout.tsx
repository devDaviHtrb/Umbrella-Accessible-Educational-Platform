import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { CustomTabBar } from '@/components/layout/custom-tab-bar';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // While resolving auth state from storage, show a spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // Don't render tabs at all if not authenticated (redirect is in flight)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs tabBar={(props: any) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="courses" options={{ title: 'Cursos' }} />
      <Tabs.Screen name="tutor" options={{ title: 'Tutor IA' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}