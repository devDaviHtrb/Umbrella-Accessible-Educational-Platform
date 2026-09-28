import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';

export type ChatInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  showQuickActions?: boolean;
};

export function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder = 'Pergunte qualquer coisa à Umbrella...',
  showQuickActions = true,
}: ChatInputProps) {
  const canSend = value.trim().length > 0;

  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        {showQuickActions ? (
          <IconSymbol name="plus" size={18} color={Colors.light.textSecondary} />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          returnKeyType="send"
          multiline
        />
        {showQuickActions ? (
          <IconSymbol name="mic.fill" size={18} color={Colors.light.textSecondary} />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
        onPress={onSend}
        disabled={!canSend}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
        <IconSymbol name="paperplane.fill" size={18} color={Colors.light.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 90,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});