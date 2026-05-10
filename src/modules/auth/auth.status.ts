export type AuthStatus = 'authenticated' | 'unauthenticated' | 'checking';

/** Estado del API respecto al bootstrap; `error` = respuesta 5xx (no confundir con offline). */
export type ApiStatus = 'unknown' | 'reachable' | 'unreachable' | 'error';
