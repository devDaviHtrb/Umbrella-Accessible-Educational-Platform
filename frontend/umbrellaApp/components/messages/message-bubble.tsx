import { StyleSheet, View } from 'react-native';

import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import type { ChatMessage } from '@/types/messages';
import { formatChatTime } from '@/utils/chat';

export type MessageBubbleProps = {
  message: ChatMessage;
  mine: boolean;
  senderLabel?: string;
};

export function MessageBubble({ message, mine, senderLabel }: MessageBubbleProps) {
  const { translate } = usePreferences();
  const time = formatChatTime(message.dateTime);

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: translate(mine ? Colors.light.primary : Colors.light.surfaceContainerLow) },
        ]}>
        {!mine && senderLabel ? (
          <UmbrellaText variant="label" color={Colors.light.primary}>
            {senderLabel}
          </UmbrellaText>
        ) : null}
        <UmbrellaText variant="body" color={mine ? Colors.light.surface : Colors.light.text}>
          {message.content}
        </UmbrellaText>
        {time ? (
          <UmbrellaText variant="caption" color={mine ? Colors.light.surface : Colors.light.textSecondary}>
            {time}
          </UmbrellaText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    gap: Spacing.xs,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
