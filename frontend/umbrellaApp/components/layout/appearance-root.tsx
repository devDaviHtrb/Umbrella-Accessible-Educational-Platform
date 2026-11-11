import { StyleSheet, View } from 'react-native';

import { ColorBlindFilterDefs } from '@/components/layout/color-blind-filter-defs';
import { buildRootFilter } from '@/constants/preferences';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export function AppearanceRoot({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences();
  const filter = buildRootFilter(preferences);

  return (
    <View style={[styles.root, filter ? { filter } : null]}>
      <ColorBlindFilterDefs />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
