import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View, type ScrollView } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { ConnectionBadge } from '@/components/messages/connection-badge';
import { MessageBubble } from '@/components/messages/message-bubble';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { ChatInput } from '@/components/tutor/chat-input';
import { Colors, Spacing } from '@/constants/theme';
import { useInstructors } from '@/hooks/api/messages/useInstructors';
import { useChat } from '@/hooks/messages/chatContext';
import { notify } from '@/utils/confirm';
import type { ChatKind } from '@/types/messages';

type ChatParams = {
  kind?: ChatKind;
  id?: string;
  title?: string;
};

export default function ChatScreen() {
  const { kind = 'personal', id = '', title = '' } = useLocalSearchParams<ChatParams>();
  const { status, userId, personal, course, peerNames, joinCourse, sendPersonal, sendCourse, retry } = useChat();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const isCourse = kind === 'course';
  const messages = (isCourse ? course[id] : personal[id]) ?? [];
  const canRetry = status === 'failed' || status === 'disconnected';

  useInstructors(isCourse && id ? [id] : []);

  useEffect(() => {
    if (!isCourse || !id) return;
    return joinCourse(id);
  }, [isCourse, id, joinCourse]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  function handleSend() {
    if (!draft.trim() || !id) return;
    const sent = isCourse ? sendCourse(id, draft) : sendPersonal(id, draft);
    if (sent) {
      setDraft('');
    } else {
      notify('Mensagem não enviada', 'Sem conexão com o servidor. Aguarde a reconexão e tente novamente.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Stack.Screen options={{ title: title || (isCourse ? 'Conversa do curso' : 'Conversa') }} />
      <ScreenContainer
        ref={scrollRef}
        disableTopInset
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        footer={
          <View style={styles.footer}>
            <ChatInput
              value={draft}
              onChangeText={setDraft}
              onSend={handleSend}
              placeholder="Escreva uma mensagem..."
              showQuickActions={false}
            />
          </View>
        }>
        <View style={styles.header}>
          <StatusBadge label={isCourse ? 'CONVERSA DO CURSO' : 'CONVERSA PESSOAL'} tone={isCourse ? 'teal' : 'primary'} />
          <ConnectionBadge status={status} />
        </View>

        {canRetry ? <SecondaryButton label="Tentar reconectar" onPress={retry} /> : null}

        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          Aparecem as mensagens desta sessão: o servidor ainda não oferece consulta ao histórico.
        </UmbrellaText>

        {messages.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhuma mensagem nesta sessão ainda. Escreva a primeira mensagem.
          </UmbrellaText>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === userId;
            const senderLabel = isCourse && message.senderId != null
              ? (peerNames[String(message.senderId)] ?? `Aluno #${message.senderId}`)
              : undefined;
            return <MessageBubble key={String(message.id)} message={message} mine={mine} senderLabel={senderLabel} />;
          })
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});
