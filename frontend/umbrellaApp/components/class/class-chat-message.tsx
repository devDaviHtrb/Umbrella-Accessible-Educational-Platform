import { StyleSheet, View } from 'react-native';

import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ClassChatMessage as ClassChatMessageType } from '@/types/class';

export type ClassChatMessageProps = {
  message: ClassChatMessageType;
};

export function ClassChatMessage({ message }: ClassChatMessageProps) {
  const { isSelf } = message;

  return (
    <View style={[styles.wrapper, isSelf && styles.wrapperSelf]}>
      <View style={[styles.metaRow, isSelf && styles.metaRowSelf]}>
        {!isSelf ? (
          <UmbrellaText variant="label" color={Colors.light.primary}>
            {message.senderName}
          </UmbrellaText>
        ) : null}
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {message.time}
        </UmbrellaText>
      </View>

      <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
        <UmbrellaText variant="body" color={isSelf ? Colors.light.surface : Colors.light.text}>
          {message.text}
        </UmbrellaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  wrapperSelf: {
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  metaRowSelf: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleOther: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderBottomLeftRadius: 4,
  },
  bubbleSelf: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
});