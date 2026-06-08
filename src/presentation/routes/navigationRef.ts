import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParams, SessionStackParams } from './navigationParams';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

type PendingReplace = {
  name: keyof RootStackParams;
  params?: RootStackParams[keyof RootStackParams];
} | null;

let pendingReplace: PendingReplace = null;

function buildResetRoutes<K extends keyof RootStackParams>(
  name: K,
  params?: RootStackParams[K],
): unknown[] {
  if (name === 'Session') {
    const screen =
      (params as { screen?: keyof SessionStackParams } | undefined)?.screen ??
      'Sesión';
    return [
      {
        name: 'Session',
        state: {
          routes: [{ name: screen }],
          index: 0,
        },
      },
    ];
  }
  return [{ name, params }];
}

/**
 * Ejecuta el reset pendiente cuando `NavigationContainer` ya está montado.
 * Llamar desde `onReady` del contenedor (App.tsx).
 */
export function flushPendingNavigation() {
  if (!navigationRef.isReady() || !pendingReplace) return;
  const { name, params } = pendingReplace;
  pendingReplace = null;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: buildResetRoutes(name, params) as never[],
    }),
  );
}

/**
 * Sustituye toda la pila de navegación por una sola pantalla (reset al root).
 * Si el contenedor aún no está listo, encola y se aplicará en `onReady`.
 */
export function replaceToRoute<K extends keyof RootStackParams>(
  name: K,
  params?: RootStackParams[K],
) {
  pendingReplace = { name, params };
  if (navigationRef.isReady()) {
    flushPendingNavigation();
  }
}
