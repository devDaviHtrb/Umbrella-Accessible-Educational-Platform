import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { ActivityDetailsForm, type ActivityDetailsValues } from '@/components/professor/activity-details-form';
import { ActivityForm } from '@/components/professor/activity-form';
import { LoadError } from '@/components/professor/load-error';
import { QuestionBuilder } from '@/components/professor/question-builder';
import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorRoutes } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useSubmit } from '@/hooks/use-submit';
import type { ProfessorActivityInput } from '@/types/professor';

export default function NewActivityScreen() {
  const { courseId, activityId } = useLocalSearchParams<{ courseId: string; activityId?: string }>();

  return activityId ? (
    <ActivityQuestions key={activityId} courseId={courseId} activityId={activityId} />
  ) : (
    <CreateActivity courseId={courseId} />
  );
}

function CreateActivity({ courseId }: { courseId: string }) {
  const { getModules, createActivity } = useProfessorCourses();
  const { data: modules, loading, error: loadError, retry } = useFocusData(() => getModules(courseId));

  const { submit, submitting, error } = useSubmit(
    async (input: ProfessorActivityInput) => {
      const createdId = await createActivity(courseId, input);
      router.replace(professorRoutes.editActivity(courseId, createdId));
    },
    { errorMessage: 'Não foi possível criar a atividade. Tente novamente.' },
  );

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {loading ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando módulos...
        </UmbrellaText>
      ) : loadError && !modules ? (
        <LoadError message="Não foi possível carregar os módulos." onRetry={retry} />
      ) : modules ? (
        <>
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Primeiro os dados gerais. Em seguida você adiciona as questões da atividade.
          </UmbrellaText>
          <ActivityForm
            key={courseId}
            modules={modules}
            submitLabel="Criar e adicionar questões"
            submitting={submitting}
            submitError={error}
            onSubmit={submit}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

function ActivityQuestions({ courseId, activityId }: { courseId: string; activityId: string }) {
  const { getActivity, updateActivity } = useProfessorCourses();
  const { data: activity, loading, error, reload, retry } = useFocusData(() => getActivity(courseId, activityId));

  const { submit, submitting, error: updateError } = useSubmit(
    async (values: ActivityDetailsValues) => {
      if (!activity) return;
      await updateActivity(activity, values);
      await reload();
    },
    { errorMessage: 'Não foi possível salvar os dados da atividade. Tente novamente.', resetOnSuccess: true },
  );

  const screenOptions = <Stack.Screen options={{ headerTitle: 'Editar Atividade' }} />;

  if (loading) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando atividade...
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  if (error && !activity) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <LoadError message="Não foi possível carregar a atividade." onRetry={retry} />
      </ScreenContainer>
    );
  }

  if (!activity) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        {screenOptions}
        <UmbrellaText variant="title">Atividade não encontrada</UmbrellaText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {screenOptions}

      <Card style={styles.summary}>
        <View style={styles.badgeRow}>
          <StatusBadge label={activity.typeLabel} tone="primary" />
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1} style={styles.moduleTitle}>
            {activity.moduleTitle}
          </UmbrellaText>
        </View>
        <UmbrellaText variant="bodyMedium">{activity.title}</UmbrellaText>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          Nota máxima: {activity.maxScore}
        </UmbrellaText>
      </Card>

      <ActivityDetailsForm
        key={`${activity.title}-${activity.type}`}
        initialValues={{ title: activity.title, type: activity.type }}
        submitting={submitting}
        submitError={updateError}
        onSubmit={submit}
      />

      <QuestionBuilder activity={activity} onChanged={reload} />

      <SecondaryButton label="Concluir" onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
  summary: {
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moduleTitle: {
    flexShrink: 1,
  },
});
