import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { LibrasLessonPlayer } from '@/components/recorded/libras-player/LibrasLessonPlayer';
import { VLibrasPanel } from '@/components/recorded/vlibras-panel';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useLessonSubtitles } from '@/hooks/api/courses/useLessonSubtitles';
import { AVATAR_BUNDLE_URI } from '@/services/umbrellaApi';
import { openMaterial } from '@/utils/open-material';

type LessonParams = {
  title?: string;
  description?: string;
  url?: string;
  category?: string;
  moduleTitle?: string;
  sizeLabel?: string;
  videoId?: string;
};

export default function RecordedLessonScreen() {
  const {
    title = '',
    description = '',
    url,
    category,
    moduleTitle,
    sizeLabel,
    videoId,
  } = useLocalSearchParams<LessonParams>();

  const { state } = useLessonSubtitles(videoId);

  // Legendas: preferir as geradas (via videoId); se não houver videoId/legenda,
  // o player ainda reproduz o vídeo sem caption/avatar.
  const data = state.phase === 'ready' ? state.data : null;
  const videoUrl = data?.videoUrl ?? url;
  const normalStatus = data?.normal?.status ?? null;
  const librasStatus = data?.libras?.status ?? null;
  const processing = normalStatus === 'PROCESSING' || librasStatus === 'PROCESSING';

  // Status para o VLibrasPanel (resumo da tradução em Libras).
  const vlibrasStatus =
    librasStatus === 'READY' ? 'ready' : librasStatus === 'PROCESSING' ? 'loading' : librasStatus === 'FAILED' ? 'failed' : 'unavailable';
  const vlibrasMessage =
    librasStatus === 'READY'
      ? 'Tradução em Libras disponível no player acima.'
      : librasStatus === 'PROCESSING'
        ? 'Gerando a tradução em Libras a partir do áudio do vídeo…'
        : librasStatus === 'FAILED'
          ? (data?.libras?.error ?? 'Não foi possível gerar a tradução em Libras.')
          : 'Tradução automática em Libras indisponível para esta aula.';

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {category ? (
          <UmbrellaText variant="label" color={Colors.light.primary}>
            {category.toUpperCase()}
          </UmbrellaText>
        ) : null}
        <UmbrellaText variant="display">{title}</UmbrellaText>
        {moduleTitle ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Módulo: {moduleTitle}
          </UmbrellaText>
        ) : null}
        {description ? <UmbrellaText variant="body">{description}</UmbrellaText> : null}
      </View>

      <Card style={styles.playerCard} padded={false}>
        {videoId && state.phase === 'loading' ? (
          <View style={styles.playerFallback}>
            <ActivityIndicator color={Colors.light.primary} />
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              Carregando aula…
            </UmbrellaText>
          </View>
        ) : videoUrl ? (
          <LibrasLessonPlayer
            videoUrl={videoUrl}
            normalSrt={data?.normal?.status === 'READY' ? data?.normal?.content : null}
            librasSrt={data?.libras?.status === 'READY' ? data?.libras?.content : null}
            playerBundleUri={AVATAR_BUNDLE_URI}
            avatarSpeed={2.5}
          />
        ) : (
          <View style={styles.playerFallback}>
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Vídeo indisponível.
            </UmbrellaText>
            {url ? (
              <PrimaryButton
                label="Abrir vídeo"
                icon="play.fill"
                iconPosition="leading"
                onPress={() => openMaterial({ title, url, description })}
              />
            ) : null}
          </View>
        )}
      </Card>

      {processing ? (
        <Card style={styles.processing}>
          <View style={styles.processingHeader}>
            <ActivityIndicator color={Colors.light.primary} size="small" />
            <UmbrellaText variant="headline" style={styles.processingTitle}>
              Preparando acessibilidade
            </UmbrellaText>
            <StatusBadge label="PROCESSANDO" tone="primary" />
          </View>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            As legendas e a tradução em Libras estão sendo geradas a partir do áudio do vídeo. Isso
            pode levar alguns minutos; a tela atualiza sozinha quando ficarem prontas.
          </UmbrellaText>
        </Card>
      ) : null}

      <VLibrasPanel status={vlibrasStatus} message={vlibrasMessage} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  playerCard: {
    overflow: 'hidden',
  },
  playerFallback: {
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  processing: {
    gap: Spacing.sm,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  processingTitle: {
    flex: 1,
  },
});
