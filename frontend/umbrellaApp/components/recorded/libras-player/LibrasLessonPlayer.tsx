// Libras Lesson Player — vídeo (relógio-mestre) + caption (legenda normal) +
// avatar VLibras numa WebView (legenda Libras), com o design system do Umbrella.
//
// - expo-video reproduz o MP4 e é a ÚNICA fonte de áudio e o relógio-mestre:
//   seu `timeUpdate` dirige o CueScheduler, que resolve o cue ativo.
// - A legenda NORMAL vira caption sincronizada sobre o vídeo.
// - A legenda LIBRAS alimenta o avatar: a cada transição de cue, o texto é
//   enviado à WebView; a fila anti-sobreposição e a velocidade vivem no
//   index.html do avatar.
// - Se a WebView falhar, cai para "vídeo + caption" (Requisito 4.6).

import { useEvent } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import WebViewImport from 'react-native-webview';

// react-native-webview expõe tipagens que, sob o React 19/RN 0.88 deste app,
// não satisfazem o JSX. Usamos um subconjunto pequeno e bem conhecido de props,
// então re-tipamos o componente como um ComponentType permissivo sobre esse
// subconjunto (o componente real e seu comportamento ficam intactos).
type AvatarWebViewProps = {
  ref?: (ref: WebViewHandle | null) => void;
  source: { uri: string };
  originWhitelist?: readonly string[];
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
  onError?: () => void;
  onHttpError?: () => void;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  allowFileAccess?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  style?: unknown;
  containerStyle?: unknown;
};
const AvatarWebView = WebViewImport as unknown as ComponentType<AvatarWebViewProps>;

/** Handle estrutural mínimo do ref do WebView (só o postMessage que usamos). */
type WebViewHandle = { postMessage(data: string): void };

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

import { AvatarBridge, type WebToAppMessage, type WebViewTransport } from './avatarBridge';
import { createCueScheduler } from './cueScheduler';
import { findActiveCue, parseSrt, type TranscriptCue } from './srt';

export type LibrasLessonPlayerProps = {
  /** URL do MP4 (Cloudinary). */
  videoUrl: string;
  /** Texto SRT da legenda normal (caption). */
  normalSrt?: string | null;
  /** Texto SRT da legenda Libras (avatar). */
  librasSrt?: string | null;
  /** URL do bundle do avatar (index.html servido pelo backend). */
  playerBundleUri?: string | null;
  /** Velocidade do avatar (VLibras setSpeed). 1 = normal. */
  avatarSpeed?: number;
};

