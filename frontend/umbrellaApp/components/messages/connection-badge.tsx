import { StatusBadge } from '@/components/ui/status-badge';
import type { ChatStatus } from '@/types/messages';

const BADGES = {
  connected: { label: 'CONECTADO', tone: 'teal' },
  connecting: { label: 'CONECTANDO', tone: 'primary' },
  reconnecting: { label: 'RECONECTANDO', tone: 'primary' },
  failed: { label: 'SEM CONEXÃO', tone: 'error' },
  disconnected: { label: 'DESCONECTADO', tone: 'neutral' },
} as const;

export function ConnectionBadge({ status }: { status: ChatStatus }) {
  const badge = BADGES[status];
  return <StatusBadge label={badge.label} tone={badge.tone} />;
}
