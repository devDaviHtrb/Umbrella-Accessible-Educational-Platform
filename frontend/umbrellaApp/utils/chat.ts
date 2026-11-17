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

/**
 * Timestamp "agora" no MESMO formato que o backend usa (LocalDateTime sem fuso),
 * para o eco otimista ser comparável às mensagens do servidor.
 */
export function localNowIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
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

  // Mensagens LOCAIS (eco otimista) sempre vão para o FIM: elas acabaram de ser
  // enviadas, então são as mais recentes. Não dependemos do dateTime delas para
  // ordenar (o formato pode divergir do servidor — UTC vs horário local — e
  // jogá-las para o topo).
  if (message.local) {
    return [...list, message];
  }

  // Mensagens do servidor: inserção estável por dateTime. Entre tempos iguais
  // (ou não parseáveis), mantém a ordem de inserção (índice como desempate).
  const next = [...list, message];
  const time = (item: ChatMessage) => parseChatDate(item.dateTime)?.getTime() ?? 0;
  return next
    .map((item, index) => ({ item, index }))
    .sort((a, b) => time(a.item) - time(b.item) || a.index - b.index)
    .map((entry) => entry.item);
}
