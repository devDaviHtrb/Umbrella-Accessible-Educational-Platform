import { StyleSheet, View } from 'react-native';

import { buildRootFilter } from '@/constants/preferences';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export function AppearanceRoot({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences();
  const filter = buildRootFilter(preferences);

  return <View style={[styles.root, filter ? { filter } : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
