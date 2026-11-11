import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';

import { ModuleMaterialGrid } from '@/components/courses/module-material-grid';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useActivity, useModuleActivities } from '@/hooks/api/activities/useActivity';
import { useModuleMaterials } from '@/hooks/api/storage/useModuleMaterials';
import type { CourseModule } from '@/types/courses';
import type { ActivityDto } from '@/types/activities';
import type { ModuleMaterial } from '@/types/materials';

export type ModuleAccordionProps = {
  module: CourseModule;
  courseId: string;
  defaultExpanded?: boolean;
  isEnrolled?: boolean;
  onActivityPress?: (activity: ActivityDto) => void;
  onMaterialPress?: (material: ModuleMaterial) => void;
};

export function ModuleAccordion({
  module,
  defaultExpanded = false,
  isEnrolled = false,
  onActivityPress,
  onMaterialPress,
  courseId,
}: ModuleAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { activities, loading: activitiesLoading } = useModuleActivities(module.id);
  const { materials, loading: materialsLoading } = useModuleMaterials(module.id);
  const { getLatestScore } = useActivity();

  const [scores, setScores] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (activities.length === 0) return;
    const fetchScores = async () => {
      const newScores: Record<string, number | null> = {};
      for (const act of activities) {
        const score = await getLatestScore(courseId, module.id, act.id);
        newScores[act.id] = score;
      }
      setScores(newScores);
    };
    fetchScores();
  }, [activities, courseId, module.id, getLatestScore]);

  return (
    <Card padded={false} style={expanded ? styles.cardExpanded : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.header}>
        <View style={[styles.numberBadge, expanded && styles.numberBadgeActive]}>
          <UmbrellaText variant="label" color={expanded ? Colors.light.surface : Colors.light.text}>
            {module.number}
          </UmbrellaText>
        </View>

        <View style={styles.headerText}>
          <UmbrellaText variant="bodyMedium" color={expanded ? Colors.light.primary : Colors.light.text}>
            {module.title}
          </UmbrellaText>
        </View>

        <IconSymbol
          name={expanded ? 'chevron.up' : 'chevron.down'}
          size={18}
          color={Colors.light.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          {!isEnrolled ? (
            <View style={styles.lockedContainer}>
              <View style={styles.lockedIconWrapper}>
                <IconSymbol name="lock.fill" size={24} color={Colors.light.textSecondary} />
              </View>
              <UmbrellaText variant="bodyMedium" color={Colors.light.text} style={styles.lockedTitle}>
                Conteúdo exclusivo para matriculados
              </UmbrellaText>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.lockedText}>
                Inscreva-se no curso para ter acesso a todas as aulas, atividades e materiais complementares deste módulo.
              </UmbrellaText>
            </View>
          ) : (
            <>
              <UmbrellaText variant="label" color={Colors.light.primary} style={styles.sectionTitle}>
                MATERIAIS {materials.length > 0 ? `(${materials.length})` : ''}
              </UmbrellaText>
              {materialsLoading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: Spacing.md }} />
              ) : (
                <ModuleMaterialGrid materials={materials} onMaterialPress={onMaterialPress} />
              )}
            </>
          )}

          {isEnrolled ? (
            <View style={styles.activitiesSection}>
              <View style={styles.sectionDivider} />
              <UmbrellaText variant="label" color={Colors.light.primary} style={styles.activitiesHeaderTitle}>
                ATIVIDADES DO MÓDULO
              </UmbrellaText>

              {activitiesLoading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: Spacing.sm }} />
              ) : activities.length === 0 ? (
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  Nenhuma atividade cadastrada neste módulo.
                </UmbrellaText>
              ) : (
                activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    accessibilityRole="button"
                    style={styles.activityItem}
                    onPress={() => onActivityPress?.(activity)}>
                    <View style={styles.activityIcon}>
                      <IconSymbol name="pencil.and.outline" size={16} color={Colors.light.primary} />
                    </View>
                    <View style={styles.activityText}>
                      <UmbrellaText variant="bodyMedium">{activity.title}{scores[activity.id] != null ? ` – Nota: ${scores[activity.id]}/${activity.maxScore || 0}` : ''}</UmbrellaText>
                      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                        {activity.questions?.length || 0} {activity.questions?.length === 1 ? 'questão' : 'questões'} • Max {activity.maxScore || 0} pts
                      </UmbrellaText>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={Colors.light.textSecondary} />
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardExpanded: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeActive: {
    backgroundColor: Colors.light.primary,
  },
  headerText: {
    flex: 1,
  },
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  lockedContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  lockedIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  lockedTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  activitiesSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.light.outline,
    marginVertical: Spacing.xs,
  },
  activitiesHeaderTitle: {
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
});