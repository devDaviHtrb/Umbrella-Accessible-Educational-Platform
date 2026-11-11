import umbrellaApi from '@/services/umbrellaApi';
import type { ChatStatus } from '@/types/messages';
import { buildChatSocketUrl } from '@/utils/chat';
import { isJwtExpired } from '@/utils/jwt';
import { buildFrame, parseFrames } from '@/utils/stomp';

type MessageListener = (body: string) => void;

type Subscription = {
  id: string;
  listeners: Set<MessageListener>;
};

const MAX_ATTEMPTS = 5;
const MAX_DELAY = 15000;

let socket: WebSocket | null = null;
let token: string | null = null;
let status: ChatStatus = 'disconnected';
let attempts = 0;
let manualClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let nextSubscriptionId = 0;

const subscriptions = new Map<string, Subscription>();
const statusListeners = new Set<(status: ChatStatus) => void>();

function setStatus(next: ChatStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

function sendFrame(command: string, headers: Record<string, string> = {}, body = '') {
  if (socket && socket.readyState === 1) socket.send(buildFrame(command, headers, body));
}

function sendSubscribe(destination: string, subscription: Subscription) {
  sendFrame('SUBSCRIBE', { id: subscription.id, destination });
}

function handleData(data: string) {
  parseFrames(data).forEach((frame) => {
    if (frame.command === 'CONNECTED') {
      attempts = 0;
      setStatus('connected');
      subscriptions.forEach((subscription, destination) => sendSubscribe(destination, subscription));
    } else if (frame.command === 'MESSAGE') {
      const subscription = Array.from(subscriptions.values()).find((item) => item.id === frame.headers.subscription);
      subscription?.listeners.forEach((listener) => listener(frame.body));
    }
  });
}

function scheduleReconnect() {
  if (!token || isJwtExpired(token)) {
    setStatus('disconnected');
    return;
  }
  attempts += 1;
  if (attempts > MAX_ATTEMPTS) {
    setStatus('failed');
    return;
  }
  setStatus('reconnecting');
  const delay = Math.min(2000 * 2 ** (attempts - 1), MAX_DELAY);
  reconnectTimer = setTimeout(openSocket, delay);
}

function openSocket() {
  reconnectTimer = null;
  if (!token || isJwtExpired(token)) {
    setStatus('disconnected');
    return;
  }

  if (attempts === 0) setStatus('connecting');
  const url = buildChatSocketUrl(umbrellaApi.defaults.baseURL ?? '');
  const ws = new WebSocket(url);
  socket = ws;

  ws.onopen = () => {
    if (ws !== socket) return;
    sendFrame('CONNECT', {
      'accept-version': '1.2',
      'heart-beat': '0,0',
      Authorization: `Bearer ${token}`,
    });
  };

  ws.onmessage = (event) => {
    if (ws !== socket || typeof event.data !== 'string') return;
    handleData(event.data);
  };

  ws.onclose = () => {
    if (ws !== socket) return;
    socket = null;
    if (manualClose) {
      setStatus('disconnected');
    } else {
      scheduleReconnect();
    }
  };
}

function closeSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const current = socket;
  socket = null;
  if (current) {
    if (current.readyState === 1) current.send(buildFrame('DISCONNECT'));
    current.close();
  }
}

export const chatSocket = {
  connect(accessToken: string) {
    if (accessToken === token && socket) return;
    closeSocket();
    token = accessToken;
    manualClose = false;
    attempts = 0;
    openSocket();
  },

  disconnect() {
    manualClose = true;
    token = null;
    closeSocket();
    subscriptions.clear();
    setStatus('disconnected');
  },

  retry() {
    if (!token || socket || status === 'connected') return;
    manualClose = false;
    attempts = 0;
    openSocket();
  },

  subscribe(destination: string, listener: MessageListener) {
    let subscription = subscriptions.get(destination);
    if (!subscription) {
      subscription = { id: `sub-${nextSubscriptionId++}`, listeners: new Set() };
      subscriptions.set(destination, subscription);
      if (status === 'connected') sendSubscribe(destination, subscription);
    }
    subscription.listeners.add(listener);
    const current = subscription;

    return () => {
      current.listeners.delete(listener);
      if (current.listeners.size === 0 && subscriptions.get(destination) === current) {
        subscriptions.delete(destination);
        if (status === 'connected') sendFrame('UNSUBSCRIBE', { id: current.id });
      }
    };
  },

  send(destination: string, body: string): boolean {
    if (status !== 'connected') return false;
    sendFrame('SEND', { destination, 'content-type': 'application/json' }, body);
    return true;
  },

  getStatus: () => status,

  onStatus(listener: (status: ChatStatus) => void) {
    statusListeners.add(listener);
    return () => {
      statusListeners.delete(listener);
    };
  },
};
