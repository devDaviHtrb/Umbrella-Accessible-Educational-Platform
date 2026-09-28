import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AITutorHeader } from '@/components/tutor/ai-tutor-header';
import { ChatInput } from '@/components/tutor/chat-input';
import { ChatMessage } from '@/components/tutor/chat-message';
import { ConversationHistory } from '@/components/tutor/conversation-history';
import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { getHistory, sendMessage, startNewConversation } from '@/services/tutorApi';
import type { Conversation, Message } from '@/types/tutor';

const AI_STATUS_LABEL = 'ANALISANDO DADOS DE FOCO';
const AI_PROVIDER_BADGE = 'Gemini';

export default function TutorScreen() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setLoadingConversation] = useState(true);
  const [isSending, setSending] = useState(false);

  const [draft, setDraft] = useState('');

  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [isHistoryLoading, setHistoryLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadInitialConversation() {
      setLoadingConversation(true);
      const history = await getHistory();
      const mostRecent = history[0] ?? (await startNewConversation());
      setActiveConversation(mostRecent);
      setLoadingConversation(false);
    }
    loadInitialConversation();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [activeConversation?.messages.length]);

  const handleNewConversation = useCallback(async () => {
    const conversation = await startNewConversation();
    setActiveConversation(conversation);
    setDraft('');
    setHistoryVisible(false);
  }, []);

  const handleOpenHistory = useCallback(async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    const history = await getHistory();
    setHistoryConversations(history);
    setHistoryLoading(false);
  }, []);

  function handleSelectConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setHistoryVisible(false);
  }

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || !activeConversation || isSending) return;

    const optimisticUserMessage: Message = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      kind: 'text',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setActiveConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticUserMessage] } : prev,
    );
    setDraft('');
    setSending(true);

    try {
      const aiReply = await sendMessage(activeConversation.id, trimmed);
      setActiveConversation((prev) => (prev ? { ...prev, messages: [...prev.messages, aiReply] } : prev));
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={0}>
      <ScreenContainer
        ref={scrollRef}
        header={<AppHeader onSearchPress={handleOpenHistory} />}
        contentContainerStyle={styles.content}
        footer={
          activeConversation ? (
            <View style={styles.footerWrapper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nova conversa"
                onPress={handleNewConversation}
                style={styles.fab}>
                <IconSymbol name="plus" size={22} color={Colors.light.surface} />
              </Pressable>
              <ChatInput value={draft} onChangeText={setDraft} onSend={handleSend} />
            </View>
          ) : null
        }>
        <AITutorHeader statusLabel={AI_STATUS_LABEL} providerBadge={AI_PROVIDER_BADGE} onMenuPress={handleOpenHistory} />

        {isLoadingConversation || !activeConversation ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : (
          <View style={styles.messageList}>
            {activeConversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isSending ? (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={Colors.light.textSecondary} />
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  IA Umbrella está digitando...
                </UmbrellaText>
              </View>
            ) : null}
          </View>
        )}
      </ScreenContainer>

      <ModalSheet visible={isHistoryVisible} onClose={() => setHistoryVisible(false)} title="Histórico de Conversas">
        <ConversationHistory
          conversations={historyConversations}
          isLoading={isHistoryLoading}
          onSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </ModalSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.lg,
  },
  messageList: {
    gap: Spacing.lg,
  },
  loadingWrapper: {
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.xl,
  },
  footerWrapper: {
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    top: -60,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1E4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});