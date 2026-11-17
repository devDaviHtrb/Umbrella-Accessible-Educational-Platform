import { useCallback, useEffect, useState } from 'react';

import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';

export type SubtitleState = {
  status: 'PROCESSING' | 'READY' | 'FAILED' | null;
  url: string | null;
  content: string | null;
  error: string | null;
};

export type VideoWithSubtitles = {
  videoId: number;
  videoUrl: string;
  duration: number | null;
  normal: SubtitleState | null;
  libras: SubtitleState | null;
};

type LoadState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: VideoWithSubtitles };

/**
 * Busca o vídeo e suas duas legendas (normal/Libras) por videoId. Faz polling
 * leve enquanto alguma legenda estiver PROCESSING, para refletir a geração
 * assíncrona no backend.
 */
export function useLessonSubtitles(videoId?: string) {
  const { get } = useUmbrellaApi();
  const [state, setState] = useState<LoadState>({ phase: 'idle' });

  const load = useCallback(async () => {
    if (!videoId) {
      setState({ phase: 'idle' });
      return;
    }
    try {
      const data = await get<VideoWithSubtitles>(`logged/storage/video/${videoId}/subtitles`);
      setState({ phase: 'ready', data });
    } catch (err: any) {
      setState({ phase: 'error', message: err?.response?.data?.message ?? 'Falha ao carregar legendas.' });
    }
  }, [get, videoId]);

  useEffect(() => {
    if (!videoId) return;
    setState({ phase: 'loading' });
    load();
  }, [videoId, load]);

  // Polling enquanto alguma legenda está sendo gerada.
  useEffect(() => {
    if (state.phase !== 'ready') return;
    const { normal, libras } = state.data;
    const processing = normal?.status === 'PROCESSING' || libras?.status === 'PROCESSING';
    if (!processing) return;
    const timer = setTimeout(load, 5000);
    return () => clearTimeout(timer);
  }, [state, load]);

  return { state, reload: load };
}