const AVATAR_ORIGIN_WHITELIST = ['file://*', 'about:*', 'http://*', 'https://*'] as const;

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function LibrasLessonPlayer({
  videoUrl,
  normalSrt,
  librasSrt,
  playerBundleUri,
  avatarSpeed = 2,
}: LibrasLessonPlayerProps) {
  const webViewRef = useRef<WebViewHandle | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  // Fullscreen CUSTOMIZADO (JS): expande o player inteiro (vídeo + avatar +
  // legenda) num Modal. O fullscreen NATIVO do expo-video não serve porque move
  // o vídeo para uma camada nativa onde o overlay do avatar some.
  const [fullscreen, setFullscreen] = useState(false);
  // Toggles de acessibilidade: o usuário liga/desliga a legenda e o avatar.
  const [captionsOn, setCaptionsOn] = useState(true);
  const [avatarOn, setAvatarOn] = useState(true);

  // Parse das duas legendas (memoizado).
  const normalCues = useMemo(() => (normalSrt ? parseSrt(normalSrt) : []), [normalSrt]);
  const librasCues = useMemo(() => (librasSrt ? parseSrt(librasSrt) : []), [librasSrt]);

  // O avatar existe quando há legenda Libras + bundle + sem falha; `avatarOn`
  // é o toggle do usuário (liga/desliga o intérprete virtual).
  const avatarAvailable = librasCues.length > 0 && !!playerBundleUri && !avatarFailed;
  const hasAvatar = avatarAvailable && avatarOn;

  // Bridge app ⇄ WebView (criada uma vez).
  const bridge = useMemo(() => {
    const transport: WebViewTransport = {
      postMessage: (json: string) => webViewRef.current?.postMessage(json),
    };
    return new AvatarBridge(transport);
  }, []);

  // Cue ativo da legenda Libras guardado para reenvio ao avatar no "load".
  const activeLibrasCueRef = useRef<TranscriptCue | null>(null);

  // Scheduler da legenda Libras: cada transição envia o texto ao avatar.
  const librasScheduler = useMemo(() => createCueScheduler(librasCues), [librasCues]);

  // expo-video: relógio-mestre e única fonte de áudio.
  const player = useVideoPlayer(videoUrl, (p) => {
    p.timeUpdateEventInterval = 0.05; // 50 ms: detecção de cue quase imediata
    p.loop = false;
  });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  // Posição atual do vídeo num ref, para o callback do `load` recalcular o cue
  // ativo sem depender de closure defasada.
  const positionMsRef = useRef(0);

  // Dirige o scheduler e a caption pelo relógio do vídeo.
  useEffect(() => {
    const ms = Math.round((currentTime ?? 0) * 1000);
    positionMsRef.current = ms;
    setPositionMs(ms);
    librasScheduler.update(ms);
  }, [currentTime, librasScheduler]);

  // Transição de cue da legenda Libras → envia ao avatar (quando pronto).
  useEffect(() => {
    const unsub = librasScheduler.onCueChange((cue) => {
      activeLibrasCueRef.current = cue;
      if (cue && avatarReady && hasAvatar) {
        bridge.sendCue(cue.id, cue.textPtBr);
      }
    });
    return unsub;
  }, [librasScheduler, avatarReady, hasAvatar, bridge]);

  // Mensagens vindas da WebView (load/erro).
  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      bridge.receive(event.nativeEvent.data);
    },
    [bridge],
  );

  useEffect(() => {
    const unsub = bridge.onMessage((msg: WebToAppMessage) => {
      if (msg.type === 'load') {
        setAvatarReady(true);
        bridge.init({ defaultSpeed: avatarSpeed });
        bridge.setSpeed(avatarSpeed);
        // Recupera a fala que já está ativa agora que o avatar ficou pronto.
        // Recalcula o cue pela posição ATUAL do vídeo (não por um ref que pode
        // estar defasado), cobrindo o caso das PRIMEIRAS falas, que passam
        // enquanto o Unity ainda carregava.
        const cue =
          findActiveCue(librasCues, positionMsRef.current) ?? activeLibrasCueRef.current;
        if (cue) {
          bridge.resetCueDeduplication();
          bridge.sendCue(cue.id, cue.textPtBr);
        }
      } else if (msg.type === 'error') {
        setAvatarFailed(true);
      }
    });
    return unsub;
  }, [bridge, avatarSpeed, librasCues]);

  // Gira a tela: paisagem ao entrar em tela cheia, portrait ao sair.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (fullscreen) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch {
        // Em plataformas sem suporte (web), ignora silenciosamente.
      }
      void cancelled;
    })();
    return () => {
      cancelled = true;
    };
  }, [fullscreen]);

  // Ao desmontar o player, garante que a orientação volta ao normal.
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const handleWebViewError = useCallback(() => setAvatarFailed(true), []);

  // Caption: cue ativo da legenda normal pela posição do vídeo.
  const activeCaption = useMemo(
    () => findActiveCue(normalCues, positionMs),
    [normalCues, positionMs],
  );

  // Conteúdo do player (vídeo + avatar + legenda + botão fullscreen). O mesmo
  // conteúdo é usado inline e dentro do Modal de tela cheia. O <VideoView> só
  // é montado uma vez por vez (inline OU fullscreen), controlado por `inModal`,
  // para não haver duas views concorrendo pelo mesmo player.
  const renderPlayer = (inModal: boolean) => (
    <View style={inModal ? styles.fsWrapper : styles.videoWrapper}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
      />

      {hasAvatar && playerBundleUri ? (
        <View style={inModal ? styles.avatarOverlayFs : styles.avatarOverlay} pointerEvents="none">
          <AvatarWebView
            ref={(r) => {
              webViewRef.current = r;
            }}
            source={{ uri: playerBundleUri }}
            originWhitelist={[...AVATAR_ORIGIN_WHITELIST]}
            onMessage={handleWebViewMessage}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            mediaPlaybackRequiresUserAction
            style={styles.avatarWebView}
            containerStyle={styles.avatarWebViewContainer}
          />
          {!avatarReady ? (
            <View style={styles.avatarLoading} pointerEvents="none">
              <ActivityIndicator color={Colors.light.surface} size="small" />
            </View>
          ) : null}
        </View>
      ) : null}

      {hasAvatar ? (
        <View style={styles.disclosure} pointerEvents="none">
          <IconSymbol name="person.2.wave.2.fill" size={14} color="#fff" />
          <UmbrellaText variant="caption" style={styles.disclosureText}>
            Tradução automática experimental por avatar; não equivale a intérprete humano.
          </UmbrellaText>
        </View>
      ) : null}

      {captionsOn && activeCaption ? (
        <View style={styles.captionBox} pointerEvents="none">
          <UmbrellaText variant="body" style={styles.captionText}>
            {activeCaption.textPtBr}
          </UmbrellaText>
        </View>
      ) : null}

      {/* Barra de controles de acessibilidade (legenda / avatar / tela cheia). */}
      <View style={styles.topControls}>
        {normalCues.length > 0 ? (
          <Pressable
            onPress={() => setCaptionsOn((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: captionsOn }}
            accessibilityLabel={captionsOn ? 'Ocultar legenda' : 'Mostrar legenda'}
            style={[styles.ctrlButton, captionsOn && styles.ctrlButtonActive]}
            hitSlop={8}>
            <IconSymbol name="captions.bubble" size={18} color="#fff" />
          </Pressable>
        ) : null}

        {avatarAvailable ? (
          <Pressable
            onPress={() => setAvatarOn((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: avatarOn }}
            accessibilityLabel={avatarOn ? 'Ocultar avatar de Libras' : 'Mostrar avatar de Libras'}
            style={[styles.ctrlButton, avatarOn && styles.ctrlButtonActive]}
            hitSlop={8}>
            <IconSymbol name="person.2.wave.2.fill" size={18} color="#fff" />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setFullscreen(!inModal)}
          accessibilityRole="button"
          accessibilityLabel={inModal ? 'Sair da tela cheia' : 'Tela cheia'}
          style={styles.ctrlButton}
          hitSlop={8}>
          <IconSymbol
            name={inModal ? 'arrow.down.right.and.arrow.up.left' : 'arrow.up.left.and.arrow.down.right'}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Inline: só renderiza o VideoView quando NÃO está em tela cheia. */}
      {!fullscreen ? renderPlayer(false) : <View style={styles.videoWrapper} />}

      <Modal
        visible={fullscreen}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setFullscreen(false)}>
        <View style={styles.fsBackdrop}>{fullscreen ? renderPlayer(true) : null}</View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  videoWrapper: {
    width: '100%',
    // Player maior: usa boa parte da altura da tela, com um mínimo confortável,
    // em vez do 16/9 estreito que ficava pequeno em telas verticais.
    height: Math.min(Math.round(SCREEN_HEIGHT * 0.6), 520),
    minHeight: 300,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  avatarOverlay: {
    position: 'absolute',
    right: Spacing.sm,
    // Acima da barra de controles nativa do vídeo, para não cobri-la.
    bottom: 64,
    // Avatar menor e proporcional (antes 120x165 cobria muito do vídeo).
    width: 92,
    height: 118,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  // Tela cheia: ocupa todo o Modal; avatar um pouco maior que no inline.
  fsWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  fsBackdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  avatarOverlayFs: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 72,
    width: 120,
    height: 155,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  topControls: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctrlButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  avatarWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  avatarWebViewContainer: {
    backgroundColor: 'transparent',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclosure: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  disclosureText: {
    color: '#fff',
    flex: 1,
  },
  captionBox: {
    position: 'absolute',
    // Acima da barra de controles nativa (timeline), para não cobrir nem
    // atrapalhar o toque ao avançar o vídeo. Deixa `left` livre do avatar.
    bottom: 64,
    left: Spacing.sm,
    right: 108,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  captionText: {
    color: '#fff',
    textAlign: 'center',
  },
});
