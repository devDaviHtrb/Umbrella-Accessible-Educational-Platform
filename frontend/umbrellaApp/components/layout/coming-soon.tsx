import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors } from '@/constants/theme';

export type ComingSoonProps = {
  title: string;
  showHeader?: boolean;
};

export function ComingSoon({ title, showHeader = true }: ComingSoonProps) {
  return (
    <ScreenContainer header={showHeader ? <AppHeader /> : undefined}>
      <View style={styles.center}>
        <UmbrellaText variant="title">{title}</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.text}>
          ...
        </UmbrellaText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingTop: 96,
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});