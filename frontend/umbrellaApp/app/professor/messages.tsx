import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { ProfessorBottomBar } from '@/components/professor/professor-bottom-bar';
import { ConnectionBadge } from '@/components/messages/connection-badge';
import { ConversationRow } from '@/components/messages/conversation-row';
import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useChatUsers } from '@/hooks/api/messages/useChatUsers';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import { useChat } from '@/hooks/messages/chatContext';
import type { ChatKind } from '@/types/messages';
import { formatChatTime } from '@/utils/chat';

function openChat(kind: ChatKind, id: string, title: string) {
  router.push({ pathname: '/professor/chat', params: { kind, id, title } });
}

export default function ProfessorMessagesScreen() {
  const { getCourses } = useProfessorCourses();
  const { data: courses } = useFocusData(getCourses);
  const { status, personal, peerNames, peerAvatars, retry } = useChat();
  const allUsers = useChatUsers();

  const personalRows = useMemo(() => {
    const peerIds = new Set([...Object.keys(personal), ...allUsers.map((u) => u.id)]);
    return Array.from(peerIds)
      .map((peerId) => {
        const messages = personal[peerId] ?? [];
        const last = messages[messages.length - 1];
        return {
          peerId,
          title: peerNames[peerId] ?? `Usuário #${peerId}`,
          subtitle: last?.content ?? 'Iniciar conversa',
          time: last ? formatChatTime(last.dateTime) : undefined,
          hasMessages: messages.length > 0,
        };
      })
      .sort(
        (a, b) =>
          Number(b.hasMessages) - Number(a.hasMessages) || a.title.localeCompare(b.title, 'pt-BR'),
      );
  }, [personal, allUsers, peerNames]);

  const canRetry = status === 'failed' || status === 'disconnected';

  return (
    <ScreenContainer
      disableTopInset
      contentContainerStyle={styles.content}
      footer={<ProfessorBottomBar active="messages" />}>
      <View style={styles.statusRow}>
        <UmbrellaText variant="display" style={styles.title}>
          Mensagens
        </UmbrellaText>
        <ConnectionBadge status={status} />
      </View>

      {canRetry ? <SecondaryButton label="Tentar reconectar" onPress={retry} /> : null}

      <Card tone="muted" style={styles.notice}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          Converse com qualquer pessoa da plataforma ou com a turma de um dos seus cursos. O histórico é carregado
          automaticamente.
        </UmbrellaText>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Conversas pessoais" />
        {personalRows.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhum usuário disponível ainda.
          </UmbrellaText>
        ) : (
          personalRows.map((row) => (
            <ConversationRow
              key={row.peerId}
              kind="personal"
              title={row.title}
              subtitle={row.subtitle}
              time={row.time}
              avatarUrl={peerAvatars[row.peerId]}
              onPress={() => openChat('personal', row.peerId, row.title)}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Turmas dos meus cursos" />
        {!courses || courses.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Crie um curso para conversar com a turma.
          </UmbrellaText>
        ) : (
          courses.map((course) => (
            <ConversationRow
              key={course.id}
              kind="course"
              title={course.title}
              subtitle="Conversa geral do curso"
              onPress={() => openChat('course', course.id, course.title)}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  title: {
    flexShrink: 1,
  },
  notice: {
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
});
