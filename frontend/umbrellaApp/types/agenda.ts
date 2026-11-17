import { EventType } from "./schedule";

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

export type NewReminderInput = {
  title: string;
  date: string;
  urgent: boolean;
  type?: EventType;
  description?: string;
};