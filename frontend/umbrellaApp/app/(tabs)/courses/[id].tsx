import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';

import { CourseHero } from '@/components/courses/course-hero';
import { ModuleAccordion } from '@/components/courses/module-accordion';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { useCourseDetails, useCourses } from '@/hooks/api/courses/useCourse';
import type { ActivityDto } from '@/types/activities';
import { openMaterial } from '@/utils/open-material';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isEnrolled, createEnrollment, deleteEnrollment } = useCourses();
  const { courseDetails, modules, detailLoading, detailError } = useCourseDetails(id);
  const [enrolling, setEnrolling] = useState(false);
  const { translate } = usePreferences();

  const enrolled = id ? isEnrolled(id) : false;

  const handleEnrollmentToggle = async () => {
    if (!id) return;
    setEnrolling(true);
    try {
      const response = enrolled ? await deleteEnrollment(id) : await createEnrollment(id);
      if ('code' in response && response.code >= 400) {
        Alert.alert('Erro', response.message || (enrolled ? 'Erro ao cancelar matrícula.' : 'Erro ao realizar matrícula.'));
      } else {
        Alert.alert('Sucesso', enrolled ? 'Matrícula cancelada com sucesso!' : 'Matrícula realizada com sucesso!');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao processar a matrícula.');
    } finally {
      setEnrolling(false);
    }
  };

  function handleActivityPress(activity: ActivityDto) {
    router.push({
      pathname: '/courses/activity/[activityId]' as any,
      params: {
        courseId: id,
        moduleId: activity.moduleId,
        activityId: activity.id,
      },
    });
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
      <CourseHero
        title={courseDetails.name}
        badgeLabel={courseDetails.subject?.name ?? 'Geral'}
        imageUrl={courseDetails.imageUrl ?? undefined}
      />

      <Card>
        <View style={styles.instructorRow}>
          <Avatar name={courseDetails.userDto?.name ?? 'Instrutor'} size={44} />
          <View style={styles.instructorInfo}>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.caps}>
              Instrutor
            </UmbrellaText>
            <UmbrellaText variant="bodyMedium">
              {courseDetails.userDto?.name ?? 'Instrutor Umbrella'}
            </UmbrellaText>
          </View>
          <View style={styles.levelChip}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              Nível {courseDetails.difficulty_level ?? 1}
            </UmbrellaText>
          </View>
        </View>

        <PrimaryButton
          label={enrolling ? 'Processando...' : enrolled ? 'Desfazer Matrícula' : 'Inscrever-se no Curso'}
          onPress={handleEnrollmentToggle}
          disabled={enrolling}
          style={[styles.ctaButton, enrolled && { backgroundColor: translate(Colors.light.error) }]}
        />
        {enrolled ? (
          <SecondaryButton
            label="Conversa do curso"
            onPress={() =>
              router.push({ pathname: '/courses/chat', params: { kind: 'course', id, title: courseDetails.name } })
            }
          />
        ) : null}
      </Card>

      {courseDetails.description ? (
        <Card tone="muted">
          <UmbrellaText variant="headline" style={styles.overviewTitle}>
            Sobre o curso
          </UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            {courseDetails.description}
          </UmbrellaText>
        </Card>
      ) : null}

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
            courseId={id}
            defaultExpanded={index === 0}
            isEnrolled={enrolled}
            onActivityPress={handleActivityPress}
            onMaterialPress={openMaterial}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructorInfo: {
    flex: 1,
  },
  levelChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.secondaryFixed,
  },
  caps: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  ctaButton: {
    marginBottom: Spacing.sm,
  },
  overviewTitle: {
    marginBottom: Spacing.md,
  },
  contentHeader: {
    gap: Spacing.xs,
  },
  moduleList: {
    gap: Spacing.lg,
  },
});