import type { RecordedCategory, RecordedLesson } from '@/types/recorded-classes';

export const ALL_RECORDED_CATEGORY_ID = 'todos';

export const mockRecordedCategories: RecordedCategory[] = [
  { id: ALL_RECORDED_CATEGORY_ID, label: 'Todos' },
  { id: 'design-system', label: 'Design System' },
  { id: 'arquitetura', label: 'Arquitetura' },
  { id: 'psicologia', label: 'Psicologia' },
  { id: 'lideranca', label: 'Liderança' },
];

export const mockRecordedLessons: RecordedLesson[] = [
  {
    id: 'fundamentos-da-cor-e-luz',
    categoryId: 'design-system',
    category: 'Design System',
    title: 'Fundamentos da Cor e Luz',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor…',
    durationLabel: '45:20',
    dateLabel: '12 Out, 2023',
    imageTone: '#22364F',
  },
  {
    id: 'espacos-de-silencio',
    categoryId: 'arquitetura',
    category: 'Arquitetura',
    title: 'Espaços de Silêncio',
    description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip…',
    durationLabel: '32:15',
    dateLabel: '10 Out, 2023',
    imageTone: '#8C8478',
  },
  {
    id: 'foco-e-retencao-visual',
    categoryId: 'psicologia',
    category: 'Psicologia',
    title: 'Foco e Retenção Visual',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugia…',
    durationLabel: '58:40',
    dateLabel: '05 Out, 2023',
    imageTone: '#3B2A20',
  },
  {
    id: 'gestao-de-equipes-criativas',
    categoryId: 'lideranca',
    category: 'Liderança',
    title: 'Gestão de Equipes Criativas',
    description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserun…',
    durationLabel: '25:10',
    dateLabel: '01 Out, 2023',
    imageTone: '#15181D',
  },
];