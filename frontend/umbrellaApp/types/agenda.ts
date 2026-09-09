export type CalendarDay = {
  weekdayLabel: string;
  dayNumber: number;
  hasEvent: boolean;
};

export type AgendaEventTrailing = 'bell' | 'ellipsis';

export type AgendaEvent = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  trailing: AgendaEventTrailing;
  accentColor?: string;
  participantCount?: number;
};

export type ActiveReminder = {
  id: string;
  icon: 'exclamationmark.circle.fill' | 'book.fill';
  iconTone: 'error' | 'primary';
  title: string;
  dueLabel: string;
  urgent?: boolean;
  completed?: boolean;
};

export type NewReminderInput = {
  title: string;
  dueLabel: string;
  urgent: boolean;
};