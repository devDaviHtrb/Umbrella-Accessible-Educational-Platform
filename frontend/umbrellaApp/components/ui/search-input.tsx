import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';

export type SearchInputProps = TextInputProps;

export function SearchInput({ style, ...rest }: SearchInputProps) {
  return (
    <View style={styles.wrapper}>
      <IconSymbol name="magnifyingglass" size={20} color={Colors.light.textSecondary} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={Colors.light.textSecondary}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
  },
});
