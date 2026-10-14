import { forwardRef } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export type ScreenContainerProps = ScrollViewProps & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  disableTopInset?: boolean;
};

export const ScreenContainer = forwardRef<ScrollView, ScreenContainerProps>(function ScreenContainer(
  { header, footer, disableTopInset = false, children, contentContainerStyle, style, ...rest },
  ref,
) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: disableTopInset ? 0 : insets.top }]}>
      {header}
      <ScrollView
        ref={ref}
        style={[styles.scroll, style]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxxl },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        {...rest}>
        {children}
      </ScrollView>
      {footer}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xxl,
  },
});