import type { StackScreenProps } from '@react-navigation/stack';
import { Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { RootStackParams } from '../../routes/navigationParams';
import { ScreenBackHeader } from '../../../shared/components/layout/ScreenBackHeader';
import { ButtonPrimary } from '../../../shared/components/ui/button';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

type Props = StackScreenProps<RootStackParams, 'LegalDocument'>;

export const LegalDocumentScreen = ({ navigation, route }: Props) => {
  const colors = useAppTheme();
  const { url, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <SafeAreaView
      style={[styles.flex1, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScreenBackHeader onBack={handleBack} title={title} />
      <Layout level="1" style={styles.flex1}>
        {loadError ? (
          <View style={styles.centered}>
            <Text
              appearance="hint"
              style={[styles.errorText, { color: colors.textSecondary }]}
            >
              No se pudo cargar el documento. Revisa tu conexión e inténtalo de
              nuevo.
            </Text>
            <ButtonPrimary title="Reintentar" onPress={handleRetry} />
          </View>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : null}
            <WebView
              key={reloadKey}
              source={{ uri: url }}
              style={styles.webview}
              onLoadStart={() => {
                setLoading(true);
                setLoadError(false);
              }}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setLoadError(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setLoadError(true);
              }}
            />
          </>
        )}
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
