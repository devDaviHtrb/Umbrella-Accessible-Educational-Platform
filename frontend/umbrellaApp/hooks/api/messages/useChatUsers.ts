import { useEffect, useState } from 'react';

import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import { useChat } from '@/hooks/messages/chatContext';

export type ChatUser = {
  id: string;
  name: string;
};

type UserApiDto = {
  id: number;
  name: string;
  avatarUrl?: string | null;
};

/**
 * Lista TODOS os usuários (exceto o próprio) para iniciar uma conversa no chat.
 * Antes o app só mostrava cursos e o instrutor; agora qualquer usuário aparece.
 */
export function useChatUsers() {
  const { get } = useUmbrellaApi();
  const { userId, registerPeer } = useChat();
  const [users, setUsers] = useState<ChatUser[]>([]);

  useEffect(() => {
    let active = true;
    get<UserApiDto[]>('public/users/list')
      .then((list) => {
        if (!active || !Array.isArray(list)) return;
        const mapped = list
          .filter((u) => u.id !== userId)
          .map((u) => ({ id: String(u.id), name: u.name, avatarUrl: u.avatarUrl ?? null }));
        mapped.forEach((u) => registerPeer(u.id, u.name, u.avatarUrl));
        setUsers(mapped);
      })
      .catch(() => {
        if (active) setUsers([]);
      });
    return () => {
      active = false;
    };
  }, [get, userId, registerPeer]);

  return users;
}
