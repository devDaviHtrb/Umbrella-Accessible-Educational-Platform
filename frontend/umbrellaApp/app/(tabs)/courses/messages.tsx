import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { SectionHeader } from '@/components/layout/section-header';
import { ConnectionBadge } from '@/components/messages/connection-badge';
import { ConversationRow } from '@/components/messages/conversation-row';
import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useCourses } from '@/hooks/api/courses/useCourse';
import { useInstructors } from '@/hooks/api/messages/useInstructors';
import { useChat } from '@/hooks/messages/chatContext';
import type { ChatKind } from '@/types/messages';
import { formatChatTime } from '@/utils/chat';

function openChat(kind: ChatKind, id: string, title: string) {
  router.push({ pathname: '/courses/chat', params: { kind, id, title } });
}

export default function MessagesScreen() {
  const { enrolledCourses, refetchEnrolledCourses } = useCourses();
  const { status, personal, peerNames, retry } = useChat();
  const instructors = useInstructors(enrolledCourses.map((course) => course.id));

  useFocusEffect(
    useCallback(() => {
      refetchEnrolledCourses();
    }, [refetchEnrolledCourses]),
  );

  const personalRows = useMemo(() => {
    const peerIds = new Set([...Object.keys(personal), ...instructors.map((instructor) => instructor.id)]);

    return Array.from(peerIds)
      .map((peerId) => {
        const messages = personal[peerId] ?? [];
        const last = messages[messages.length - 1];
        const instructor = instructors.find((item) => item.id === peerId);
        return {
          peerId,
          title: peerNames[peerId] ?? `Usuário #${peerId}`,
          subtitle: last?.content ?? (instructor ? `Instrutor de ${instructor.courseTitle}` : 'Iniciar conversa'),
          time: last ? formatChatTime(last.dateTime) : undefined,
          hasMessages: messages.length > 0,
        };
      })
      .sort((a, b) => Number(b.hasMessages) - Number(a.hasMessages));
  }, [personal, instructors, peerNames]);

  const canRetry = status === 'failed' || status === 'disconnected';

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <UmbrellaText variant="display" style={styles.title}>
          Mensagens
        </UmbrellaText>
        <ConnectionBadge status={status} />
      </View>

      {canRetry ? <SecondaryButton label="Tentar reconectar" onPress={retry} /> : null}

      <Card tone="muted" style={styles.notice}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          Aparecem as mensagens trocadas nesta sessão: o servidor ainda não oferece consulta ao histórico. Conversas
          com colegas começam quando eles escrevem para você, pois o servidor ainda não lista usuários.
        </UmbrellaText>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Conversas pessoais" />
        {personalRows.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Nenhuma conversa pessoal ainda.
          </UmbrellaText>
        ) : (
          personalRows.map((row) => (
            <ConversationRow
              key={row.peerId}
              kind="personal"
              title={row.title}
              subtitle={row.subtitle}
              time={row.time}
              onPress={() => openChat('personal', row.peerId, row.title)}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Conversas dos cursos" />
        {enrolledCourses.length === 0 ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Matricule-se em um curso para conversar com a turma.
          </UmbrellaText>
        ) : (
          enrolledCourses.map((course) => (
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
