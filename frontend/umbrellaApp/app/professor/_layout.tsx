import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { isTeacher, loginHref, studentHomeHref } from '@/constants/routes';
import { Colors, FontFamily } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';

export default function ProfessorStackLayout() {
  const { isAuthenticated, isLoading, userRoles } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={loginHref} />;
  }

  if (!isTeacher(userRoles)) {
    return <Redirect href={studentHomeHref} />;
  }

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
      <Stack.Screen
        name="index"
        options={{ headerShown: true, headerTitle: 'Área do Professor', headerBackVisible: false }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-course"
        options={{ headerShown: true, headerTitle: 'Criar Curso', headerBackTitle: 'Meus Cursos' }}
      />
      <Stack.Screen
        name="course/[courseId]/index"
        options={{ headerShown: true, headerTitle: 'Visão Geral', headerBackTitle: 'Meus Cursos' }}
      />
      <Stack.Screen
        name="course/[courseId]/modules"
        options={{ headerShown: true, headerTitle: 'Módulos', headerBackTitle: 'Curso' }}
      />
      <Stack.Screen
        name="course/[courseId]/new-module"
        options={{ headerShown: true, headerTitle: 'Novo Módulo', headerBackTitle: 'Módulos' }}
      />
      <Stack.Screen
        name="course/[courseId]/materials"
        options={{ headerShown: true, headerTitle: 'Materiais', headerBackTitle: 'Curso' }}
      />
      <Stack.Screen
        name="course/[courseId]/new-material"
        options={{
          headerShown: true,
          headerTitle: 'Adicionar Material',
          headerBackTitle: 'Materiais',
        }}
      />
      <Stack.Screen
        name="course/[courseId]/activities"
        options={{ headerShown: true, headerTitle: 'Atividades', headerBackTitle: 'Curso' }}
      />
      <Stack.Screen
        name="course/[courseId]/new-activity"
        options={{
          headerShown: true,
          headerTitle: 'Criar Atividade',
          headerBackTitle: 'Atividades',
        }}
      />
      <Stack.Screen
        name="course/[courseId]/students"
        options={{
          headerShown: true,
          headerTitle: 'Alunos & Entregas',
          headerBackTitle: 'Curso',
        }}
      />
      <Stack.Screen
        name="course/[courseId]/edit"
        options={{ headerShown: true, headerTitle: 'Editar Curso', headerBackTitle: 'Curso' }}
      />
      <Stack.Screen
        name="course/[courseId]/live"
        options={{ headerShown: true, headerTitle: 'Aula ao Vivo', headerBackTitle: 'Curso' }}
      />
    </Stack>
  );
}