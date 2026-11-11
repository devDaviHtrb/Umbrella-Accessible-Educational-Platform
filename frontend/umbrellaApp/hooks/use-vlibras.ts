import { Platform } from 'react-native';

import { VLIBRAS_CONFIG } from '@/constants/vlibras';

export type VLibrasStatus = 'unavailable' | 'loading' | 'ready' | 'failed';

export type VLibrasState = {
  status: VLibrasStatus;
  message: string;
};

export function useVLibras(): VLibrasState {
  if (!VLIBRAS_CONFIG.supportedPlatforms.includes(Platform.OS)) {
    return {
      status: 'unavailable',
      message: 'O widget do VLibras funciona apenas em navegadores. Ele não está disponível no aplicativo Android ou iOS.',
    };
  }

  return {
    status: 'unavailable',
    message: 'A integração com o VLibras ainda está em desenvolvimento e será disponibilizada em breve.',
  };
}
