import { StyleSheet } from 'react-native';

export const globalColors = {
  primary: '#44B778',
  secondary: '#2ecc71',
  background: '#f5f6fa',
  gradient: ['#cad63a', '#33a888'],
  text: '#2d3436',
};

/** Mismo valor que `scrollContent.paddingHorizontal` (p. ej. perfil). */
export const CONTENT_HORIZONTAL_PADDING = 20;

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
});
