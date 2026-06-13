import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../../presentation/routes/navigationRef';

/** Vuelve al drawer y abre el tab de escaneo QR. */
export function navigateToQrScanner(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'App',
          state: {
            routes: [
              {
                name: 'Home',
                state: {
                  routes: [{ name: 'QR' }],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
    }),
  );
}
