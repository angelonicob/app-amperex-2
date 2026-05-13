import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../modules/auth/store/userAuthStore';

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
    <Layout
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.centered}>
        <Text category="h5" style={styles.title}>
          Algo salió mal
        </Text>
        <Text category="s1" appearance="hint" style={styles.body}>
          Lo sentimos, no pudimos completar lo que pediste. Suele ser algo
          puntual: vuelve a intentarlo en unos minutos. Gracias por tu paciencia.
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
