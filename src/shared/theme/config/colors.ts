/**
 * Tema de colores sin UI Kitten. Usar con useAppTheme().
 */
export const lightColors = {
  primary: '#44B778',
  primaryDark: '#2E8A57',
  background: '#FFFFFF',
  backgroundSecondary: '#F7F9FC',
  backgroundTertiary: '#EDF1F7',
  text: '#222B45',
  textSecondary: '#8F9BB3',
  textDisabled: '#C5CEE0',
  border: '#E4E9F2',
  borderDark: '#C5CEE0',
  success: '#00E096',
  warning: '#FFAA00',
  danger: '#FF3D71',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const darkColors = {
  primary: '#44B778',
  primaryDark: '#9DDFBD',
  background: '#111111',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#222222',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textDisabled: '#555555',
  border: '#333333',
  borderDark: '#555555',
  success: '#00E096',
  warning: '#FFAA00',
  danger: '#FF3D71',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type AppThemeColors = typeof lightColors | typeof darkColors;
