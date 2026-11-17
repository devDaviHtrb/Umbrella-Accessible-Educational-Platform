import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildColorMap,
  DEFAULT_PREFERENCES,
  FONT_SCALE,
  PREFERENCES_STORAGE_KEY,
  sanitizePreferences,
  translateColor,
  type Preferences,
} from '@/constants/preferences';
import { stopReading } from '@/utils/speech';

type PreferencesContextValue = {
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
  translate: (color: string) => string;
  fontScale: number;
};

function createValue(
  preferences: Preferences,
  updatePreferences: PreferencesContextValue['updatePreferences'],
  resetPreferences: PreferencesContextValue['resetPreferences'],
): PreferencesContextValue {
  const colorMap = buildColorMap(preferences);
  return {
    preferences,
    updatePreferences,
    resetPreferences,
    translate: (color) => translateColor(colorMap, color),
    fontScale: FONT_SCALE[preferences.fontSize],
  };
}

const PreferencesContext = createContext<PreferencesContextValue>(
  createValue(
    DEFAULT_PREFERENCES,
    () => {},
    () => {},
  ),
);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const latest = useRef<Preferences>(DEFAULT_PREFERENCES);
  const touched = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
      .then((raw) => {
        if (!active || touched.current || !raw) return;
        const stored = sanitizePreferences(JSON.parse(raw));
        latest.current = stored;
        setPreferences(stored);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((next: Preferences) => {
    touched.current = true;
    latest.current = next;
    setPreferences(next);
    AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    if (!next.textToSpeech) stopReading();
  }, []);

  const updatePreferences = useCallback(
    (patch: Partial<Preferences>) => commit(sanitizePreferences({ ...latest.current, ...patch })),
    [commit],
  );

  const resetPreferences = useCallback(() => commit(DEFAULT_PREFERENCES), [commit]);

  const value = useMemo(
    () => createValue(preferences, updatePreferences, resetPreferences),
    [preferences, updatePreferences, resetPreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
