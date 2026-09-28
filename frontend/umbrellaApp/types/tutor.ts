export type ChatRole = 'ai' | 'user';

export type MessageKind = 'text' | 'agenda-card';

type MessageBase = {
  id: string;
  role: ChatRole;
  kind: MessageKind;
  text: string;
  createdAt: string;
};

export type TextMessage = MessageBase & {
  kind: 'text';
};

export type AgendaCardMessage = MessageBase & {
  role: 'ai';
  kind: 'agenda-card';
  agendaItems: string[];
};

export type ChatMessageItem = Message;
export type Message = TextMessage | AgendaCardMessage;

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};