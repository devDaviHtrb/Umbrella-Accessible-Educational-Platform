// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.down': 'expand-more',
  'chevron.up': 'expand-less',

  'square.grid.2x2.fill': 'grid-view',
  'graduationcap.fill': 'school',
  'brain.head.profile': 'psychology',
  'calendar': 'calendar-today',
  'gearshape.fill': 'settings',

  'magnifyingglass': 'search',
  'bell.fill': 'notifications',
  'arrow.right': 'arrow-forward',
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'xmark': 'close',
  'checkmark.circle.fill': 'check-circle',
  'checkmark': 'check',
  'envelope.fill': 'email',
  'lock.fill': 'lock',

  'atom': 'science',
  'scalemass.fill': 'balance',
  'play.fill': 'play-arrow',
  'play.circle.fill': 'play-circle-filled',
  'circle': 'radio-button-unchecked',
  'circle.fill': 'circle',
  'clock.fill': 'schedule',
  'mappin.and.ellipse': 'place',
  'doc.fill': 'description',
  'mic.fill': 'mic',
  'person.fill': 'person',
  'person.2.fill': 'group',
  'rectangle.stack.fill': 'video-library',
  'star.fill': 'star',
  'chart.line.uptrend.xyaxis': 'trending-up',
  'line.3.horizontal.decrease': 'filter-list',
  'arrow.up.arrow.down': 'swap-vert',
  'ellipsis': 'more-vert',
  'alarm.fill': 'alarm',
  'exclamationmark.circle.fill': 'error',
  'book.fill': 'menu-book',
  'lightbulb.fill': 'lightbulb',
  'calendar.badge.plus': 'edit-calendar',
  'trash.fill': 'delete',
  'sparkles': 'auto-awesome',
  'speaker.wave.2.fill': 'volume-up',
  'arrow.up.left.and.arrow.down.right': 'fullscreen',
  'square.and.arrow.down': 'file-download',
  'doc.richtext.fill': 'slideshow',
  'person.2.wave.2.fill': 'record-voice-over',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}