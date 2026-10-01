import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Conversation } from '@/types/tutor';

export type HistoryListItemProps = {
  conversation: Conversation;
  onPress: () => void;
  onDelete?: () => void;
  isActive?: boolean;
};

function formatConversationDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function HistoryListItem({ conversation, onPress, onDelete, isActive }: HistoryListItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <View style={[styles.row, isActive && styles.activeRow]}>
      {/* Área principal para clicar e abrir a conversa */}
      <Pressable onPress={onPress} style={styles.mainTouchable}>
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
      </Pressable>

      {/* Botão da lixeira visível antes da seta */}
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apagar conversa"
          onPress={onDelete}
          style={styles.deleteButton}
          hitSlop={8}>
          <IconSymbol name="trash.fill" size={16} color={Colors.light.error || '#FF3B30'} />
        </Pressable>
      ) : null}

      <IconSymbol name="chevron.right" size={16} color={Colors.light.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 6,
    backgroundColor: Colors.light.surface,
  },
  activeRow: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: Colors.light.primary,
  },
  mainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  textColumn: {
    flex: 1,
    gap: 2,
    overflow: 'hidden',
  },
  deleteButton: {
    padding: 4,
  },
});