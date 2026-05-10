import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  authorizePayment,
  getInscriptionStatus,
  getInscriptionRedirectUrl,
  startInscription,
} from '../../../modules/session/oneclick';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import type { SessionStackParams } from '../../routes/navigationParams';
import { replaceToRoute } from '../../routes/navigationRef';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

const ONECLICK_DEEP_LINK = 'amperex://oneclick-inscription-success';

type Nav = StackNavigationProp<SessionStackParams, 'Pago'>;
export const PaymentScreen = () => {
  const navigation = useNavigation<Nav>();
  const colors = useAppTheme();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [oneClickEnrolled, setOneClickEnrolled] = useState<boolean>(false);
  const [oneClickCardLast4, setOneClickCardLast4] = useState<string | null>(null);
  const [oneClickCardType, setOneClickCardType] = useState<string | null>(null);
  const [loadingInscription, setLoadingInscription] = useState<boolean>(true);
  const { chargingData } = useSessionStore();

  const summary = useMemo(() => {
    const currency = chargingData?.currency ?? 'CLP';
    const totalCost =
      chargingData?.totalCost ??
      chargingData?.estimatedCostClp ??
      chargingData?.currentCost ??
      0;
    const energyKwh =
      chargingData?.finalEnergy ??
      chargingData?.energyKwh ??
      chargingData?.estimatedEnergyKwh ??
      0;
    const priceClpPerKwh = chargingData?.priceClpPerKwh;
    const durationSeconds =
      chargingData?.totalDurationSeconds ??
      chargingData?.estimatedDurationSeconds ??
      null;

    return {
      currency,
      totalCost,
      energyKwh,
      priceClpPerKwh,
      durationSeconds,
      sessionId: chargingData?.sessionId,
      status: chargingData?.status,
    };
  }, [chargingData]);

  const refreshInscriptionStatus = useCallback(async () => {
    setLoadingInscription(true);
    try {
      const status = await getInscriptionStatus();
      setOneClickEnrolled(status.enrolled);
      setOneClickCardLast4(status.cardLast4 ?? null);
      setOneClickCardType(status.cardType ?? null);
    } catch {
      setOneClickEnrolled(false);
      setOneClickCardLast4(null);
      setOneClickCardType(null);
    } finally {
      setLoadingInscription(false);
    }
  }, []);

  useEffect(() => {
    refreshInscriptionStatus();
  }, [refreshInscriptionStatus]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      if (event.url === ONECLICK_DEEP_LINK) {
        refreshInscriptionStatus();
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url === ONECLICK_DEEP_LINK) refreshInscriptionStatus();
    });
    return () => sub.remove();
  }, [refreshInscriptionStatus]);

  const handlePayWithOneClick = async () => {
    if (!summary.sessionId) {
      Alert.alert('Error', 'Información de pago no disponible');
      return;
    }
    setIsProcessing(true);
    try {
      await authorizePayment(summary.sessionId);
      Alert.alert('Éxito', 'Pago con One Click realizado correctamente.', [
        {
          text: 'OK',
          onPress: () => {
            useSessionStore.getState().clearSession();
            replaceToRoute('App');
          },
        },
      ]);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      Alert.alert(
        'Error',
        message ?? 'No se pudo procesar el pago con One Click. Intenta de nuevo.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartInscription = async () => {
    setIsProcessing(true);
    try {
      const { token } = await startInscription();
      const url = getInscriptionRedirectUrl(token);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace de inscripción.');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      Alert.alert(
        'Error',
        message ?? 'No se pudo iniciar la inscripción. Intenta de nuevo.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // La pantalla de pago debe funcionar también tras restauración (reabrir app),
  // donde normalmente no existe `scanQrResponse` (no hubo scan QR en esta sesión de app).
  if (!chargingData?.sessionId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.centeredBlock}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Información de pago no disponible
          </Text>
          <Pressable
            onPress={() => replaceToRoute('App')}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayMinutes =
    summary.durationSeconds != null ? Math.floor(summary.durationSeconds / 60) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>Información de Pago</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Revisa el resumen antes de pagar
        </Text>

        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {Math.round(Number(summary.totalCost) || 0).toLocaleString('es-CL')} {summary.currency}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Energía</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {Number(summary.energyKwh || 0).toFixed(2)} kWh
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tarifa</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {summary.priceClpPerKwh != null
                ? `${Math.round(summary.priceClpPerKwh).toLocaleString('es-CL')} CLP/kWh`
                : '—'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Duración</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {displayMinutes != null ? `${displayMinutes} min` : '—'}
            </Text>
          </View>
        </View>

        {!loadingInscription && (
          <>
            {oneClickEnrolled ? (
              <>
                {oneClickCardLast4 != null && (
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                    Tarjeta ****{oneClickCardLast4}
                    {oneClickCardType != null ? ` (${oneClickCardType})` : ''}
                  </Text>
                )}
                <Pressable
                  onPress={handlePayWithOneClick}
                  disabled={isProcessing}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: colors.primary, opacity: isProcessing || pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {isProcessing ? 'Procesando...' : 'Pagar con One Click'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={handleStartInscription}
                disabled={isProcessing}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.primary, opacity: isProcessing || pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {isProcessing ? 'Procesando...' : 'Inscribir tarjeta One Click'}
                </Text>
              </Pressable>
            )}
          </>
        )}

        <Pressable
          onPress={handleCancel}
          disabled={isProcessing}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.danger, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Volver</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  emptyText: { fontSize: 16, marginBottom: 24 },
  loadingText: { fontSize: 16 },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { fontSize: 14 },
  value: { fontSize: 15, fontWeight: '600' },
  cardHint: { fontSize: 13, marginBottom: 8 },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { fontWeight: '600', fontSize: 16 },
});
