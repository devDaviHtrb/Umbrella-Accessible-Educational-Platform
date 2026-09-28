import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AgendaEventCard } from '@/components/agenda/agenda-event-card';
import { EventDetails } from '@/components/agenda/event-details';
import { NewReminderForm } from '@/components/agenda/new-reminder-form';
import { ReminderCard } from '@/components/agenda/reminder-card';
import { WeekCalendarStrip } from '@/components/agenda/week-calendar-strip';
import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import {
  mockActiveReminders,
  mockCalendarDays,
  mockDefaultSelectedDayIndex,
  mockEventsByDay,
  mockMonthLabel,
  mockTutorTip,
  mockWeekLabel,
} from '@/constants/mock/agenda';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ActiveReminder, AgendaEvent, NewReminderInput } from '@/types/agenda';

export default function AgendaScreen() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(mockDefaultSelectedDayIndex);
  const [reminders, setReminders] = useState<ActiveReminder[]>(mockActiveReminders);
  const [isReminderFormVisible, setReminderFormVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const selectedDay = mockCalendarDays[selectedDayIndex];
  const eventsForSelectedDay = mockEventsByDay[selectedDay.dayNumber] ?? [];

  function handleCreateReminder(input: NewReminderInput) {
    const newReminder: ActiveReminder = {
      id: `reminder-${Date.now()}`,
      icon: input.urgent ? 'exclamationmark.circle.fill' : 'book.fill',
      iconTone: input.urgent ? 'error' : 'primary',
      title: input.title,
      dueLabel: input.dueLabel,
      urgent: input.urgent,
    };
    setReminders((prev) => [newReminder, ...prev]);
    setReminderFormVisible(false);
  }

  function handleCompleteReminder(id: string) {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, completed: true } : reminder)),
    );
  }

  function handleDeleteReminder(id: string) {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  }

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
          monthLabel={mockMonthLabel}
          weekLabel={mockWeekLabel}
          days={mockCalendarDays}
          selectedIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
        />
      </Card>

      <Card>
        <View style={styles.sectionHeaderRow}>
          <UmbrellaText variant="headline">Horários de Hoje</UmbrellaText>
          <StatusBadge label={`${eventsForSelectedDay.length} EVENTOS`} tone="teal" />
        </View>

        {eventsForSelectedDay.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhum evento para este dia.
          </UmbrellaText>
        ) : (
          <View style={styles.eventList}>
            {eventsForSelectedDay.map((event) => (
              <AgendaEventCard key={event.id} event={event} onPress={() => setSelectedEvent(event)} />
            ))}
          </View>
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

      <Card tone="muted">
        <View style={styles.remindersHeaderRow}>
          <IconSymbol name="alarm.fill" size={18} color={Colors.light.text} />
          <UmbrellaText variant="headline">Lembretes Ativos</UmbrellaText>
        </View>

        {reminders.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.noReminders}>
            Nenhum lembrete ativo no momento.
          </UmbrellaText>
        ) : (
          <View style={styles.reminderList}>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={() => handleCompleteReminder(reminder.id)}
                onDelete={() => handleDeleteReminder(reminder.id)}
              />
            ))}
          </View>
        )}

        <Pressable accessibilityRole="button" style={styles.viewAllButton}>
          <UmbrellaText variant="label" color={Colors.light.primary}>
            Ver todos os lembretes
          </UmbrellaText>
        </Pressable>
      </Card>

      <View style={styles.tutorTipCard}>
        <View style={styles.tutorTipHeader}>
          <IconSymbol name="lightbulb.fill" size={18} color={Colors.light.surface} />
          <UmbrellaText variant="bodyMedium" color={Colors.light.surface}>
            Dica do Tutor IA
          </UmbrellaText>
        </View>
        <UmbrellaText variant="body" color={Colors.light.surface} style={styles.tutorTipText}>
          {mockTutorTip}
        </UmbrellaText>
        <Pressable accessibilityRole="button" style={styles.tutorTipAction}>
          <IconSymbol name="calendar.badge.plus" size={18} color={Colors.light.surface} />
        </Pressable>
      </View>

      <ModalSheet
        visible={isReminderFormVisible}
        onClose={() => setReminderFormVisible(false)}
        title="Novo Lembrete">
        <NewReminderForm onSubmit={handleCreateReminder} />
      </ModalSheet>

      <ModalSheet
        visible={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Detalhes do Evento">
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