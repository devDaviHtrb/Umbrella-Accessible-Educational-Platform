import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';

import { ResourceListItem } from '@/components/courses/resource-list-item';
import { ModuleMaterialGrid } from '@/components/courses/module-material-grid';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useModuleActivities, useActivity } from '@/hooks/api/activities/useActivity';
import { useModuleMaterials } from '@/hooks/api/storage/useModuleMaterials';
import type { CourseModule, CourseLesson } from '@/types/courses';
import type { ActivityDto } from '@/types/activities';
import type { ModuleMaterial } from '@/types/materials';

export type ModuleAccordionProps = {
  module: CourseModule;
  courseId: string; // needed to fetch activity scores
  defaultExpanded?: boolean;
  isEnrolled?: boolean;
  onLessonPress?: (lesson: CourseLesson) => void;
  onActivityPress?: (activity: ActivityDto) => void;
  onMaterialPress?: (material: ModuleMaterial) => void;
};

export function ModuleAccordion({
  module,
  defaultExpanded = false,
  isEnrolled = false,
  onLessonPress,
  onActivityPress,
  onMaterialPress,
  courseId,
}: ModuleAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'lessons' | 'materials'>('lessons');
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
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {module.subtitle}
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
              <View style={styles.tabContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aba de Aulas"
                  onPress={() => setActiveTab('lessons')}
                  style={[styles.tabButton, activeTab === 'lessons' && styles.tabButtonActive]}>
                  <IconSymbol
                    name="play.circle.fill"
                    size={16}
                    color={activeTab === 'lessons' ? Colors.light.primary : Colors.light.textSecondary}
                  />
                  <UmbrellaText
                    variant="bodyMedium"
                    color={activeTab === 'lessons' ? Colors.light.primary : Colors.light.textSecondary}
                    style={activeTab === 'lessons' ? styles.tabTextActive : styles.tabText}>
                    Aulas {module.lessons.length > 0 ? `(${module.lessons.length})` : ''}
                  </UmbrellaText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Aba de Materiais"
                  onPress={() => setActiveTab('materials')}
                  style={[styles.tabButton, activeTab === 'materials' && styles.tabButtonActive]}>
                  <IconSymbol
                    name="folder.fill"
                    size={16}
                    color={activeTab === 'materials' ? Colors.light.primary : Colors.light.textSecondary}
                  />
                  <UmbrellaText
                    variant="bodyMedium"
                    color={activeTab === 'materials' ? Colors.light.primary : Colors.light.textSecondary}
                    style={activeTab === 'materials' ? styles.tabTextActive : styles.tabText}>
                    Materiais {materials.length > 0 ? `(${materials.length})` : ''}
                  </UmbrellaText>
                </Pressable>
              </View>

              {activeTab === 'lessons' ? (
                module.lessons.length > 0 ? (
                  <View style={styles.lessons}>
                    {module.lessons.map((lesson) => (
                      <ResourceListItem
                        key={lesson.id}
                        lesson={lesson}
                        onPress={() => onLessonPress?.(lesson)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyTabContent}>
                    <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                      Nenhuma aula cadastrada neste módulo.
                    </UmbrellaText>
                  </View>
                )
              ) : (
                materialsLoading ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: Spacing.md }} />
                ) : (
                  <ModuleMaterialGrid materials={materials} onMaterialPress={onMaterialPress} />
                )
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.sm,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.light.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  tabText: {
    fontWeight: '500',
    fontSize: 13,
  },
  tabTextActive: {
    fontWeight: '700',
    fontSize: 13,
  },
  emptyTabContent: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessons: {
    gap: Spacing.xs,
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