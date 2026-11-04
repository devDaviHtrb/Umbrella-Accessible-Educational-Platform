import { Colors } from '@/constants/theme';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type FontSizeOption = 'small' | 'default' | 'large';

export type Preferences = {
  colorBlindMode: ColorBlindMode;
  highContrast: boolean;
  fontSize: FontSizeOption;
  textToSpeech: boolean;
  focusMode: boolean;
  notifications: boolean;
};

export const PREFERENCES_STORAGE_KEY = '@umbrella_preferences';

export const DEFAULT_PREFERENCES: Preferences = {
  colorBlindMode: 'none',
  highContrast: false,
  fontSize: 'default',
  textToSpeech: false,
  focusMode: false,
  notifications: true,
};

export const COLOR_BLIND_OPTIONS: { id: ColorBlindMode; label: string }[] = [
  { id: 'none', label: 'Desativado' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
  { id: 'achromatopsia', label: 'Acromatopsia' },
];

export const FONT_SIZE_OPTIONS: { id: FontSizeOption; label: string }[] = [
  { id: 'small', label: 'Pequeno' },
  { id: 'default', label: 'Padrão' },
  { id: 'large', label: 'Grande' },
];

export const FONT_SCALE: Record<FontSizeOption, number> = {
  small: 0.9,
  default: 1,
  large: 1.2,
};

const COLOR_BLIND_IDS = COLOR_BLIND_OPTIONS.map((option) => option.id);
const FONT_SIZE_IDS = FONT_SIZE_OPTIONS.map((option) => option.id);

export function sanitizePreferences(raw: unknown): Preferences {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  return {
    colorBlindMode: COLOR_BLIND_IDS.includes(source.colorBlindMode as ColorBlindMode)
      ? (source.colorBlindMode as ColorBlindMode)
      : DEFAULT_PREFERENCES.colorBlindMode,
    highContrast:
      typeof source.highContrast === 'boolean' ? source.highContrast : DEFAULT_PREFERENCES.highContrast,
    fontSize: FONT_SIZE_IDS.includes(source.fontSize as FontSizeOption)
      ? (source.fontSize as FontSizeOption)
      : DEFAULT_PREFERENCES.fontSize,
    textToSpeech:
      typeof source.textToSpeech === 'boolean' ? source.textToSpeech : DEFAULT_PREFERENCES.textToSpeech,
    focusMode: typeof source.focusMode === 'boolean' ? source.focusMode : DEFAULT_PREFERENCES.focusMode,
    notifications:
      typeof source.notifications === 'boolean' ? source.notifications : DEFAULT_PREFERENCES.notifications,
  };
}

type ColorMap = Record<string, string>;

const base = Colors.light;

const HIGH_CONTRAST: ColorMap = {
  [base.text]: '#000000',
  [base.textSecondary]: '#1C2230',
  [base.background]: '#FFFFFF',
  [base.surfaceContainerLow]: '#E6E9F2',
  [base.outline]: '#5F6676',
  [base.primary]: '#0A2C73',
  [base.primaryStrong]: '#061F57',
  [base.primaryLight]: '#2A4FA8',
  [base.tertiary]: '#063D39',
  [base.tertiaryLight]: '#C4E8DF',
  [base.secondaryFixed]: '#C3D4FF',
  [base.error]: '#8E0F0F',
  [base.success]: '#0A5A3C',
};

const COLOR_BLIND_SEMANTICS: Record<
  Exclude<ColorBlindMode, 'none' | 'achromatopsia'>,
  { normal: ColorMap; contrast: ColorMap }
> = {
  protanopia: {
    normal: { [base.error]: '#B84A00', [base.success]: '#007A87' },
    contrast: { [base.error]: '#8F3A00', [base.success]: '#005A8C' },
  },
  deuteranopia: {
    normal: { [base.error]: '#B84A00', [base.success]: '#007A87' },
    contrast: { [base.error]: '#8F3A00', [base.success]: '#005A8C' },
  },
  tritanopia: {
    normal: {
      [base.tertiary]: '#7A1F5C',
      [base.tertiaryLight]: '#F3DCEB',
      [base.success]: '#7E781B',
    },
    contrast: {
      [base.tertiary]: '#5C1745',
      [base.tertiaryLight]: '#E8C4DA',
      [base.success]: '#5C5700',
    },
  },
};

function normalizeHex(color: string): string {
  return color.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function toGray(hex: string): string {
  const [red, green, blue] = hexToRgb(hex);
  const luminance = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
  return rgbToHex([luminance, luminance, luminance]);
}

export function buildColorMap(preferences: Preferences): ColorMap {
  const map: ColorMap = {};
  const baseValues = Object.values(base).map(normalizeHex);

  for (const value of baseValues) map[value] = value;

  if (preferences.highContrast) {
    for (const [from, to] of Object.entries(HIGH_CONTRAST)) map[normalizeHex(from)] = normalizeHex(to);
  }

  const mode = preferences.colorBlindMode;
  if (mode !== 'none' && mode !== 'achromatopsia') {
    const variant = COLOR_BLIND_SEMANTICS[mode];
    const overrides = preferences.highContrast ? variant.contrast : variant.normal;
    for (const [from, to] of Object.entries(overrides)) map[normalizeHex(from)] = normalizeHex(to);
  }

  if (mode === 'achromatopsia') {
    for (const key of Object.keys(map)) map[key] = toGray(map[key]);
  }

  return map;
}

export function translateColor(map: ColorMap, color: string): string {
  if (typeof color !== 'string' || !color.startsWith('#')) return color;

  if (/^#[0-9a-fA-F]{6}$/.test(color)) return map[normalizeHex(color)] ?? color;

  if (/^#[0-9a-fA-F]{8}$/.test(color)) {
    const mapped = map[normalizeHex(color.slice(0, 7))];
    return mapped ? `${mapped}${color.slice(7)}` : color;
  }

  return color;
}

export function buildRootFilter(preferences: Preferences): string | undefined {
  const parts: string[] = [];
  if (preferences.colorBlindMode === 'achromatopsia') parts.push('grayscale(1)');
  if (preferences.highContrast) parts.push('contrast(1.15)');
  return parts.length > 0 ? parts.join(' ') : undefined;
}
