import type { AppTheme } from '../../theme/useAppTheme';

export function getPermissionFullScreenColors(theme: AppTheme) {
  if (theme.isDark) {
    return {
      background: '#1a1a1a',
      title: theme.white,
      hint: '#9ca3af',
    };
  }

  return {
    background: theme.backgroundTertiary,
    title: theme.text,
    hint: theme.textSecondary,
  };
}
