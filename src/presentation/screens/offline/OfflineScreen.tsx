import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../modules/auth/store/userAuthStore';
import { API_URL } from '../../../infrastructure/http/Api';

export const OfflineScreen = () => {
  const insets = useSafeAreaInsets();
  const { retryApiBootstrap, logout } = useAuthStore();
  const [retrying, setRetrying] = useState(false);
  const [netDown, setNetDown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void NetInfo.fetch().then((state) => {
        const down =
          state.isConnected !== true || state.isInternetReachable === false;
        setNetDown(down);
      });
      const sub = NetInfo.addEventListener((state) => {
        const down =
          state.isConnected !== true || state.isInternetReachable === false;
        setNetDown(down);
      });
      return () => sub();
    }, []),
  );

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await retryApiBootstrap();
    } finally {
      setRetrying(false);
    }
  }, [retryApiBootstrap]);

  return (
    <Layout style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <Text category="h5" style={styles.title}>
        Sin conexión al servidor
      </Text>
      <Text category="s1" appearance="hint" style={styles.body}>
        {netDown
          ? 'No hay conexión a internet o es inestable. Comprueba tu red e inténtalo de nuevo.'
          : 'La app no puede comunicarse con el servidor de Amperex. Comprueba que el backend esté en marcha y que la URL en la configuración (por ejemplo en .env) coincida con donde corre la API.'}
      </Text>
      {__DEV__ ? (
        <Text category="c1" appearance="hint" style={styles.mono}>
          API_URL actual: {API_URL}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button onPress={handleRetry} disabled={retrying}>
          {retrying ? 'Comprobando…' : 'Reintentar'}
        </Button>
        <Button appearance="ghost" status="basic" onPress={logout}>
          Cerrar sesión
        </Button>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  title: { marginBottom: 12 },
  body: { marginBottom: 16, lineHeight: 22 },
  mono: { marginBottom: 24, fontSize: 11 },
  actions: { gap: 12, marginTop: 8 },
});
