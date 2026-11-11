import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import { CustomTabBar } from '@/components/layout/custom-tab-bar';
import { ChatProvider } from '@/hooks/messages/chatContext';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { Colors } from '@/constants/theme';
import { isTeacher, professorRoutes } from '@/constants/routes';

export default function TabLayout() {
  const { isAuthenticated, isLoading, userRoles } = useAuthContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isTeacher(userRoles)) {
    return <Redirect href={professorRoutes.home} />;
  }

  return (
    <ChatProvider>
      <Tabs tabBar={(props: any) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Painel' }} />
        <Tabs.Screen name="courses" options={{ title: 'Cursos' }} />
        <Tabs.Screen name="tutor" options={{ title: 'Tutor IA' }} />
        <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
        <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
      </Tabs>
    </ChatProvider>
  );
}