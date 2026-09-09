import type { Message } from '@/types/tutor';

export const mockAIStatusLabel = 'ANALISANDO DADOS DE FOCO';
export const mockAIProviderBadge = 'Gemini';

export const mockInitialMessages: Message[] = [

  {
    id: 'msg-1',
    role: 'ai',
    kind: 'text',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    createdAt: new Date().toISOString(),
  },

  {
    id: 'msg-2',
    role: 'user',
    kind: 'text',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    createdAt: new Date().toISOString(),
  },

  {
    id: 'msg-3',
    role: 'ai',
    kind: 'agenda-card',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
    agendaItems: ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit'],
    createdAt: new Date().toISOString(),
  },
];

export const mockAIReplies: string[] = [
  'Claro! Vou revisar seu histórico de estudos para te ajudar com isso.',
  'Baseado no seu progresso recente, recomendo focar 20 minutos nesse tópico hoje.',
  'Posso preparar um resumo desse conteúdo. Quer que eu continue?',
  'Notei que você tem uma sessão marcada mais tarde — quer que eu ajuste sua agenda?',
];