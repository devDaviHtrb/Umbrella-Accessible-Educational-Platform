import type { ActiveModule, AgendaEvent, WeeklyGoal } from '@/types/painel';

export const mockUserName = 'Usuário';

export const mockActiveModules: ActiveModule[] = [
  {
    id: 'neurociencia-cognitiva',
    title: 'Neurociência Cognitiva Avançada',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'em-andamento',
    statusLabel: 'Em Andamento',
    progress: 68,
    icon: 'atom',
  },
  {
    id: 'filosofia-etica',
    title: 'Filosofia da Ética Moderna',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    status: 'nova-tarefa',
    statusLabel: 'Nova Tarefa',
    progress: 12,
    icon: 'scalemass.fill',
  },
];

export const mockWeeklyGoals: WeeklyGoal[] = [
  {
    id: 'horas-de-estudo',
    label: 'Horas de Estudo (12/15)',
    progress: 80,
    progressLabel: '80%',
  },
  {
    id: 'artigos-pesquisa',
    label: 'Artigos de Pesquisa (2/5)',
    progress: 40,
    progressLabel: '40%',
  },
  {
    id: 'revisoes-pares',
    label: 'Revisões por Pares (3/3)',
    progress: 100,
    progressLabel: 'Concluído',
    completed: true,
  },
];

export const mockTodayAgenda: AgendaEvent[] = [
  {
    id: 'orientacao-tese',
    time: '09:00 - 10:30',
    title: 'Reunião de Orientação de Tese',
    location: 'Salão Principal, Sala 402',
    state: 'past',
  },
  {
    id: 'pesquisa-independente',
    time: 'AGORA • 11:00 - 12:30',
    title: 'Pesquisa Independente',
    location: 'Zona de Santuário da Biblioteca',
    state: 'now',
  },
  {
    id: 'workshop-neurociencia',
    time: '14:00 - 15:30',
    title: 'Workshop de Neurociência',
    location: 'Sessão Virtual',
    state: 'upcoming',
  },
];
