import { Platform } from 'react-native';

const palette = {
  primary: '#153E90',
  primaryStrong: '#0D2F7A',
  primaryLight: '#4C74C9',
  tertiary: '#0B4F4A',
  tertiaryLight: '#DCF3EE',
  secondaryFixed: '#D7E2FF',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  surfaceContainerLow: '#F2F3F9',
  onSurface: '#11181C',
  onSurfaceVariant: '#434653',
  outline: '#E3E5EF',
  error: '#BA1A1A',
  success: '#1E7D5A',
};

const lightTheme = {
  text: palette.onSurface,
  textSecondary: palette.onSurfaceVariant,
  background: palette.background,
  surface: palette.surface,
  surfaceContainerLow: palette.surfaceContainerLow,
  tint: palette.primary,
  primary: palette.primary,
  primaryStrong: palette.primaryStrong,
  primaryLight: palette.primaryLight,
  tertiary: palette.tertiary,
  tertiaryLight: palette.tertiaryLight,
  secondaryFixed: palette.secondaryFixed,
  outline: palette.outline,
  error: palette.error,
  success: palette.success,
  icon: palette.onSurfaceVariant,
  tabIconDefault: palette.onSurfaceVariant,
  tabIconSelected: palette.primary,
};

export const Colors = {
  light: lightTheme,
  dark: lightTheme,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const FontFamily = {
  regular: Platform.select({ default: 'Lexend_400Regular' }),
  medium: Platform.select({ default: 'Lexend_500Medium' }),
  semiBold: Platform.select({ default: 'Lexend_600SemiBold' }),
  bold: Platform.select({ default: 'Lexend_700Bold' }),
};

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
};

export const Typography: Record<
  'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption',
  TypeStyle
> = {
  display: { fontFamily: FontFamily.bold!, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: FontFamily.bold!, fontSize: 22, lineHeight: 28 },
  headline: { fontFamily: FontFamily.semiBold!, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: FontFamily.regular!, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: FontFamily.medium!, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: FontFamily.medium!, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FontFamily.regular!, fontSize: 12, lineHeight: 16 },
};
