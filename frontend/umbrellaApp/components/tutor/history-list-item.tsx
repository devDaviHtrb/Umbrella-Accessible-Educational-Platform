import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Conversation } from '@/types/tutor';

export type HistoryListItemProps = {
  conversation: Conversation;
  onPress: () => void;
};

function formatConversationDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function HistoryListItem({ conversation, onPress }: HistoryListItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.textColumn}>
        <UmbrellaText variant="bodyMedium" numberOfLines={1}>
          {conversation.title}
        </UmbrellaText>
        {lastMessage ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1}>
            {lastMessage.text}
          </UmbrellaText>
        ) : null}
      </View>
      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {formatConversationDate(conversation.updatedAt)}
      </UmbrellaText>
      <IconSymbol name="chevron.right" size={16} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.outline,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
});