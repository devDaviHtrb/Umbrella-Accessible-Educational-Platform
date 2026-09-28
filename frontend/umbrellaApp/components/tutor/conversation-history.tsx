import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HistoryListItem } from '@/components/tutor/history-list-item';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { Conversation } from '@/types/tutor';

export type ConversationHistoryProps = {
  conversations: Conversation[];
  isLoading: boolean;
  onSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
};

export function ConversationHistory({
  conversations,
  isLoading,
  onSelect,
  onNewConversation,
}: ConversationHistoryProps) {
  return (
    <View style={styles.wrapper}>
      <PrimaryButton label="Nova Conversa" icon="plus" onPress={onNewConversation} />

      {isLoading ? (
        <ActivityIndicator color={Colors.light.primary} style={styles.loading} />
      ) : conversations.length === 0 ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Nenhuma conversa anterior ainda.
        </UmbrellaText>
      ) : (
        <View>
          {conversations.map((conversation) => (
            <HistoryListItem
              key={conversation.id}
              conversation={conversation}
              onPress={() => onSelect(conversation)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.lg,
  },
  loading: {
    marginVertical: Spacing.xl,
  },
});