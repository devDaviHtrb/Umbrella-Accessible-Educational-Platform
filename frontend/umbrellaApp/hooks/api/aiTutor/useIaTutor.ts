import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import type { Conversation, Message } from '@/types/tutor';

function mapIaChatToConversation(chat: any): Conversation {
    const messages: Message[] = (chat.messages ?? []).map((msg: any) => {
        const role = msg.role?.toLowerCase() === 'user' ? 'user' : 'ai';
        return {
            id: `msg-${msg.id}`,
            role,
            kind: 'text',
            text: msg.content ?? '',
            createdAt: new Date(msg.createdAt).toISOString(),
        } as Message;
    });

    return {
        id: String(chat.id),
        title: chat.title,
        updatedAt: new Date(chat.createdAt).toISOString(),
        messages,
    };
}

export function useIaTutor() {
    const { get, post, del } = useUmbrellaApi();

    const getHistory = async (): Promise<Conversation[]> => {
        // NOTE: URLs must NOT start with '/' — axios ignores baseURL when path starts with '/'
        const response = await get<any[]>('public/tutor/chats');
        const chats = response as any[];
        const conversations = chats.map(mapIaChatToConversation);
        return conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    };

    const startNewConversation = async (title = 'Nova conversa'): Promise<Conversation> => {
        const url = `public/tutor/chat?title=${encodeURIComponent(title)}`;
        const response = await post<any>(url, {});
        return mapIaChatToConversation(response);
    };

    const sendMessage = async (conversationId: string, text: string): Promise<Message> => {
        const url = `public/tutor/chat/${conversationId}/ask?ask=${encodeURIComponent(text)}`;
        const response = await post<string>(url, {});
        const aiReply = response as string;
        return {
            id: `ai-${Date.now()}`,
            role: 'ai',
            kind: 'text',
            text: aiReply,
            createdAt: new Date().toISOString(),
        } as Message;
    };

    const deleteConversation = async (conversationId: string): Promise<void> => {
        await del<void>(`public/tutor/chat/${conversationId}`);
    };

    return { getHistory, startNewConversation, sendMessage, deleteConversation };
}