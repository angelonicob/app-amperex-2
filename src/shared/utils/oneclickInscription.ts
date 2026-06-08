import * as WebBrowser from 'expo-web-browser';
import {
  getInscriptionRedirectUrl,
  startInscription,
} from '../../modules/session/oneclick';

const ONECLICK_DEEP_LINK_SUCCESS = 'amperex://oneclick-inscription-success';
const ONECLICK_DEEP_LINK_FAILED = 'amperex://oneclick-inscription-failed';

export type OneClickInscriptionOutcome =
  /** Transbank devolvió éxito y el callback nos redirigió al deep link success. */
  | { kind: 'success' }
  /** Transbank devolvió rechazo (`failed`) con código opcional. */
  | { kind: 'failed'; code: string | null }
  /** El usuario cerró el WebBrowser/ASWebAuth antes de terminar el flujo. */
  | { kind: 'cancelled' }
  /** No se pudo abrir el WebBrowser o la respuesta vino vacía/inesperada. */
  | { kind: 'unknown'; reason?: string };

function getQueryParam(url: string, key: string): string | null {
  const qIdx = url.indexOf('?');
  if (qIdx < 0) return null;
  const query = url.slice(qIdx + 1);
  for (const part of query.split('&')) {
    const [k, v] = part.split('=');
    if (!k) continue;
    if (decodeURIComponent(k) === key) return v ? decodeURIComponent(v) : '';
  }
  return null;
}

/**
 * Inicia el flujo de inscripción OneClick usando `WebBrowser.openAuthSessionAsync`
 * en vez de `Linking.openURL` (issue #2.6).
 *
 * Ventajas frente al deep link suelto:
 *
 * - **Sesión aislada**: se abre en ASWebAuthenticationSession (iOS) o Custom
 *   Tabs (Android), sin compartir cookies con el navegador del usuario.
 * - **Retorno garantizado al app**: el OS resuelve la promesa cuando se
 *   detecta el `redirectUrl` (`amperex://oneclick-inscription-*`); ya no
 *   dependemos de listeners `Linking.addEventListener` ni de que el usuario
 *   tenga el app en primer plano cuando llega el callback.
 * - **Menos surface area de phishing**: el browser no permite a otras apps
 *   capturar el deep link (que sí era posible con `amperex://` libre).
 *
 * Sigue siendo necesario que el callback HTTP del backend redirija al
 * deep link (ambos schemes son válidos como `returnUrl`); la diferencia es
 * que aquí esperamos el resultado en una promesa.
 */
export async function runOneClickInscriptionFlow(): Promise<OneClickInscriptionOutcome> {
  const { token } = await startInscription();
  const url = getInscriptionRedirectUrl(token);

  // Aceptamos ambos deep links como returnUrl. El SDK matchea por prefijo
  // (success / failed). En iOS hay que pasar el scheme exacto; en Android
  // el matching es contra el deep link completo, por eso usamos el prefijo
  // base `amperex://` que cubre los dos casos.
  const returnUrl = 'amperex://oneclick-inscription-';

  const result = await WebBrowser.openAuthSessionAsync(url, returnUrl, {
    // Algunos dispositivos (sobre todo Android con Chrome stable) muestran
    // un prompt "abrir en app". `showInRecents=false` evita que la pestaña
    // de WebPay quede colgada en el switcher tras volver.
    showInRecents: false,
  });

  if (result.type === 'success') {
    const returnedUrl = result.url ?? '';
    if (returnedUrl.startsWith(ONECLICK_DEEP_LINK_SUCCESS)) {
      return { kind: 'success' };
    }
    if (returnedUrl.startsWith(ONECLICK_DEEP_LINK_FAILED)) {
      return { kind: 'failed', code: getQueryParam(returnedUrl, 'code') };
    }
    return { kind: 'unknown', reason: `unexpected_return_url:${returnedUrl}` };
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { kind: 'cancelled' };
  }

  return { kind: 'unknown', reason: result.type };
}
