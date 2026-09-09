import type { ActiveReminder, AgendaEvent, CalendarDay } from '@/types/agenda';

export const mockMonthLabel = 'Agosto 2026';
export const mockWeekLabel = 'Semana -';

export const mockCalendarDays: CalendarDay[] = [
  { weekdayLabel: 'SEG', dayNumber: 11, hasEvent: false },
  { weekdayLabel: 'TER', dayNumber: 12, hasEvent: true },
  { weekdayLabel: 'QUA', dayNumber: 13, hasEvent: true },
  { weekdayLabel: 'QUI', dayNumber: 14, hasEvent: true },
  { weekdayLabel: 'SEX', dayNumber: 15, hasEvent: false },
  { weekdayLabel: 'SÁB', dayNumber: 16, hasEvent: false },
  { weekdayLabel: 'DOM', dayNumber: 17, hasEvent: false },
];

export const mockDefaultSelectedDayIndex = 2;

export const mockEventsByDay: Record<number, AgendaEvent[]> = {
  11: [
    {
      id: 'seg-revisao-semanal',
      time: '10:00',
      title: 'Revisão Semanal',
      subtitle: 'Individual • Biblioteca',
      trailing: 'bell',
    },
  ],
  12: [
    {
      id: 'ter-lab-fisica',
      time: '08:30',
      title: 'Laboratório de Física',
      subtitle: 'Bloco C, Sala 12',
      trailing: 'bell',
    },
    {
      id: 'ter-mentoria-carreira',
      time: '16:00',
      title: 'Mentoria de Carreira',
      subtitle: 'Sala Virtual 02',
      trailing: 'ellipsis',
    },
  ],
  13: [
    {
      id: 'calculo-avancado-ii',
      time: '09:00',
      title: 'Cálculo Avançado II',
      subtitle: 'Sala Virtual 04 • Prof. Ricardo',
      trailing: 'bell',
      participantCount: 14,
    },
    {
      id: 'sessao-ai-tutor',
      time: '14:30',
      title: 'Sessão com AI Tutor',
      subtitle: 'Tópico: Estruturas de Dados Dinâmicas',
      trailing: 'bell',
      accentColor: '#0B4F4A',
    },
    {
      id: 'grupo-estudos-ia',
      time: '19:00',
      title: 'Grupo de Estudos: IA',
      subtitle: 'Presencial • Biblioteca Central',
      trailing: 'ellipsis',
    },
  ],
  14: [
    {
      id: 'qui-seminario-pesquisa',
      time: '11:00',
      title: 'Seminário de Pesquisa',
      subtitle: 'Auditório Principal',
      trailing: 'bell',
    },
  ],
  15: [],
  16: [],
  17: [],
};

export const mockActiveReminders: ActiveReminder[] = [
  {
    id: 'entrega-projeto-final',
    icon: 'exclamationmark.circle.fill',
    iconTone: 'error',
    title: 'Entrega: Projeto Final',
    dueLabel: 'Em 2 dias',
    urgent: true,
  },
  {
    id: 'revisar-capitulo-4',
    icon: 'book.fill',
    iconTone: 'primary',
    title: 'Revisar Capítulo 4',
    dueLabel: 'Amanhã, 10:00',
  },
];

export const mockTutorTip =
  'Sua quarta-feira está carregada. Recomendo 15 min de pausa após Cálculo.';