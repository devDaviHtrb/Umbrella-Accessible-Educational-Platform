import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { LiveClassScheduler } from '@/components/professor/live-class-scheduler';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';

export default function ProfessorClassScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const { getCourseBasics } = useProfessorCourses();
  const { data: course, loading } = useFocusData(() =>
    courseId ? getCourseBasics(courseId) : Promise.resolve(undefined),
  );

  if (loading) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando aula...
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  if (!course || !courseId) {
    return (
      <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
        <UmbrellaText variant="title">Curso não encontrado</UmbrellaText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <UmbrellaText variant="label" color={Colors.light.textSecondary} style={styles.eyebrow}>
        {course.eyebrow}
      </UmbrellaText>
      <UmbrellaText variant="title" style={styles.title}>
        {course.title}
      </UmbrellaText>

      <LiveClassScheduler courseId={courseId} />

      <Card style={styles.unavailable}>
        <View style={styles.header}>
          <IconSymbol name="video" size={20} color={Colors.light.textSecondary} />
          <UmbrellaText variant="headline">Transmissão ao vivo</UmbrellaText>
          <StatusBadge label="INDISPONÍVEL" tone="neutral" />
        </View>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          O servidor ainda não oferece transmissão de vídeo. Use o agendamento acima para marcar o horário da aula.
        </UmbrellaText>
        <PrimaryButton label="Iniciar transmissão" onPress={() => {}} disabled />
      </Card>

      <Card style={styles.unavailable}>
        <View style={styles.header}>
          <IconSymbol name="bubble.left.and.bubble.right" size={20} color={Colors.light.textSecondary} />
          <UmbrellaText variant="headline">Chat da turma</UmbrellaText>
          <StatusBadge label="INDISPONÍVEL" tone="neutral" />
        </View>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          O chat da aula ainda não está integrado ao servidor, então nenhuma mensagem é enviada ou guardada por aqui.
        </UmbrellaText>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    letterSpacing: 0.4,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  unavailable: {
    gap: Spacing.md,
    borderRadius: Radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
});
