import { StyleSheet } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { CONTENT_HORIZONTAL_PADDING } from '../../../theme/theme';

export const popupTemplateStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  cardHitSlop: {
    width: '100%',
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: CONTENT_HORIZONTAL_PADDING,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});

export function withPopupInsets(insets: EdgeInsets) {
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  } as const;
}
