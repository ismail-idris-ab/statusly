/**
 * Design tokens (Doc 04 — UI/UX Brief) as raw hex.
 *
 * Prefer NativeWind utility classes (`bg-primary`, `text-text-muted`, ...) in
 * components. Use these constants only where a raw color string is required:
 * StatusBar, native module props, gradients, react-navigation theme, etc.
 * Never hardcode hex in components — import from here.
 */
export const palette = {
  primary: '#0E8F6E',
  primaryDark: '#0A6E55',
  primaryLight: '#14B88C',
  accent: '#25D07A',
  accentGlow: '#3DE38B',
  onPrimary: '#FFFFFF',
  danger: '#E5484D',
} as const;

export const lightTheme = {
  bg: '#FFFFFF',
  surface: '#F4F7F5',
  surfaceAlt: '#E9F2EC',
  text: '#0F1A16',
  textMuted: '#5B6B64',
  border: '#DDE6E1',
} as const;

export const darkTheme = {
  bg: '#0B1411',
  surface: '#13201B',
  surfaceAlt: '#1B2C24',
  text: '#EAF3EE',
  textMuted: '#9DB0A8',
  border: '#24352D',
} as const;

export type ColorSchemeName = 'light' | 'dark';

export const themeColors = (scheme: ColorSchemeName) =>
  scheme === 'dark'
    ? { ...palette, ...darkTheme }
    : { ...palette, ...lightTheme };

/** Radii (Doc 04). */
export const radius = {
  card: 12,
  pill: 999,
} as const;
