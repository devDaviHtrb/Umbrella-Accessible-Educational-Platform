import { useEffect, useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSchedule } from '@/hooks/api/schedule/useSchedule';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useIaTutor } from '@/hooks/api/aiTutor/useIaTutor';
import { ActivityIndicator } from 'react-native';

import { AgendaEventCard } from '@/components/agenda/agenda-event-card';
import { EventDetails } from '@/components/agenda/event-details';
import NewReminderForm from '@/components/agenda/new-reminder-form';

import { WeekCalendarStrip } from '@/components/agenda/week-calendar-strip';
import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AgendaEvent, NewReminderInput, CalendarDay } from '@/types/agenda';
import { EventType, ScheduleGetRequestDto } from '@/types/schedule';

export default function AgendaScreen() {
  const { getAllEvents, createEvent, deleteEvent } = useSchedule();
  const { userId } = useAuthContext();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const [isReminderFormVisible, setReminderFormVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [events, setEvents] = useState<ScheduleGetRequestDto[]>([]);

  // Load events and reminders from backend on mount and every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      // Ensure we have a logged‑in user before fetching
      if (!userId) return;
      (async () => {
        const data = await getAllEvents();
        setEvents(data);
      })();
    }, [userId, getAllEvents])
  );

  const [weekOffset, setWeekOffset] = useState(0);

  // Helper to get the Monday of the currently viewed week
  const getMondayOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));
    return monday;
  };

  const currentMonday = getMondayOfWeek();
  const monthLabel = currentMonday.toLocaleString('pt-BR', { month: 'long' });
  const weekLabel = weekOffset === 0 
    ? 'Semana Atual' 
    : weekOffset < 0 
      ? `${Math.abs(weekOffset)} semana(s) atrás` 
      : `Daqui a ${weekOffset} semana(s)`;

  // Generate dynamic calendar data based on the selected week and events
  const generateCalendarDays = (): CalendarDay[] => {
    const monday = getMondayOfWeek();
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dayNumber = cur.getDate();
      const weekdayLabel = cur.toLocaleString('pt-BR', { weekday: 'short' });
      const hasEvent = events.some(e => new Date(e.startTime).toDateString() === cur.toDateString());
      days.push({ weekdayLabel, dayNumber, hasEvent });
    }
    return days;
  };
  
  // Calendar days for the currently viewed week
  const calendarDays = generateCalendarDays();
  // Selected day based on current index
  const selectedDay = calendarDays[selectedDayIndex];

  // Determine the exact date for the selected calendar day
  const selectedDate = (() => {
    const date = new Date(currentMonday);
    date.setDate(currentMonday.getDate() + selectedDayIndex);
    return date;
  })();

  // Events for the currently selected day (full date match and time not passed)
  const apiEventsForSelectedDay = selectedDay
    ? events.filter(e => {
        const eventDate = new Date(e.startTime);
        // Only show if it's on the selected date AND the time hasn't completely passed
        // (adding a small 1-minute buffer so it doesn't disappear the exact second it starts)
        const isTodayOrFuture = eventDate.getTime() + 60000 >= new Date().getTime();
        return eventDate.toDateString() === selectedDate.toDateString() && isTodayOrFuture;
      })
    : [];

  const eventsForSelectedDay: AgendaEvent[] = apiEventsForSelectedDay.map(e => {
    const d = new Date(e.startTime);
    return {
      id: String(e.id),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: e.title,
      subtitle: e.description || e.type,
      trailing: 'bell',
      accentColor: Colors.light.primary,
    };
  });

  // Reminders active for the selected day only


  // Create event by delegating to backend schedule service
  async function handleCreateReminder(input: NewReminderInput) {
    await createEvent({
      title: input.title,
      description: input.description,
      startTime: input.date,
      type: input.type || EventType.PERSONAL,
    });
    const refreshed = await getAllEvents();
    setEvents(refreshed);
    setReminderFormVisible(false);
  }

  

  const { startNewConversation, sendMessage } = useIaTutor();
  const [tutorTip, setTutorTip] = useState<string | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);



  const generateTip = async () => {
    setIsTipLoading(true);
    try {
      const chat = await startNewConversation(`Dica de Agenda: ${selectedDate.toLocaleDateString()}`);
      
      let eventsText = eventsForSelectedDay.length > 0 
        ? eventsForSelectedDay.map(e => `${e.time} - ${e.title}`).join(', ')
        : 'Nenhum evento agendado.';
        
      const prompt = `Minha agenda para o dia ${selectedDate.toLocaleDateString()} tem os seguintes eventos: ${eventsText}. Você pode me dar uma breve dica (máximo 2 frases) de como organizar meu tempo e meus estudos hoje?`;
      
      const reply = await sendMessage(chat.id, prompt);
      setTutorTip(reply.text);
    } catch (e) {
      setTutorTip("Não foi possível carregar a dica. Tente novamente.");
    } finally {
      setIsTipLoading(false);
    }
  };

  const [isEventsExpanded, setIsEventsExpanded] = useState(true);

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Minha Agenda</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Organize seus estudos e compromissos educacionais.
        </UmbrellaText>
      </View>

      <Card>
        <WeekCalendarStrip
          monthLabel={monthLabel}
          weekLabel={weekLabel}
          days={calendarDays}
          selectedIndex={selectedDayIndex}
          onSelectDay={(idx) => {
            setSelectedDayIndex(idx);
            setTutorTip(null);
          }}
          onPrevWeek={() => {
            setWeekOffset(prev => prev - 1);
            setTutorTip(null);
          }}
          onNextWeek={() => {
            setWeekOffset(prev => prev + 1);
            setTutorTip(null);
          }}
        />
      </Card>

      <Card>
        <Pressable 
          style={styles.sectionHeaderRow} 
          onPress={() => setIsEventsExpanded(!isEventsExpanded)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <UmbrellaText variant="headline">Horários de Hoje</UmbrellaText>
            <StatusBadge label={`${eventsForSelectedDay.length} EVENTOS`} tone="teal" />
          </View>
          <IconSymbol name={isEventsExpanded ? 'chevron.up' : 'chevron.down'} size={20} color={Colors.light.textSecondary} />
        </Pressable>

        {isEventsExpanded && (
          eventsForSelectedDay.length === 0 ? (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Nenhum evento para este dia.
            </UmbrellaText>
          ) : (
            <View style={styles.eventList}>
              {eventsForSelectedDay.map((event: AgendaEvent) => (
                <AgendaEventCard 
                  key={event.id} 
                  event={event} 
                  onPress={() => setSelectedEvent(event)} 
                  onDelete={async () => {
                    await deleteEvent(event.id);
                    const refreshed = await getAllEvents();
                    setEvents(refreshed);
                  }}
                />
              ))}
            </View>
          )
        )}
      </Card>

      <View style={styles.newReminderCard}>
        <View style={styles.newReminderIcon}>
          <IconSymbol name="checkmark.circle.fill" size={24} color={Colors.light.surface} />
        </View>
        <UmbrellaText variant="headline" color={Colors.light.surface}>
          Novo Lembrete
        </UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.surface} style={styles.newReminderSubtitle}>
          Agende uma nova aula ou tarefa de estudo.
        </UmbrellaText>
        <SecondaryButton
          variant="onDark"
          label="Adicionar Agora"
          style={styles.newReminderButton}
          onPress={() => setReminderFormVisible(true)}
        />
      </View>




      <View style={styles.tutorTipCard}>
        <View style={styles.tutorTipHeader}>
          <IconSymbol name="lightbulb.fill" size={18} color={Colors.light.surface} />
          <UmbrellaText variant="bodyMedium" color={Colors.light.surface}>
            Dica do Tutor IA
          </UmbrellaText>
        </View>
        
        {isTipLoading ? (
          <ActivityIndicator color={Colors.light.surface} style={{ alignSelf: 'flex-start', marginVertical: Spacing.sm }} />
        ) : (
          <UmbrellaText variant="body" color={Colors.light.surface} style={styles.tutorTipText}>
            {tutorTip || 'Clique no botão para receber uma dica de como organizar sua agenda do dia.'}
          </UmbrellaText>
        )}

        <Pressable 
          accessibilityRole="button" 
          style={styles.tutorTipAction}
          onPress={generateTip}
          disabled={isTipLoading}
        >
          <IconSymbol name="sparkles" size={18} color={Colors.light.surface} />
        </Pressable>
      </View>

      <ModalSheet
        visible={isReminderFormVisible}
        onClose={() => setReminderFormVisible(false)}
        title="Novo Lembrete"
      >
        <NewReminderForm onSubmit={handleCreateReminder} />
      </ModalSheet>

      <ModalSheet
        visible={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Detalhes do Evento"
      >
        {selectedEvent ? <EventDetails event={selectedEvent} /> : null}
      </ModalSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eventList: {
    gap: Spacing.lg,
  },
  newReminderCard: {
    backgroundColor: Colors.light.primaryStrong,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  newReminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  newReminderSubtitle: {
    textAlign: 'center',
    opacity: 0.85,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  newReminderButton: {
    alignSelf: 'stretch',
  },
  remindersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  reminderList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noReminders: {
    marginBottom: Spacing.lg,
  },
  viewAllButton: {
    alignItems: 'center',
  },
  tutorTipCard: {
    backgroundColor: Colors.light.tertiary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  tutorTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tutorTipText: {
    opacity: 0.9,
    paddingRight: Spacing.xxxl,
  },
  tutorTipAction: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});