import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';

import { CourseHero } from '@/components/courses/course-hero';
import { ModuleAccordion } from '@/components/courses/module-accordion';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
          <View style={styles.avatar}>
            <IconSymbol name="person.fill" size={20} color={Colors.light.textSecondary} />
          </View>
          <View>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.caps}>
              Instrutor
            </UmbrellaText>
            <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
              {courseDetails.userDto?.name ?? 'Instrutor Umbrella'}
            </UmbrellaText>
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoRow label="Nível" value={`Nível ${courseDetails.difficulty_level ?? 'Iniciante'}`} />
        </View>

        <PrimaryButton
          label={enrolling ? 'Processando...' : enrolled ? 'Desfazer Matrícula' : 'Inscrever-se no Curso'}
          onPress={handleEnrollmentToggle}
          disabled={enrolling}
          style={[styles.ctaButton, enrolled && { backgroundColor: translate(Colors.light.error) }]}
        />
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.ctaCaption}>
          {enrolled ? 'Você está matriculado neste curso' : 'Acesso imediato e vitalício ao conteúdo'}
        </UmbrellaText>
        {enrolled ? (
          <SecondaryButton
            label="Conversa do curso"
            onPress={() =>
              router.push({ pathname: '/courses/chat', params: { kind: 'course', id, title: courseDetails.name } })
            }
          />
        ) : null}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {label}
      </UmbrellaText>
      <UmbrellaText variant="bodyMedium" color={Colors.light.text}>
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