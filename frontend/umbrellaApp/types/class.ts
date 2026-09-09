import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type ClassChatTab = 'public' | 'professor';

export type ClassChatMessage = {
  id: string;
  senderName: string;
  isSelf: boolean;
  time: string;
  text: string;
};

export type ClassResource = {
  id: string;
  name: string;
  /** ex: "2.1 MB • PDF" */
  meta: string;
  icon: IconSymbolName;
};