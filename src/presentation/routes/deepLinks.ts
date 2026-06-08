import { CommonActions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { navigationRef } from './navigationRef';
import type { RootStackParams } from './navigationParams';

/**
 * Router de deep links globales (scheme `amperex://`).
 *
 * Solo trata flujos que pueden iniciar la app por URL externa (correo, navegador).
 * Listeners por flujo (p. ej. OneClick) siguen siendo locales a sus pantallas.
 *
 * Se hace `reset` (no `navigate`) para que la pantalla destino quede como única en la pila
 * y no la sobrescriba `LoadingGateScreen` al montar.
 */

type DeepLinkRoute = {
  name: keyof RootStackParams;
  params?: RootStackParams[keyof RootStackParams];
};

/** Mapea hostname+path del deep link a una ruta del stack root. */
function resolveDeepLinkRoute(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    const host = parsed.hostname ?? '';
    const path = (parsed.path ?? '').replace(/^\/+/, '');
    const fullPath = host
      ? path
        ? `${host}/${path}`
        : host
      : path;
    switch (fullPath) {
      case 'password-reset/success':
        return { name: 'PasswordResetSuccess' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

let pendingRoute: DeepLinkRoute | null = null;

function dispatchReset(route: DeepLinkRoute) {
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: route.name as string, params: route.params }],
    }),
  );
}

/**
 * Procesa una URL entrante. Si el contenedor de navegación aún no está listo,
 * la ruta queda encolada hasta que `flushPendingDeepLinks` se invoque.
 */
export function handleIncomingDeepLink(url: string): void {
  const route = resolveDeepLinkRoute(url);
  if (!route) return;
  if (!navigationRef.isReady()) {
    pendingRoute = route;
    return;
  }
  dispatchReset(route);
}

/** Llamar tras `NavigationContainer.onReady` para resolver deep links capturados al frío. */
export function flushPendingDeepLinks(): void {
  if (!pendingRoute) return;
  if (!navigationRef.isReady()) return;
  const route = pendingRoute;
  pendingRoute = null;
  dispatchReset(route);
}
