import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export interface SpeechContextData {
  isSpeaking: boolean;
  currentText: string | null;
  speak: (text: string, options?: Speech.SpeechOptions) => Promise<void>;
  stop: () => Promise<void>;
  toggleSpeak: (text: string, options?: Speech.SpeechOptions) => Promise<void>;
}

const SpeechContext = createContext<SpeechContextData | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      setCurrentText(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Erro ao interromper síntese de voz:', error);
    }
  }, []);

  const speak = useCallback(
    async (text: string, options?: Speech.SpeechOptions) => {
      if (!text || text.trim().length === 0) return;

      try {

        await Speech.stop();
        setIsSpeaking(true);
        setCurrentText(text);

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Speech.speak(text, {
          language: 'pt-BR',
          pitch: 1.0,
          rate: 0.95,
          onDone: () => {
            setIsSpeaking(false);
            setCurrentText(null);
          },
          onStopped: () => {
            setIsSpeaking(false);
            setCurrentText(null);
          },
          onError: (err) => {
            console.warn('Erro na síntese de voz:', err);
            setIsSpeaking(false);
            setCurrentText(null);
          },
          ...options,
        });
      } catch (error) {
        console.warn('Erro ao reproduzir fala:', error);
        setIsSpeaking(false);
        setCurrentText(null);
      }
    },
    []
  );

  const toggleSpeak = useCallback(
    async (text: string, options?: Speech.SpeechOptions) => {
      if (isSpeaking && currentText === text) {
        await stop();
      } else {
        await speak(text, options);
      }
    },
    [isSpeaking, currentText, speak, stop]
  );


  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        isSpeaking,
        currentText,
        speak,
        stop,
        toggleSpeak,
      }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech(): SpeechContextData {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech deve ser utilizado dentro de um SpeechProvider');
  }
  return context;
}
