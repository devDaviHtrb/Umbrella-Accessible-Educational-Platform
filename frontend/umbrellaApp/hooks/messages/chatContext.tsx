import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuthContext } from '@/hooks/api/auth/authContext';
import umbrellaApi from '@/services/umbrellaApi';
import { chatSocket } from '@/services/chat-socket';
import type { ChatMessage, ChatStatus } from '@/types/messages';
import { addMessage, localNowIso, parseIncomingMessage } from '@/utils/chat';

type HistoryDto = {
  id: number;
  senderId: number | null;
  recipientId: number | null;
  courseId: number | null;
  content: string;
  dateTime: string;
};

async function fetchHistory(url: string, token: string): Promise<ChatMessage[]> {
  try {
    const res = await umbrellaApi.get<HistoryDto[]>(url, {
      headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      recipientId: m.recipientId,
      courseId: m.courseId,
      content: m.content,
      dateTime: m.dateTime,
    }));
  } catch {
    return [];
  }
}

type ChatContextValue = {
  status: ChatStatus;
  userId: number | null;
  personal: Record<string, ChatMessage[]>;
  course: Record<string, ChatMessage[]>;
  peerNames: Record<string, string>;
  peerAvatars: Record<string, string>;
  registerPeer: (peerId: string, name: string, avatarUrl?: string | null) => void;
  joinCourse: (courseId: string) => () => void;
  sendPersonal: (peerId: string, content: string) => boolean;
  sendCourse: (courseId: string, content: string) => boolean;
  loadPersonalHistory: (peerId: string) => void;
  loadCourseHistory: (courseId: string) => void;
  retry: () => void;
};

const ChatContext = createContext<ChatContextValue>({} as ChatContextValue);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { userToken, userId } = useAuthContext();
  const me = userId ? Number(userId) : null;
  const [status, setStatus] = useState<ChatStatus>(chatSocket.getStatus());
  const [personal, setPersonal] = useState<Record<string, ChatMessage[]>>({});
  const [course, setCourse] = useState<Record<string, ChatMessage[]>>({});
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  const [peerAvatars, setPeerAvatars] = useState<Record<string, string>>({});

  useEffect(() => chatSocket.onStatus(setStatus), []);

  useEffect(() => {
    if (!userToken) {
      chatSocket.disconnect();
      setPersonal({});
      setCourse({});
      setPeerNames({});
      setPeerAvatars({});
      return;
    }

    chatSocket.connect(userToken);
    const unsubscribe = chatSocket.subscribe('/user/queue/messages', (body) => {
      const message = parseIncomingMessage(body);
      if (!message || message.senderId == null) return;
      const peerId = String(message.senderId);
      setPersonal((current) => ({ ...current, [peerId]: addMessage(current[peerId] ?? [], message) }));
    });

    // Carrega o histórico pessoal persistido ao conectar, agrupando por peer.
    const meId = userId ? Number(userId) : null;
    fetchHistory('logged/messages/personal', userToken).then((messages) => {
      if (messages.length === 0 || meId == null) return;
      setPersonal((current) => {
        const next = { ...current };
        for (const m of messages) {
          const peer = String(m.senderId === meId ? m.recipientId : m.senderId);
          next[peer] = addMessage(next[peer] ?? [], m);
        }
        return next;
      });
    });

    return unsubscribe;
  }, [userToken, userId]);

  useEffect(() => () => chatSocket.disconnect(), []);

  const registerPeer = useCallback((peerId: string, name: string, avatarUrl?: string | null) => {
    setPeerNames((current) => (current[peerId] === name ? current : { ...current, [peerId]: name }));
    if (avatarUrl) {
      setPeerAvatars((current) => (current[peerId] === avatarUrl ? current : { ...current, [peerId]: avatarUrl }));
    }
  }, []);

  const joinCourse = useCallback((courseId: string) => {
    return chatSocket.subscribe(`/topic/group/${courseId}`, (body) => {
      const message = parseIncomingMessage(body);
      if (!message) return;
      setCourse((current) => ({ ...current, [courseId]: addMessage(current[courseId] ?? [], message) }));
    });
  }, []);

  const sendPersonal = useCallback(
    (peerId: string, content: string) => {
      const text = content.trim();
      if (!text) return false;
      const sent = chatSocket.send('/app/message/user', JSON.stringify({ recipientId: Number(peerId), content: text }));
      if (!sent) return false;

      // Eco otimista: o backend NÃO devolve a mensagem ao próprio remetente,
      // então adicionamos localmente para ela aparecer na hora.
      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        senderId: me,
        recipientId: Number(peerId),
        courseId: null,
        content: text,
        dateTime: localNowIso(),
        local: true,
      };
      setPersonal((current) => ({ ...current, [peerId]: addMessage(current[peerId] ?? [], message) }));
      return true;
    },
    [me],
  );

  const sendCourse = useCallback(
    (courseId: string, content: string) => {
      const text = content.trim();
      if (!text) return false;
      const sent = chatSocket.send(
        '/app/message/course',
        JSON.stringify({ recipientId: Number(courseId), content: text }),
      );
      if (!sent) return false;

      // Em curso o backend reenvia a todos do /topic, inclusive ao remetente —
      // mas o eco pode demorar; adicionamos otimista e o addMessage de-dupe por
      // id evita duplicar quando o eco chegar (o otimista tem id 'local-').
      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        senderId: me,
        recipientId: null,
        courseId: Number(courseId),
        content: text,
        dateTime: localNowIso(),
        local: true,
      };
      setCourse((current) => ({ ...current, [courseId]: addMessage(current[courseId] ?? [], message) }));
      return true;
    },
    [me],
  );

  const loadPersonalHistory = useCallback(
    (peerId: string) => {
      if (!userToken) return;
      fetchHistory(`logged/messages/personal/${peerId}`, userToken).then((messages) => {
        if (messages.length === 0) return;
        // Servidor é a fonte de verdade: começa só com o histórico persistido
        // (descarta os ecos otimistas 'local-', já salvos no servidor) para
        // não duplicar a própria mensagem ao reentrar.
        setPersonal((current) => {
          let list: ChatMessage[] = [];
          for (const m of messages) list = addMessage(list, m);
          return { ...current, [peerId]: list };
        });
      });
    },
    [userToken],
  );

  const loadCourseHistory = useCallback(
    (courseId: string) => {
      if (!userToken) return;
      fetchHistory(`logged/messages/course/${courseId}`, userToken).then((messages) => {
        if (messages.length === 0) return;
        setCourse((current) => {
          let list: ChatMessage[] = [];
          for (const m of messages) list = addMessage(list, m);
          return { ...current, [courseId]: list };
        });
      });
    },
    [userToken],
  );

  const value = useMemo(
    () => ({
      status,
      userId: me,
      personal,
      course,
      peerNames,
      peerAvatars,
      registerPeer,
      joinCourse,
      sendPersonal,
      sendCourse,
      loadPersonalHistory,
      loadCourseHistory,
      retry: chatSocket.retry,
    }),
    [status, me, personal, course, peerNames, peerAvatars, registerPeer, joinCourse, sendPersonal, sendCourse, loadPersonalHistory, loadCourseHistory],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
