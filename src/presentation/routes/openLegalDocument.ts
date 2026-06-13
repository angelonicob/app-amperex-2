import { CommonActions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';

export function openLegalDocument(url: string, title: string): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'LegalDocument',
      params: { url, title },
    }),
  );
}
