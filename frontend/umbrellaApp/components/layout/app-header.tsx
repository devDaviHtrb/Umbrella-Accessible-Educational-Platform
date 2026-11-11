import { StyleSheet, View } from 'react-native';

import { UmbrellaLogo, hasUmbrellaLogo } from '@/components/layout/umbrella-logo';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export function AppHeader({ centered = false }: { centered?: boolean }) {
  const { preferences } = usePreferences();

  if (preferences.focusMode) return null;

  return (
    <View style={styles.row}>
      {hasUmbrellaLogo ? (
        <UmbrellaLogo centered={centered} />
      ) : (
        <UmbrellaText variant="title" color={Colors.light.primary}>
          Umbrella
        </UmbrellaText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
