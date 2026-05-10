import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../modules/auth/store/userAuthStore';
import { API_URL } from '../../../infrastructure/http/Api';

export const BackendErrorScreen = () => {
  const insets = useSafeAreaInsets();
  const { retryApiBootstrap, logout } = useAuthStore();
  const [retrying, setRetrying] = useState(false);

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
        Error del servidor
      </Text>
      <Text category="s1" appearance="hint" style={styles.body}>
        El servidor respondió con un error. Suele ser temporal. Inténtalo de
        nuevo en unos momentos. Si el problema continúa, puede deberse a un
        fallo en el backend, no a tu conexión.
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
