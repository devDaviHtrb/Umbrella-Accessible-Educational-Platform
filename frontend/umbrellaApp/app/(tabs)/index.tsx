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
import { useSchedule } from '@/hooks/api/schedule/useSchedule';
import { useCourses } from '@/hooks/api/courses/useCourse';
import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import type { AgendaEvent, ActiveModule } from '@/types/painel';

export default function PainelScreen() {
  const { userName, userId } = useAuthContext();
  const { getAllEvents, deleteEvent } = useSchedule();
  const { enrollmentedCourses, refetchEnrolledCourses } = useCourses();
  const { get } = useUmbrellaApi();
  
  const [todayAgenda, setTodayAgenda] = useState<AgendaEvent[]>([]);
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);
  const [isAtivosExpanded, setIsAtivosExpanded] = useState(true);
  const [isConcluidosExpanded, setIsConcluidosExpanded] = useState(false);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  const emAndamentoModules = activeModules.filter(m => m.progress < 100);
  const concluidosModules = activeModules.filter(m => m.progress === 100);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      async function loadTodayAgenda() {
        const data = await getAllEvents();
        const now = new Date();
        const todayStr = now.toDateString();

        const todayEvents = data.filter(e => {
          const eventDate = new Date(e.startTime);
          const isTodayOrFuture = eventDate.getTime() + 60000 >= now.getTime();
          return eventDate.toDateString() === todayStr && isTodayOrFuture;
        });

        todayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const mappedEvents: AgendaEvent[] = todayEvents.map(e => {
          const d = new Date(e.startTime);
          
          let state: 'past' | 'now' | 'upcoming' = 'upcoming';
          const diffMs = d.getTime() - now.getTime();
          const diffMins = diffMs / 60000;

          if (diffMins < -60) {
             state = 'past';
          } else if (diffMins >= -60 && diffMins <= 60) {
             state = 'now';
          } else {
             state = 'upcoming';
          }

          return {
            id: String(e.id),
            time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            title: e.title,
            location: e.description || e.type,
            state,
          };
        });

        setTodayAgenda(mappedEvents);
      }

      async function loadProgress() {
        try {
          setIsLoadingModules(true);
          // 1. Ensure enrolled courses are up-to-date
          await refetchEnrolledCourses();

          // 2. Load all submissions for this user
          let submissions: any[] = [];
          try {
             // Fake IDs for course/module/activity since backend ignores them for this endpoint
             submissions = await get<any[]>(`public/courses/1/modules/1/activities/1/submissions/users/${userId}`) || [];
          } catch (e) {
             console.log("Erro ao carregar submissoes do usuario", e);
          }
          
          const submittedActivityIds = new Set((Array.isArray(submissions) ? submissions : []).map(s => String(s.activityId)));

          // 3. For each course, find total activities and how many are in submittedActivityIds
          const newActiveModules = await Promise.all(enrollmentedCourses.map(async (course) => {
            let totalActivities = 0;
            let submittedCount = 0;

            try {
              const modules = await get<any[]>(`public/courses/${course.id}/modules`);
              const modulesArray = Array.isArray(modules) ? modules : [];

              for (const mod of modulesArray) {
                try {
                  const activities = await get<any[]>(`public/courses/modules/${mod.id}/activities`);
                  const activitiesArray = Array.isArray(activities) ? activities : [];
                  totalActivities += activitiesArray.length;
                  for (const act of activitiesArray) {
                    if (submittedActivityIds.has(String(act.id))) {
                      submittedCount++;
                    }
                  }
                } catch (e) {
                  console.log(`Erro ao carregar atividades do módulo ${mod.id}`, e);
                }
              }
            } catch (e) {
               console.log(`Erro ao carregar módulos do curso ${course.id}`, e);
            }

            const progress = totalActivities > 0 ? Math.round((submittedCount / totalActivities) * 100) : 0;

            return {
              id: course.id,
              icon: 'book.fill',
              statusLabel: progress === 100 ? 'Concluído' : (progress > 0 ? 'Em andamento' : 'Iniciante'),
              status: progress > 0 ? 'em-andamento' : 'nova-tarefa',
              title: course.title,
              description: course.description || 'Continue seu aprendizado.',
              progress: progress,
            } as ActiveModule;
          }));

          setActiveModules(newActiveModules);
        } catch (err) {
          console.error('Erro ao calcular progresso:', err);
        } finally {
          setIsLoadingModules(false);
        }
      }

      loadTodayAgenda();
      loadProgress();
    }, [userId, getAllEvents, get, enrollmentedCourses.length])
  );

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Bem-vindo de volta,{'\n'}{userName || 'Estudante'}</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Seu santuário acadêmico está pronto para os insights de hoje.
        </UmbrellaText>
      </View>

      <View style={styles.section}>
        <Pressable 
          style={styles.sectionHeaderPressable}
          onPress={() => setIsAtivosExpanded(!isAtivosExpanded)}
        >
          <UmbrellaText variant="headline" style={{ marginBottom: 0 }}>
            Cursos Ativos ({emAndamentoModules.length})
          </UmbrellaText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Pressable onPress={() => router.push('/courses')}>
              <UmbrellaText variant="label" color={Colors.light.primary}>
                Ver Currículo
              </UmbrellaText>
            </Pressable>
            <IconSymbol name={isAtivosExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
          </View>
        </Pressable>
        {isAtivosExpanded && (
          <View style={styles.moduleList}>
            {isLoadingModules && emAndamentoModules.length === 0 ? (
              <ActivityIndicator color={Colors.light.primary} style={{ width: '100%', marginVertical: Spacing.xl }} />
            ) : emAndamentoModules.length > 0 ? (
              emAndamentoModules.map((module) => (
                <Pressable 
                  key={module.id} 
                  style={styles.moduleCardWrapper}
                  onPress={() => router.push(`/courses/${module.id}`)}
                >
                  <ModuleCard module={module} />
                </Pressable>
              ))
            ) : (
              <UmbrellaText variant="body" color={Colors.light.textSecondary} style={{ width: '100%', textAlign: 'center', marginTop: Spacing.md }}>
                Você ainda não tem cursos em andamento.
              </UmbrellaText>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Pressable 
          style={styles.sectionHeaderPressable}
          onPress={() => setIsConcluidosExpanded(!isConcluidosExpanded)}
        >
          <UmbrellaText variant="headline" style={{ marginBottom: 0 }}>
            Cursos Concluídos ({concluidosModules.length})
          </UmbrellaText>
          <IconSymbol name={isConcluidosExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
        </Pressable>
        {isConcluidosExpanded && (
          <View style={styles.moduleList}>
            {isLoadingModules && concluidosModules.length === 0 ? (
              <ActivityIndicator color={Colors.light.primary} style={{ width: '100%', marginVertical: Spacing.xl }} />
            ) : concluidosModules.length > 0 ? (
              concluidosModules.map((module) => (
                <Pressable 
                  key={module.id} 
                  style={styles.moduleCardWrapper}
                  onPress={() => router.push(`/courses/${module.id}`)}
                >
                  <ModuleCard module={module} />
                </Pressable>
              ))
            ) : (
              <UmbrellaText variant="body" color={Colors.light.textSecondary} style={{ width: '100%', textAlign: 'center', marginTop: Spacing.md }}>
                Nenhum curso concluído ainda.
              </UmbrellaText>
            )}
          </View>
        )}
      </View>

      <Card>
        <Pressable 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}
          onPress={() => setIsEventsExpanded(!isEventsExpanded)}
        >
          <UmbrellaText variant="headline" style={{ marginBottom: 0 }}>
            Agenda de Hoje
          </UmbrellaText>
          <IconSymbol name={isEventsExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
        </Pressable>
        {isEventsExpanded && (
          todayAgenda.length > 0 ? (
            <AgendaTimeline 
              events={todayAgenda} 
              onDeleteEvent={async (id) => {
                await deleteEvent(id);
                setTodayAgenda(prev => prev.filter(e => e.id !== id));
              }}
            />
          ) : (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Nenhum evento agendado para hoje.
            </UmbrellaText>
          )
        )}
      </Card>
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
  sectionHeaderPressable: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  moduleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  moduleCardWrapper: {
    width: '48%', // Approximates 2 columns
  },
  agendaTitle: {
    marginBottom: Spacing.lg,
  },
});
