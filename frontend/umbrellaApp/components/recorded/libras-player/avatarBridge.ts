// AvatarBridge — serialização app ⇄ WebView do avatar VLibras.
// Portado de apps/mobile. A fila anti-sobreposição e o controle de velocidade
// vivem no index.html do avatar; aqui só enviamos comandos e recebemos eventos.

export type AppToWebMessage =
  | { type: 'init'; config: { avatarName?: string; defaultSpeed?: number } }
  | { type: 'cue'; cueId: string | null; text: string }
  | { type: 'setSpeed'; speed: number }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'changeAvatar'; name: string };

export type WebToAppMessage =
  | { type: 'load' }
  | { type: 'gloss:start'; cueId: string | null }
  | { type: 'gloss:end'; cueId: string | null }
  | { type: 'animation:progress'; value: number }
  | { type: 'animation:end'; cueId: string | null }
  | { type: 'error'; code: string; message: string };

export interface WebViewTransport {
  postMessage(json: string): void;
}

export type WebToAppHandler = (msg: WebToAppMessage) => void;
export type Unsubscribe = () => void;

export class AvatarBridge {
  private readonly transport: WebViewTransport;
  private readonly handlers = new Set<WebToAppHandler>();
  private lastSentCueId: string | null = null;

  constructor(transport: WebViewTransport) {
    this.transport = transport;
  }

  init(config: { avatarName?: string; defaultSpeed?: number }): void {
    this.lastSentCueId = null;
    this.send({ type: 'init', config });
  }

  sendCue(cueId: string, text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    if (cueId === this.lastSentCueId) return;
    this.lastSentCueId = cueId;
    this.send({ type: 'cue', cueId, text });
  }

  setSpeed(speed: number): void {
    this.send({ type: 'setSpeed', speed });
  }

  pause(): void {
    this.send({ type: 'pause' });
  }

  stop(): void {
    this.lastSentCueId = null;
    this.send({ type: 'stop' });
  }

  /** Limpa o guard de duplicados (para reenviar o cue ativo após o load). */
  resetCueDeduplication(): void {
    this.lastSentCueId = null;
  }

  onMessage(handler: WebToAppHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Alimenta um payload bruto (event.nativeEvent.data) do WebView. */
  receive(rawData: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      return;
    }
    if (!isWebToAppMessage(parsed)) return;
    for (const handler of [...this.handlers]) handler(parsed);
  }

  private send(message: AppToWebMessage): void {
    this.transport.postMessage(JSON.stringify(message));
  }
}

function isWebToAppMessage(value: unknown): value is WebToAppMessage {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  switch (record.type) {
    case 'load':
      return true;
    case 'gloss:start':
    case 'gloss:end':
    case 'animation:end':
      return true;
    case 'animation:progress':
      return typeof record.value === 'number';
    case 'error':
      return typeof record.code === 'string';
    default:
      return false;
  }
}
