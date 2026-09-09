import { Stack } from 'expo-router';

import { Colors, FontFamily } from '@/constants/theme';

export default function CoursesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.light.primary,
        headerStyle: { backgroundColor: Colors.light.surface },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: FontFamily.semiBold,
          color: Colors.light.text,
          fontSize: 17,
        },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: 'Detalhes do Curso',
          headerBackTitle: 'Cursos',
        }}
      />
      <Stack.Screen
        name="recorded"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Cursos',
        }}
      />
      <Stack.Screen
        name="class/[lessonId]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack>
  );
}