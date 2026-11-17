import { createContext, useContext, type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { buildMediaFilter } from '@/utils/color-blind-media';

const MediaFilterScope = createContext(false);

export function ColorBlindMedia({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { preferences } = usePreferences();
  const alreadyFiltered = useContext(MediaFilterScope);
  const filter = alreadyFiltered ? undefined : buildMediaFilter(preferences.colorBlindMode, Platform.OS);

  return (
    <MediaFilterScope.Provider value>
      <View style={[style, filter ? { filter } : null]}>{children}</View>
    </MediaFilterScope.Provider>
  );
}
