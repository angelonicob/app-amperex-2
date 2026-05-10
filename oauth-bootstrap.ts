import * as WebBrowser from 'expo-web-browser';

/**
 * Debe importarse antes que `App` en `index.js`.
 * Así el retorno OAuth (auth.expo.io → app) se resuelve sin depender de que el resto del árbol de imports ya haya cargado.
 */
WebBrowser.maybeCompleteAuthSession();
