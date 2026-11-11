export type ModuleStatus = 'em-andamento' | 'nova-tarefa';

export type ActiveModule = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  statusLabel: string;
  progress: number;
  icon: 'atom' | 'scalemass.fill' | 'book.fill';
};

export type AgendaEventState = 'past' | 'now' | 'upcoming';

export type AgendaEvent = {
  id: string;
  time: string;
  title: string;
  location: string;
  state: AgendaEventState;
};
