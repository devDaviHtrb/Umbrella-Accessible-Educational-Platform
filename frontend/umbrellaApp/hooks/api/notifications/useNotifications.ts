import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';

export type NotificationItem = {
  id: number;
  type: 'MESSAGE' | 'MATERIAL' | 'VIDEO' | 'ACTIVITY' | string;
  title: string;
  body: string | null;
  courseId: number | null;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
};

export function useNotifications() {
  const { get, post } = useUmbrellaApi();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get<NotificationItem[]>('logged/notifications');
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }, [get]);

  const markRead = useCallback(
    async (id: number) => {
      setItems((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
      try {
        await post(`logged/notifications/${id}/read`);
      } catch {
        // silencioso; a UI já refletiu
      }
    },
    [post],
  );

  const markAllRead = useCallback(async () => {
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
    try {
      await post('logged/notifications/read-all');
    } catch {
      // silencioso
    }
  }, [post]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { items, loading, error, unreadCount, reload: load, markRead, markAllRead };
}
