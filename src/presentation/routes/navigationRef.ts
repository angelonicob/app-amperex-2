import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParams } from './navigationParams';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

/**
 * Sustituye toda la pila de navegación por una sola pantalla (reset al root).
 * Útil desde pantallas anidadas (Session, Drawer) para ir a Auth o App sin ref.
 */
export function replaceToRoute<K extends keyof RootStackParams>(
  name: K,
  params?: RootStackParams[K],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params } as { name: K; params?: RootStackParams[K] }],
      }),
    );
  }
}
