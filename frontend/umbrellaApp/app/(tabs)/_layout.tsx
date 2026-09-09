import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/layout/custom-tab-bar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Painel' }} />
      <Tabs.Screen name="courses" options={{ title: 'Cursos' }} />
      <Tabs.Screen name="tutor" options={{ title: 'Tutor IA' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}