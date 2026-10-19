import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSpeech } from '@/hooks/accessibility/speech-context';

export interface SpeechReaderButtonProps {

  text: string;

  label?: string;

  variant?: 'icon' | 'pill' | 'outline';

  iconSize?: number;

  style?: StyleProp<ViewStyle>;
}

export function SpeechReaderButton({
  text,
  label,
  variant = 'icon',
  iconSize = 18,
  style,
}: SpeechReaderButtonProps) {
  const { isSpeaking, currentText, toggleSpeak } = useSpeech();


  const isCurrentSpeaking = isSpeaking && currentText === text;

  const handlePress = async () => {
    await toggleSpeak(text);
  };

  const accessibilityLabel = isCurrentSpeaking
    ? 'Parar leitura em voz alta'
    : label
      ? `Ouvir em voz alta: ${label}`
      : 'Ouvir conteúdo em voz alta';

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Reproduz o texto da tela através da síntese de voz nativa."
        accessibilityState={{ busy: isCurrentSpeaking }}
        onPress={handlePress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconBase,
          isCurrentSpeaking ? styles.speakingIcon : styles.idleIcon,
          pressed && styles.pressed,
          style,
        ]}>
        <IconSymbol
          name={isCurrentSpeaking ? 'stop.fill' : 'speaker.wave.2.fill'}
          size={iconSize}
          color={isCurrentSpeaking ? Colors.light.surface : Colors.light.primary}
        />
      </Pressable>
    );
  }

  const isPill = variant === 'pill';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Reproduz o texto da tela através da síntese de voz nativa."
      accessibilityState={{ busy: isCurrentSpeaking }}
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.buttonBase,
        isPill
          ? isCurrentSpeaking
            ? styles.pillSpeaking
            : styles.pillIdle
          : isCurrentSpeaking
            ? styles.outlineSpeaking
            : styles.outlineIdle,
        pressed && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        <IconSymbol
          name={isCurrentSpeaking ? 'stop.fill' : 'speaker.wave.2.fill'}
          size={iconSize}
          color={
            isPill
              ? Colors.light.surface
              : isCurrentSpeaking
                ? Colors.light.error
                : Colors.light.primary
          }
        />
        <UmbrellaText
          variant="label"
          color={
            isPill
              ? Colors.light.surface
              : isCurrentSpeaking
                ? Colors.light.error
                : Colors.light.primary
          }
          style={styles.label}>
          {isCurrentSpeaking ? 'Parar leitura' : label ?? 'Ouvir texto'}
        </UmbrellaText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBase: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleIcon: {
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
  speakingIcon: {
    backgroundColor: Colors.light.error,
  },
  buttonBase: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIdle: {
    backgroundColor: Colors.light.primary,
  },
  pillSpeaking: {
    backgroundColor: Colors.light.error,
  },
  outlineIdle: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  outlineSpeaking: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.error,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  label: {
    fontWeight: '600',
  },
});
