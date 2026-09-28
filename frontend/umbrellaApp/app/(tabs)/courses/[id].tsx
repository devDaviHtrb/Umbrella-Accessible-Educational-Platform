import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CourseHero } from '@/components/courses/course-hero';
import { ModuleAccordion } from '@/components/courses/module-accordion';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { mockCourseDetails, mockCourses } from '@/constants/mock/courses';
import type { CourseLesson } from '@/types/courses';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = mockCourses.find((item) => item.id === id);
  const details = mockCourseDetails;

  function handleLessonPress(lesson: CourseLesson) {
    router.push(`/courses/class/${lesson.id}`);
  }

  if (!course) {
    return (
      <ScreenContainer disableTopInset>
        <UmbrellaText variant="title">Curso não encontrado</UmbrellaText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer disableTopInset>
      <CourseHero title={course.title} badgeLabel={details.heroBadge} />

      <Card>
        <View style={styles.instructorRow}>
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={20} color={Colors.light.textSecondary} />
          </View>
          <View>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.caps}>
              {details.instructorLabel}
            </UmbrellaText>
            <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
              {details.instructorName}
            </UmbrellaText>
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoRow label="Duração" value={details.duration} />
          <InfoRow label="Nível" value={details.level} />
          <InfoRow label="Certificação" value={details.certification} emphasis />
        </View>

        <PrimaryButton label={details.ctaLabel} onPress={() => {}} style={styles.ctaButton} />
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.ctaCaption}>
          {details.ctaCaption}
        </UmbrellaText>
      </Card>

      <Card tone="muted">
        <UmbrellaText variant="headline" style={styles.overviewTitle}>
          Visão Geral
        </UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.overviewText}>
          {details.overviewText}
        </UmbrellaText>

        <View style={styles.resourceList}>
          {details.overviewResources.map((resource) => (
            <View key={resource.id} style={styles.resourceRow}>
              <IconSymbol name={resource.icon} size={18} color={Colors.light.primary} />
              <View>
                <UmbrellaText variant="bodyMedium">{resource.title}</UmbrellaText>
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  {resource.subtitle}
                </UmbrellaText>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.contentHeader}>
        <UmbrellaText variant="title">Conteúdo do Curso</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          {details.contentSubtitle}
        </UmbrellaText>
      </View>

      <View style={styles.moduleList}>
        {details.modules.map((module, index) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            defaultExpanded={index === 1}
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
  resourceList: {
    gap: Spacing.md,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  contentHeader: {
    gap: Spacing.xs,
  },
  moduleList: {
    gap: Spacing.lg,
  },
});