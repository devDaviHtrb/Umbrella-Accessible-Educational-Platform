import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ReadAloudContext, type ReadAloudRegistry } from '@/components/layout/read-aloud';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { startReading, stopReading } from '@/utils/speech';

export type ReadAloudButtonProps = {
  registry: ReadAloudRegistry;
  bottomOffset: number;
};

export function ReadAloudButton({ registry, bottomOffset }: ReadAloudButtonProps) {
  const { translate } = usePreferences();
  const [reading, setReading] = useState(false);

  useEffect(() => () => stopReading(), []);

  function handlePress() {
    if (reading) {
      stopReading();
      setReading(false);
      return;
    }

    const started = startReading(registry.collect(), () => setReading(false));
    if (started) {
      setReading(true);
    } else {
      Alert.alert('Leitor de texto', 'Não há texto para ler nesta tela.');
    }
  }

  return (
    <ReadAloudContext.Provider value={null}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={reading ? 'Parar leitura' : 'Ouvir esta tela'}
        onPress={handlePress}
        style={[
          styles.button,
          { bottom: bottomOffset + Spacing.lg, backgroundColor: translate(Colors.light.primary) },
        ]}>
        <IconSymbol
          name={reading ? 'stop.fill' : 'speaker.wave.2.fill'}
          size={20}
          color={Colors.light.surface}
        />
        <UmbrellaText variant="bodyMedium" color={Colors.light.surface}>
          {reading ? 'Parar' : 'Ouvir'}
        </UmbrellaText>
      </Pressable>
    </ReadAloudContext.Provider>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
