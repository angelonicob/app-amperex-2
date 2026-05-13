import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../modules/auth/store/userAuthStore';

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
    <Layout
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.centered}>
        <Text category="h5" style={styles.title}>
          {netDown ? 'Sin conexión a internet' : 'No pudimos continuar'}
        </Text>
        <Text category="s1" appearance="hint" style={styles.body}>
          {netDown
            ? 'Parece que no hay internet o la señal es débil. Lo sentimos por las molestias. Comprueba tu red e inténtalo cuando puedas.'
            : 'Lo sentimos, ahora mismo no podemos cargar tu cuenta. Suele ser algo puntual: inténtalo de nuevo en unos minutos.'}
        </Text>
        <View style={styles.actions}>
          <Button onPress={handleRetry} disabled={retrying}>
            {retrying ? 'Comprobando…' : 'Reintentar'}
          </Button>
          <Button appearance="ghost" status="basic" onPress={logout}>
            Cerrar sesión
          </Button>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  title: { marginBottom: 12, textAlign: 'center' },
  body: { marginBottom: 16, lineHeight: 22, textAlign: 'center' },
  actions: { gap: 12, marginTop: 8 },
});
