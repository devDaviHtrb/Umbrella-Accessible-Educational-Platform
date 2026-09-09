//TESTE PROVISORIO
import type { Conversation, Message } from '@/types/tutor';

const MOCK_NETWORK_DELAY_MS = 500;

function delay<T>(value: T, ms = MOCK_NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

const mockAIReplies: string[] = [
  'Claro! Vou revisar seu histórico de estudos para te ajudar com isso.',
  'Baseado no seu progresso recente, recomendo focar 20 minutos nesse tópico hoje.',
  'Posso preparar um resumo desse conteúdo. Quer que eu continue?',
  'Notei que você tem uma sessão marcada mais tarde — quer que eu ajuste sua agenda?',
];
let replyCursor = 0;

let conversationsStore: Conversation[] = [
  {
    id: 'conversation-calculo',
    title: 'Dúvidas sobre Cálculo Avançado',
    updatedAt: nowIso(),
    messages: [
      {
        id: 'msg-1',
        role: 'ai',
        kind: 'text',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        createdAt: nowIso(),
      },
      {
        id: 'msg-2',
        role: 'user',
        kind: 'text',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        createdAt: nowIso(),
      },
      {
        id: 'msg-3',
        role: 'ai',
        kind: 'agenda-card',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
        agendaItems: ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit'],
        createdAt: nowIso(),
      },
    ],
  },
  {
    id: 'conversation-neurociencia',
    title: 'Revisão de Neurociência Cognitiva',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // ontem
    messages: [
      {
        id: 'neuro-1',
        role: 'user',
        kind: 'text',
        text: 'Pode me explicar de novo o conceito de plasticidade sináptica?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
      {
        id: 'neuro-2',
        role: 'ai',
        kind: 'text',
        text: 'Claro! É a capacidade das sinapses de se fortalecerem ou enfraquecerem ao longo do tempo, com base na atividade.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
    ],
  },
  {
    id: 'conversation-tcc',
    title: 'Estrutura do TCC',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 dias atrás
    messages: [
      {
        id: 'tcc-1',
        role: 'user',
        kind: 'text',
        text: 'Quais seções são obrigatórias na minha monografia?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
      {
        id: 'tcc-2',
        role: 'ai',
        kind: 'text',
        text: 'Introdução, referencial teórico, metodologia, resultados, discussão e conclusão são as seções centrais.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    ],
  },
];

export async function getHistory(): Promise<Conversation[]> {
  const sorted = [...conversationsStore].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return delay(sorted);
}

export async function startNewConversation(): Promise<Conversation> {
  const conversation: Conversation = {
    id: `conversation-${Date.now()}`,
    title: 'Nova conversa',
    updatedAt: nowIso(),
    messages: [
      {
        id: `ai-welcome-${Date.now()}`,
        role: 'ai',
        kind: 'text',
        text: 'Olá! Sobre o que você quer estudar hoje?',
        createdAt: nowIso(),
      },
    ],
  };

  conversationsStore = [conversation, ...conversationsStore];
  return delay(conversation);
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const timestamp = nowIso();

  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    kind: 'text',
    text,
    createdAt: timestamp,
  };

  const replyText = mockAIReplies[replyCursor % mockAIReplies.length];
  replyCursor += 1;

  const aiMessage: Message = {
    id: `ai-${Date.now() + 1}`,
    role: 'ai',
    kind: 'text',
    text: replyText,
    createdAt: nowIso(),
  };

  conversationsStore = conversationsStore.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          updatedAt: aiMessage.createdAt,
          messages: [...conversation.messages, userMessage, aiMessage],
        }
      : conversation,
  );

  return delay(aiMessage);
}