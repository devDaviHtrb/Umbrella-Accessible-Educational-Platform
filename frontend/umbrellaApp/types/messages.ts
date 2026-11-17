export type ChatMessage = {
  id: number | string;
  senderId: number | null;
  recipientId: number | null;
  courseId: number | null;
  content: string;
  dateTime: string;
  local?: boolean;
};

export type ChatKind = 'personal' | 'course';

export type ChatStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
