import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuthContext } from '@/hooks/api/auth/authContext';
import { chatSocket } from '@/services/chat-socket';
import type { ChatMessage, ChatStatus } from '@/types/messages';
import { addMessage, parseIncomingMessage } from '@/utils/chat';

type ChatContextValue = {
  status: ChatStatus;
  userId: number | null;
  personal: Record<string, ChatMessage[]>;
  course: Record<string, ChatMessage[]>;
  peerNames: Record<string, string>;
  registerPeer: (peerId: string, name: string) => void;
  joinCourse: (courseId: string) => () => void;
  sendPersonal: (peerId: string, content: string) => boolean;
  sendCourse: (courseId: string, content: string) => boolean;
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

  useEffect(() => chatSocket.onStatus(setStatus), []);

  useEffect(() => {
    if (!userToken) {
      chatSocket.disconnect();
      setPersonal({});
      setCourse({});
      setPeerNames({});
      return;
    }

    chatSocket.connect(userToken);
    const unsubscribe = chatSocket.subscribe('/user/queue/messages', (body) => {
      const message = parseIncomingMessage(body);
      if (!message || message.senderId == null) return;
      const peerId = String(message.senderId);
      setPersonal((current) => ({ ...current, [peerId]: addMessage(current[peerId] ?? [], message) }));
    });

    return unsubscribe;
  }, [userToken]);

  useEffect(() => () => chatSocket.disconnect(), []);

  const registerPeer = useCallback((peerId: string, name: string) => {
    setPeerNames((current) => (current[peerId] === name ? current : { ...current, [peerId]: name }));
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
      if (!text || me == null) return false;
      const sent = chatSocket.send('/app/message/user', JSON.stringify({ recipientId: Number(peerId), content: text }));
      if (!sent) return false;

      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        senderId: me,
        recipientId: Number(peerId),
        courseId: null,
        content: text,
        dateTime: new Date().toISOString(),
        local: true,
      };
      setPersonal((current) => ({ ...current, [peerId]: addMessage(current[peerId] ?? [], message) }));
      return true;
    },
    [me],
  );

  const sendCourse = useCallback((courseId: string, content: string) => {
    const text = content.trim();
    if (!text) return false;
    return chatSocket.send('/app/message/course', JSON.stringify({ recipientId: Number(courseId), content: text }));
  }, []);

  const value = useMemo(
    () => ({
      status,
      userId: me,
      personal,
      course,
      peerNames,
      registerPeer,
      joinCourse,
      sendPersonal,
      sendCourse,
      retry: chatSocket.retry,
    }),
    [status, me, personal, course, peerNames, registerPeer, joinCourse, sendPersonal, sendCourse],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
