import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { CourseHero } from '@/components/courses/course-hero';
import { ModuleAccordion } from '@/components/courses/module-accordion';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCourses } from '@/hooks/api/courses/useCourse';
import type { CourseLesson } from '@/types/courses';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { useCourseDetails } = useCourses();
  const { courseDetails, modules, detailLoading, detailError } = useCourseDetails(id);

  function handleLessonPress(lesson: CourseLesson) {
    router.push(`/courses/class/${lesson.id}`);
  }

  if (detailLoading) {
    return (
      <ScreenContainer disableTopInset>
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: Spacing.xl }} />
      </ScreenContainer>
    );
  }

  if (detailError || !courseDetails) {
    return (
      <ScreenContainer disableTopInset>
        <UmbrellaText variant="title">Curso não encontrado</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={{ marginTop: Spacing.sm }}>
          {detailError || 'Não foi possível carregar as informações deste curso.'}
        </UmbrellaText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer disableTopInset>
      <CourseHero title={courseDetails.name} badgeLabel={courseDetails.subjectName ?? 'Geral'} />

      <Card>
        <View style={styles.instructorRow}>
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={20} color={Colors.light.textSecondary} />
          </View>
          <View>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.caps}>
              Instrutor
            </UmbrellaText>
            <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
              {courseDetails.instructorName ?? courseDetails.creator?.name ?? 'Instrutor Umbrella'}
            </UmbrellaText>
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoRow label="Duração" value={`${courseDetails.duration ?? '0'}h`} />
          <InfoRow label="Nível" value={`Nível ${courseDetails.difficultyLevel ?? 'Iniciante'}`} />
          <InfoRow label="Certificação" value="Disponível ao concluir" emphasis />
        </View>

        <PrimaryButton label="Inscrever-se no Curso" onPress={() => { }} style={styles.ctaButton} />
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.ctaCaption}>
          Acesso imediato e vitalício ao conteúdo
        </UmbrellaText>
      </Card>

      <Card tone="muted">
        <UmbrellaText variant="headline" style={styles.overviewTitle}>
          Visão Geral
        </UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.overviewText}>
          {courseDetails.description}
        </UmbrellaText>
      </Card>

      <View style={styles.contentHeader}>
        <UmbrellaText variant="title">Conteúdo do Curso</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          {modules.length} {modules.length === 1 ? 'módulo disponível' : 'módulos disponíveis'}
        </UmbrellaText>
      </View>

      <View style={styles.moduleList}>
        {modules.map((module, index) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            defaultExpanded={index === 0}
            onLessonPress={handleLessonPress}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {label}
      </UmbrellaText>
      <UmbrellaText variant="bodyMedium" color={emphasis ? Colors.light.primary : Colors.light.text}>
        {value}
      </UmbrellaText>
    </View>
  );
}

const styles = StyleSheet.create({
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caps: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outline,
  },
  ctaButton: {
    marginBottom: Spacing.sm,
  },
  ctaCaption: {
    textAlign: 'center',
  },
  overviewTitle: {
    marginBottom: Spacing.md,
  },
  overviewText: {
    marginBottom: Spacing.lg,
  },
  contentHeader: {
    gap: Spacing.xs,
  },
  moduleList: {
    gap: Spacing.lg,
  },
});