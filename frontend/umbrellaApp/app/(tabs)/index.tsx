import { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { AgendaTimeline } from '@/components/painel/agenda-timeline';
import { ModuleCard } from '@/components/painel/module-card';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { useSchedule } from '@/hooks/api/schedule/useSchedule';
import { useActivity } from '@/hooks/api/activities/useActivity';
import { useCourses } from '@/hooks/api/courses/useCourse';
import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import type { AgendaEvent, ActiveModule } from '@/types/painel';

export default function PainelScreen() {
  const { userName, userId } = useAuthContext();
  const { preferences } = usePreferences();
  const { getAllEvents, deleteEvent } = useSchedule();
  const { refetchEnrolledCourses } = useCourses();
  const { getActivitiesByModuleId, getSubmissionsByUserId } = useActivity();
  const { get } = useUmbrellaApi();

  const [todayAgenda, setTodayAgenda] = useState<AgendaEvent[]>([]);
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);
  const [isAtivosExpanded, setIsAtivosExpanded] = useState(true);
  const [isConcluidosExpanded, setIsConcluidosExpanded] = useState(false);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  // A course is only "concluded" when it has activities and all of them were
  // submitted. Courses without activities, or with pending work, stay active —
  // so a freshly enrolled course always shows up under "Cursos Ativos".
  const concluidosModules = activeModules.filter((m) => m.hasActivities && m.progress === 100);
  const emAndamentoModules = activeModules.filter((m) => !(m.hasActivities && m.progress === 100));

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      async function loadTodayAgenda() {
        let data: Awaited<ReturnType<typeof getAllEvents>>;
        try {
          data = await getAllEvents();
        } catch {
          return;
        }

        const now = new Date();
        const todayEvents = data
          .filter((e) => {
            const eventDate = new Date(e.startTime);
            return eventDate.toDateString() === now.toDateString() && eventDate.getTime() + 60000 >= now.getTime();
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        setTodayAgenda(
          todayEvents.map((e): AgendaEvent => {
            const start = new Date(e.startTime);
            const diffMins = (start.getTime() - now.getTime()) / 60000;

            return {
              id: String(e.id),
              time: start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              title: e.title,
              location: e.description || e.type,
              state: diffMins < -60 ? 'past' : diffMins <= 60 ? 'now' : 'upcoming',
            };
          }),
        );
      }

      async function calculateProgress(courseId: string): Promise<{ progress: number; totalActivities: number }> {
        let totalActivities = 0;
        let submittedCount = 0;

        try {
          const modules = await get<any[]>(`public/courses/${courseId}/modules`);
          for (const mod of Array.isArray(modules) ? modules : []) {
            const activities = await getActivitiesByModuleId(mod.id);
            const submissions = await Promise.all(
              activities.map((activity) => getSubmissionsByUserId(courseId, mod.id, activity.id)),
            );
            totalActivities += activities.length;
            submittedCount += submissions.filter((items) => items.length > 0).length;
          }
        } catch (e) {
          console.log(`Erro ao carregar módulos do curso ${courseId}`, e);
        }

        const progress = totalActivities > 0 ? Math.round((submittedCount / totalActivities) * 100) : 0;
        return { progress, totalActivities };
      }

      async function loadProgress() {
        try {
          setIsLoadingModules(true);
          const enrolledCourses = await refetchEnrolledCourses();

          const modules = await Promise.all(
            enrolledCourses.map(async (course): Promise<ActiveModule> => {
              const { progress, totalActivities } = await calculateProgress(course.id);
              const hasActivities = totalActivities > 0;
              const concluded = hasActivities && progress === 100;

              return {
                id: course.id,
                icon: 'book.fill',
                statusLabel: concluded ? 'Concluído' : progress > 0 ? 'Em andamento' : 'Iniciante',
                status: progress > 0 ? 'em-andamento' : 'nova-tarefa',
                title: course.title,
                description: course.description || 'Continue seu aprendizado.',
                progress,
                hasActivities,
              };
            }),
          );

          setActiveModules(modules);
        } catch (err) {
          console.error('Erro ao calcular progresso:', err);
        } finally {
          setIsLoadingModules(false);
        }
      }

      loadTodayAgenda();
      loadProgress();
    }, [userId, getAllEvents, get, refetchEnrolledCourses, getActivitiesByModuleId, getSubmissionsByUserId]),
  );

  function renderModules(modules: ActiveModule[], emptyMessage: string) {
    if (isLoadingModules && modules.length === 0) {
      return <ActivityIndicator color={Colors.light.primary} style={styles.loader} />;
    }
    if (modules.length === 0) {
      return (
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.emptyText}>
          {emptyMessage}
        </UmbrellaText>
      );
    }
    return modules.map((module) => (
      <Pressable key={module.id} style={styles.moduleCardWrapper} onPress={() => router.push(`/courses/${module.id}`)}>
        <ModuleCard module={module} />
      </Pressable>
    ));
  }

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Bem-vindo de volta,{'\n'}{userName || 'Estudante'}</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Seu santuário acadêmico está pronto para os insights de hoje.
        </UmbrellaText>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.sectionHeader} onPress={() => setIsAtivosExpanded(!isAtivosExpanded)}>
          <UmbrellaText variant="headline">Cursos Ativos ({emAndamentoModules.length})</UmbrellaText>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/courses')}>
              <UmbrellaText variant="label" color={Colors.light.primary}>
                Ver Currículo
              </UmbrellaText>
            </Pressable>
            <IconSymbol name={isAtivosExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
          </View>
        </Pressable>
        {isAtivosExpanded && (
          <View style={styles.moduleList}>{renderModules(emAndamentoModules, 'Você ainda não tem cursos em andamento.')}</View>
        )}
      </View>

      {!preferences.focusMode && (
        <View style={styles.section}>
          <Pressable style={styles.sectionHeader} onPress={() => setIsConcluidosExpanded(!isConcluidosExpanded)}>
            <UmbrellaText variant="headline">Cursos Concluídos ({concluidosModules.length})</UmbrellaText>
            <IconSymbol name={isConcluidosExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
          </Pressable>
          {isConcluidosExpanded && (
            <View style={styles.moduleList}>{renderModules(concluidosModules, 'Nenhum curso concluído ainda.')}</View>
          )}
        </View>
      )}

      {!preferences.focusMode && (
        <Card>
          <Pressable style={[styles.sectionHeader, styles.agendaHeader]} onPress={() => setIsEventsExpanded(!isEventsExpanded)}>
            <UmbrellaText variant="headline">Agenda de Hoje</UmbrellaText>
            <IconSymbol name={isEventsExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
          </Pressable>
          {isEventsExpanded &&
            (todayAgenda.length > 0 ? (
              <AgendaTimeline
                events={todayAgenda}
                onDeleteEvent={async (id) => {
                  await deleteEvent(id);
                  setTodayAgenda((prev) => prev.filter((e) => e.id !== id));
                }}
              />
            ) : (
              <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                Nenhum evento agendado para hoje.
              </UmbrellaText>
            ))}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  agendaHeader: {
    marginBottom: Spacing.lg,
  },
  moduleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  moduleCardWrapper: {
    width: '48%',
  },
  loader: {
    width: '100%',
    marginVertical: Spacing.xl,
  },
  emptyText: {
    width: '100%',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
