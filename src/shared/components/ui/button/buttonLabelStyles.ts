import { StyleSheet } from 'react-native';

/** Tipografía compartida por ButtonPrimary, ButtonTransparent y ButtonFrosted. */
export const buttonLabelStyles = StyleSheet.create({
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  labelDisabled: {
    opacity: 0.55,
  },
});
