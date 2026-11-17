import { forwardRef, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createReadAloudRegistry,
  ReadAloudContext,
} from "@/components/layout/read-aloud";
import { ReadAloudButton } from "@/components/layout/read-aloud-button";
import { Colors, Spacing } from "@/constants/theme";
import { usePreferences } from "@/hooks/preferences/preferencesContext";

export type ScreenContainerProps = ScrollViewProps & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  disableTopInset?: boolean;
};

export const ScreenContainer = forwardRef<
  ScrollView,
  ScreenContainerProps
>(function ScreenContainer(
  {
    header,
    footer,
    disableTopInset = false,
    children,
    contentContainerStyle,
    style,
    ...rest
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { translate, preferences } = usePreferences();
  const registry = useMemo(createReadAloudRegistry, []);

  return (
    <ReadAloudContext.Provider value={registry}>
      <View
        style={[
          styles.root,
          {
            paddingTop: disableTopInset ? 0 : insets.top,
            backgroundColor: translate(Colors.light.background),
          },
        ]}
      >
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
          {...rest}
        >
          {children}
        </ScrollView>
        {footer}
        {preferences.textToSpeech ? (
          <ReadAloudButton
            registry={registry}
            bottomOffset={footer ? Spacing.xxxl * 3 : insets.bottom}
          />
        ) : null}
      </View>
    </ReadAloudContext.Provider>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xxl,
  },
});
