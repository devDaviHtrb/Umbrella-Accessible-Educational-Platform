import { StyleSheet, View } from 'react-native';
import { AIAgendaCard } from '@/components/tutor/ai-agenda-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ChatMessageItem } from '@/types/tutor';

export type ChatMessageProps = {
  message: ChatMessageItem;
  onConfirmAgenda?: () => void;
  onAdjustAgenda?: () => void;
};

export function ChatMessage({ message, onConfirmAgenda, onAdjustAgenda }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAI]}>
        <IconSymbol
          name={isUser ? 'person.fill' : 'sparkles'}
          size={14}
          color={isUser ? Colors.light.textSecondary : Colors.light.primary}
        />
      </View>

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <UmbrellaText variant="body" color={isUser ? Colors.light.surface : Colors.light.text}>
          {message.text}
        </UmbrellaText>

        {message.kind === 'agenda-card' ? (
          <AIAgendaCard items={message.agendaItems} onConfirm={onConfirmAgenda} onAdjust={onAdjustAgenda} />
        ) : null}
      </View>
    </View>
  );
}

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAI: {
    backgroundColor: Colors.light.secondaryFixed,
  },
  avatarUser: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bubbleAI: {
    backgroundColor: Colors.light.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
});