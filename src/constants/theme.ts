/**
 * Semantic colors and spacing used across the app (light and dark).
 */

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    textSecondary: '#60646C',
    primary: '#1B6BC7',
    onPrimary: '#ffffff',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    textSecondary: '#B0B4BA',
    primary: '#4B9BFF',
    onPrimary: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
