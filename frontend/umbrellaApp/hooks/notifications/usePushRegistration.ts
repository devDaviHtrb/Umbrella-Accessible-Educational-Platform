import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import { useAuthContext } from '@/hooks/api/auth/authContext';

// Mostra a notificação mesmo com o app em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra o dispositivo para push: pede permissão, obtém o Expo push token e
 * envia ao backend (POST logged/notifications/device-token). Deve ser chamado
 * uma vez num ponto logado do app (ex.: layout das abas).
 *
 * Push remoto só funciona em dispositivo físico com dev build — no Expo Go
 * (SDK 53+) o push remoto é desabilitado pelo Expo. Em emulador/Expo Go o
 * registro falha silenciosamente e o app segue funcionando (as notificações
 * continuam visíveis no painel, só não chegam como push no sistema).
 */
export function usePushRegistration() {
  const { post } = useUmbrellaApi();
  const { userToken } = useAuthContext();
  const registered = useRef<string | null>(null);

  useEffect(() => {
    if (!userToken) return;

    (async () => {
      try {
        if (!Device.isDevice) return; // emulador não suporta push remoto

        // Android: canal padrão para exibir notificações.
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        // O projectId do EAS é obrigatório para obter o Expo push token em
        // builds standalone/dev. Lê de app.json (extra.eas.projectId).
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          (Constants as any)?.easConfig?.projectId;
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        const token = tokenResponse.data;
        if (!token || registered.current === token) return;

        await post('logged/notifications/device-token', { token });
        registered.current = token;
      } catch {
        // Expo Go / sem suporte: ignora (push é um extra; o painel funciona).
      }
    })();
  }, [userToken, post]);
}
