import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ScrollView,
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
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { useIaTutor } from '@/hooks/api/aiTutor/useIaTutor';
import type { Conversation, Message } from '@/types/tutor';

export const STUDENT_TUTOR_STATUS_LABEL = 'ANALISANDO DADOS DE FOCO';
const AI_PROVIDER_BADGE = 'Gemini';

type TutorChatProps = {
  statusLabel?: string;
  bottomBar?: ReactNode;
};

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}

export function TutorChat({ statusLabel = STUDENT_TUTOR_STATUS_LABEL, bottomBar }: TutorChatProps) {
  const { translate } = usePreferences();
  const keyboardVisible = useKeyboardVisible();
  const { getHistory, startNewConversation, sendMessage, deleteConversation } = useIaTutor();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setLoadingConversation] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSending, setSending] = useState(false);

  const [draft, setDraft] = useState('');

  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [isHistoryLoading, setHistoryLoading] = useState(false);

  const [isAddChatVisible, setAddChatVisible] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  const loadInitialConversation = useCallback(async () => {
    setLoadingConversation(true);
    setLoadFailed(false);
    try {
      const history = await getHistory();
      const mostRecent = history[0] ?? (await startNewConversation('Nova Conversa'));
      setActiveConversation(mostRecent);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    loadInitialConversation();
  }, [loadInitialConversation]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [activeConversation?.messages.length]);

  const handleOpenNewChatModal = useCallback(() => {
    setHistoryVisible(false);
    setNewChatTitle('');
    setAddChatVisible(true);
  }, []);

  const handleConfirmNewConversation = async () => {
    const titleToUse = newChatTitle.trim() || 'Nova conversa';
    setAddChatVisible(false);
    try {
      const conversation = await startNewConversation(titleToUse);
      setActiveConversation(conversation);
      setDraft('');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a conversa. Tente novamente.');
    }
  };

  const handleOpenHistory = useCallback(async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    try {
      const history = await getHistory();
      setHistoryConversations(history);
    } catch {
      setHistoryConversations([]);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de conversas.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  function handleSelectConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setHistoryVisible(false);
  }

  const handleDeleteChat = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);

      const updatedHistory = historyConversations.filter((c) => c.id !== conversationId);
      setHistoryConversations(updatedHistory);

      if (activeConversation?.id === conversationId) {
        setActiveConversation(updatedHistory[0] ?? (await startNewConversation('Nova Conversa')));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir a conversa. Tente novamente.');
    }
  };

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
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
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
        header={<AppHeader />}
        contentContainerStyle={styles.content}
        footer={
          <>
            {activeConversation ? (
              <View style={styles.footerWrapper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nova conversa"
                  onPress={handleOpenNewChatModal}
                  style={[styles.fab, { backgroundColor: translate(Colors.light.success) }]}>
                  <IconSymbol name="plus" size={22} color={Colors.light.surface} />
                </Pressable>
                <ChatInput value={draft} onChangeText={setDraft} onSend={handleSend} />
              </View>
            ) : null}
            {keyboardVisible ? null : bottomBar}
          </>
        }>
        <AITutorHeader statusLabel={statusLabel} providerBadge={AI_PROVIDER_BADGE} onMenuPress={handleOpenHistory} />

        {isLoadingConversation ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : loadFailed || !activeConversation ? (
          <View style={styles.loadingWrapper}>
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Não foi possível carregar o Tutor IA.
            </UmbrellaText>
            <PrimaryButton label="Tentar de novo" onPress={loadInitialConversation} />
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
          onDeleteConversation={handleDeleteChat}
          onNewConversation={handleOpenNewChatModal}
          activeConversationId={activeConversation?.id}
        />
      </ModalSheet>

      <ModalSheet visible={isAddChatVisible} onClose={() => setAddChatVisible(false)} title="Criar Nova Conversa">
        <View style={styles.modalContent}>
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Dê um título para a sua nova conversa com a IA:
          </UmbrellaText>
          <TextInput
            style={styles.modalInput}
            placeholder="Ex: Dúvidas sobre Matemática"
            placeholderTextColor={Colors.light.textSecondary}
            value={newChatTitle}
            onChangeText={setNewChatTitle}
            autoFocus
          />
          <PrimaryButton label="Criar Conversa" onPress={handleConfirmNewConversation} />
        </View>
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
  modalContent: {
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
});