import { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { AgendaTimeline } from '@/components/painel/agenda-timeline';
import { ModuleCard } from '@/components/painel/module-card';
import { WeeklyGoalsCard } from '@/components/painel/weekly-goals-card';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { mockActiveModules, mockWeeklyGoals } from '@/constants/mock/painel';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useSchedule } from '@/hooks/api/schedule/useSchedule';
import type { AgendaEvent } from '@/types/painel';

export default function PainelScreen() {
  const { userName, userId } = useAuthContext();
  const { getAllEvents, deleteEvent } = useSchedule();
  const [todayAgenda, setTodayAgenda] = useState<AgendaEvent[]>([]);
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      async function loadTodayAgenda() {
        const data = await getAllEvents();
        const now = new Date();
        const todayStr = now.toDateString();

        // Filter events that happen today and haven't expired
        const todayEvents = data.filter(e => {
          const eventDate = new Date(e.startTime);
          const isTodayOrFuture = eventDate.getTime() + 60000 >= now.getTime();
          return eventDate.toDateString() === todayStr && isTodayOrFuture;
        });

        // Sort chronologically
        todayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // Map to AgendaEvent for the timeline
        const mappedEvents: AgendaEvent[] = todayEvents.map(e => {
          const d = new Date(e.startTime);
          
          let state: 'past' | 'now' | 'upcoming' = 'upcoming';
          const diffMs = d.getTime() - now.getTime();
          const diffMins = diffMs / 60000;

          if (diffMins < -60) {
             state = 'past';
          } else if (diffMins >= -60 && diffMins <= 60) {
             state = 'now'; // Close to current time
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

      loadTodayAgenda();
    }, [userId, getAllEvents])
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
        <SectionHeader title="Módulos Ativos" actionLabel="Ver Currículo" />
        <View style={styles.moduleList}>
          {mockActiveModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </View>
      </View>

      <WeeklyGoalsCard goals={mockWeeklyGoals} />

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
    gap: Spacing.lg,
  },
  moduleList: {
    gap: Spacing.lg,
  },
  agendaTitle: {
    marginBottom: Spacing.lg,
  },
});
