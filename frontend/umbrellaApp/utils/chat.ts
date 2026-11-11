import type { ChatMessage } from '@/types/messages';

export function buildChatSocketUrl(apiUrl: string): string {
  const base = apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${base.replace(/^http/, 'ws')}/ws/websocket`;
}

export function parseIncomingMessage(body: string): ChatMessage | null {
  try {
    const data = JSON.parse(body);
    if (data?.id == null || typeof data.content !== 'string' || typeof data.dateTime !== 'string') return null;
    return {
      id: data.id,
      senderId: data.senderId ?? null,
      recipientId: data.recipientId ?? null,
      courseId: data.courseId ?? null,
      content: data.content,
      dateTime: data.dateTime,
    };
  } catch {
    return null;
  }
}

export function parseChatDate(value: string): Date | null {
  const normalized = value.replace(/(\.\d{3})\d+/, '$1');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatChatTime(value: string): string {
  const date = parseChatDate(value);
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (list.some((item) => String(item.id) === String(message.id))) return list;
  const time = (item: ChatMessage) => parseChatDate(item.dateTime)?.getTime() ?? 0;
  return [...list, message].sort((a, b) => time(a) - time(b));
}
