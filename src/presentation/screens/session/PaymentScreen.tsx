import type { StackNavigationProp } from '@react-navigation/stack';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '@ui-kitten/components';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  authorizePayment,
  getCards,
  type OneClickCard,
} from '../../../modules/session/oneclick';
import {
  getPaymentSummary,
  type PaymentSummary,
} from '../../../modules/session/pendingPayment';
import { usePendingPaymentStore } from '../../../modules/session/store/usePendingPaymentStore';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import type { SessionStackParams } from '../../routes/navigationParams';
import { replaceToRoute } from '../../routes/navigationRef';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useSystemChrome } from '../../../shared/hooks/useSystemChrome';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import { requireBiometricForPayment } from '../../../shared/utils/biometricGuard';
import { runOneClickInscriptionFlow } from '../../../shared/utils/oneclickInscription';
import { SessionCompletionSummary } from '../../../shared/components/session/SessionCompletionSummary';
import { useNavigation } from '@react-navigation/native';
import { ButtonPrimary } from '../../../shared/components/ui/button';
import { ConfirmPopup } from '../../../shared/components/ui/popup/ConfirmPopup';
import { PopupShell } from '../../../shared/components/ui/popup/PopupShell';
import Icon from '../../../shared/components/icons/Icon';
import { classifyApiFailure } from '../../../infrastructure/http/apiErrorKind';
import {
  INSCRIPTION_CANCELLED_MESSAGE,
  INSCRIPTION_CONFIRM,
  INSCRIPTION_UNKNOWN_MESSAGE,
  messageForAuthorizeError,
  messageForInscriptionStartError,
} from '../../../shared/utils/paymentErrors';

type Nav = StackNavigationProp<SessionStackParams, 'Pago'>;

function summaryFromChargingData(
  chargingData: ReturnType<typeof useSessionStore.getState>['chargingData'],
): PaymentSummary | null {
  if (!chargingData?.sessionId) return null;
  const totalCost =
    chargingData.totalCost ??
    chargingData.estimatedCostClp ??
    chargingData.currentCost ??
    0;
  const energyKwh =
    chargingData.finalEnergy ??
    chargingData.energyKwh ??
    chargingData.estimatedEnergyKwh ??
    0;
  const amountClp = Math.round(Number(totalCost) || 0);
  const paymentRequired =
    chargingData.paymentRequired === true ||
    (chargingData.paymentRequired !== false && amountClp > 0);
  return {
    sessionId: chargingData.sessionId,
    amountClp,
    currency: chargingData.currency ?? 'CLP',
    energyKwh: Number(energyKwh) || 0,
    priceClpPerKwh: chargingData.priceClpPerKwh ?? null,
    totalDurationSeconds:
      chargingData.totalDurationSeconds ??
      chargingData.estimatedDurationSeconds ??
      null,
    stationName: null,
    paymentStatus: paymentRequired ? 'PENDING' : 'CONFIRMED',
    requiresPayment: paymentRequired,
  };
}

function prettyCardMeta(card: OneClickCard): string {
  const last4 = card.cardLast4 ? `****${card.cardLast4}` : 'Tarjeta';
  const type = card.cardType ? ` (${card.cardType})` : '';
  return `${last4}${type}`;
}

function prettyCardTitle(card: OneClickCard): string {
  const name = card.displayName?.trim();
  if (name) return name;
  return prettyCardMeta(card);
}

function pickInitialCardId(cards: OneClickCard[]): string | null {
  if (cards.length === 0) return null;
  const defaultCard = cards.find((card) => card.isDefault);
  return defaultCard?.id ?? cards[0].id;
}

export const PaymentScreen = () => {
  const navigation = useNavigation<Nav>();
  const colors = useAppTheme();
  const screenBackground = useSystemChrome();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cards, setCards] = useState<OneClickCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardPickerVisible, setCardPickerVisible] = useState(false);
  const [inscriptionConfirmVisible, setInscriptionConfirmVisible] =
    useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pendingContext = usePendingPaymentStore((s) => s.context);
  const setPendingContext = usePendingPaymentStore((s) => s.setContext);
  const clearPendingContext = usePendingPaymentStore((s) => s.clearContext);
  const chargingData = useSessionStore((s) => s.chargingData);
  const { showInfo, InfoDialog } = useInfoDialog();

  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  const hasEnrolledCards = cards.length > 0;

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      setLoadingSummary(true);
      setLoadError(null);
      try {
        if (pendingContext) {
          if (!cancelled) {
            setSummary(pendingContext);
            if (pendingContext.requiresPayment === false) {
              navigation.replace('Resumen');
            }
          }
          return;
        }
        const fromCharge = summaryFromChargingData(chargingData);
        if (fromCharge) {
          if (!cancelled) {
            setSummary(fromCharge);
            setPendingContext(fromCharge);
            if (fromCharge.requiresPayment === false) {
              navigation.replace('Resumen');
            }
          }
          return;
        }
        setLoadError('Información de pago no disponible');
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el resumen de pago');
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [pendingContext, chargingData, setPendingContext, navigation]);

  const refreshCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const res = await getCards();
      const nextCards = res.cards ?? [];
      setCards(nextCards);
      setSelectedCardId((prev) => {
        if (prev && nextCards.some((card) => card.id === prev)) return prev;
        return pickInitialCardId(nextCards);
      });
    } catch {
      setCards([]);
      setSelectedCardId(null);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    void refreshCards();
  }, [refreshCards]);

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setCardPickerVisible(false);
  };

  const handlePayWithOneClick = async () => {
    // Fix #1.3 (UI): cortar reentradas antes de que React re-renderice y
    // aplique `disabled` al Pressable. Sin esta guarda, un doble-tap rápido
    // dispara dos requests `POST /authorize` antes del primer setState.
    if (isProcessing) return;
    if (!summary?.sessionId) {
      showInfo('Error', 'Información de pago no disponible');
      return;
    }
    if (!selectedCardId) {
      showInfo('Error', 'Selecciona una tarjeta para continuar');
      return;
    }
    setIsProcessing(true);
    try {
      // Fix #3.1: confirmación biométrica (con PIN del dispositivo como
      // fallback) antes de invocar el cobro. Solo bloqueamos si el
      // usuario cancela: si no hay hardware/enrolamiento, dejamos pasar
      // porque la sesión Firebase ya autentica al usuario.
      const formattedAmount = Math.round(
        Number(summary.amountClp) || 0,
      ).toLocaleString('es-CL');
      const auth = await requireBiometricForPayment(
        `Confirma el pago de ${formattedAmount} ${summary.currency} con One Click`,
      );
      if (!auth.ok) {
        if (auth.reason === 'cancelled') {
          // cancelación explícita del usuario; no mostramos alerta intrusiva
          return;
        }
        showInfo(
          'No se pudo verificar tu identidad',
          'No fue posible confirmar el pago con la huella/PIN del dispositivo. Intenta nuevamente.',
        );
        return;
      }

      await authorizePayment(summary.sessionId, selectedCardId);
      showInfo('Éxito', 'Pago con One Click realizado correctamente.', {
        buttonTitle: 'OK',
        onAfterAccept: () => {
          useSessionStore.getState().clearSession();
          clearPendingContext();
          replaceToRoute('App');
        },
      });
    } catch (err: unknown) {
      const msg = messageForAuthorizeError(err);
      showInfo(msg.title, msg.body, {
        onAfterAccept: () => {
          if (msg.suggestOtherCard && cards.length > 1) {
            setCardPickerVisible(true);
          }
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * #2.6: inscripción en sesión aislada vía WebBrowser. El resultado vuelve
   * por promesa, sin listeners ni race conditions con el deep link.
   */
  const handleStartInscription = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const outcome = await runOneClickInscriptionFlow();
      switch (outcome.kind) {
        case 'success':
          await refreshCards();
          return;
        case 'failed': {
          const { code } = outcome;
          showInfo(
            'No se pudo inscribir la tarjeta',
            code
              ? `La inscripción fue rechazada (código ${code}). Intenta nuevamente o usa otra tarjeta.`
              : 'La inscripción fue rechazada. Intenta nuevamente o usa otra tarjeta.',
          );
          await refreshCards();
          return;
        }
        case 'cancelled':
          showInfo(
            INSCRIPTION_CANCELLED_MESSAGE.title,
            INSCRIPTION_CANCELLED_MESSAGE.body,
          );
          return;
        case 'unknown':
        default:
          showInfo(
            INSCRIPTION_UNKNOWN_MESSAGE.title,
            INSCRIPTION_UNKNOWN_MESSAGE.body,
          );
          await refreshCards();
          return;
      }
    } catch (err: unknown) {
      const msg = messageForInscriptionStartError(err);
      showInfo(msg.title, msg.body);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryLoad = async () => {
    const sessionId =
      pendingContext?.sessionId ?? chargingData?.sessionId ?? null;
    if (!sessionId) {
      setLoadError('Información de pago no disponible');
      return;
    }
    setLoadingSummary(true);
    setLoadError(null);
    try {
      const loaded = await getPaymentSummary(sessionId);
      if (loaded.requiresPayment === false) {
        setPendingContext(loaded);
        navigation.replace('Resumen');
        return;
      }
      setSummary(loaded);
      setPendingContext(loaded);
    } catch (err: unknown) {
      const kind = classifyApiFailure(err);
      setLoadError(
        kind === 'transport'
          ? 'Sin conexión. Revisa tu red e inténtalo de nuevo.'
          : 'No se pudo cargar el resumen de pago',
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loadingSummary) {
    return (
      <Fragment>
        <SafeAreaView
          style={[styles.flex1, { backgroundColor: screenBackground }]}
          edges={['top', 'bottom']}
        >
          <Layout level="1" style={styles.centeredBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
          </Layout>
        </SafeAreaView>
        {InfoDialog}
      </Fragment>
    );
  }

  if (!summary || loadError) {
    return (
      <Fragment>
        <SafeAreaView
          style={[styles.flex1, { backgroundColor: screenBackground }]}
          edges={['top', 'bottom']}
        >
          <Layout level="1" style={styles.flex1}>
            <View style={styles.centeredBlock}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {loadError ?? 'Información de pago no disponible'}
              </Text>
              <Pressable
                onPress={() => void handleRetryLoad()}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </Pressable>
              <Pressable
                onPress={() => replaceToRoute('App')}
                style={[styles.secondaryOutline, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary }}>Ir al inicio</Text>
              </Pressable>
            </View>
          </Layout>
        </SafeAreaView>
        {InfoDialog}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top']}
      >
        <Layout level="1" style={styles.flex1}>
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Información de Pago
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              {summary.stationName
                ? `${summary.stationName} · Revisa el resumen antes de pagar`
                : 'Revisa el resumen antes de pagar'}
            </Text>

            <SessionCompletionSummary summary={summary} showAmount />
          </ScrollView>

          {!loadingCards ? (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  backgroundColor: screenBackground,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              {hasEnrolledCards ? (
                <>
                  <View style={styles.cardSelectBlock}>
                    <Text style={[styles.cardSelectLabel, { color: colors.textSecondary }]}>
                      Tarjeta de pago
                    </Text>
                    <Pressable
                      onPress={() => setCardPickerVisible(true)}
                      disabled={isProcessing}
                      style={({ pressed }) => [
                        styles.cardSelectTrigger,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                          opacity: isProcessing ? 0.6 : pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={styles.cardSelectIconWrap}>
                        <Icon
                          name="credit-card"
                          size={18}
                          color={colors.primary}
                          iconStyle="solid"
                        />
                      </View>
                      <View style={styles.cardSelectTextWrap}>
                        <Text
                          style={[styles.cardSelectTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {selectedCard
                            ? prettyCardTitle(selectedCard)
                            : 'Seleccionar tarjeta'}
                        </Text>
                        {selectedCard ? (
                          <Text
                            style={[styles.cardSelectMeta, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {prettyCardMeta(selectedCard)}
                            {selectedCard.isDefault ? ' · Predeterminada' : ''}
                          </Text>
                        ) : null}
                      </View>
                      <Icon
                        name="chevron-down"
                        size={14}
                        color={colors.textSecondary}
                        iconStyle="solid"
                      />
                    </Pressable>
                  </View>
                  <ButtonPrimary
                    title={isProcessing ? 'Procesando...' : 'Pagar con One Click'}
                    onPress={() => void handlePayWithOneClick()}
                    disabled={isProcessing || selectedCardId == null}
                  />
                </>
              ) : (
                <ButtonPrimary
                  title={isProcessing ? 'Procesando...' : 'Inscribir tarjeta One Click'}
                  onPress={() => setInscriptionConfirmVisible(true)}
                  disabled={isProcessing}
                />
              )}
            </View>
          ) : (
            <View
              style={[
                styles.footer,
                styles.footerLoading,
                {
                  borderTopColor: colors.border,
                  backgroundColor: screenBackground,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </Layout>
      </SafeAreaView>

      <ConfirmPopup
        visible={inscriptionConfirmVisible}
        onRequestClose={() => setInscriptionConfirmVisible(false)}
        title={INSCRIPTION_CONFIRM.title}
        labelConfirm={INSCRIPTION_CONFIRM.labelConfirm}
        loading={isProcessing}
        onConfirm={() => {
          setInscriptionConfirmVisible(false);
          void handleStartInscription();
        }}
      >
        <Text style={{ color: colors.textSecondary }}>{INSCRIPTION_CONFIRM.body}</Text>
      </ConfirmPopup>

      <PopupShell
        visible={cardPickerVisible}
        onRequestClose={() => setCardPickerVisible(false)}
        title="Seleccionar tarjeta"
      >
        <View style={styles.cardPickerList}>
          {cards.map((card) => {
            const isSelected = card.id === selectedCardId;
            return (
              <Pressable
                key={card.id}
                onPress={() => handleSelectCard(card.id)}
                style={({ pressed }) => [
                  styles.cardPickerRow,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? colors.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.03)'
                      : colors.background,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.cardPickerRowText}>
                  <Text
                    style={[styles.cardPickerTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {prettyCardTitle(card)}
                  </Text>
                  <Text
                    style={[styles.cardPickerMeta, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {prettyCardMeta(card)}
                    {card.isDefault ? ' · Predeterminada' : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cardPickerCheck,
                    isSelected
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.backgroundTertiary },
                  ]}
                >
                  <Icon
                    name={isSelected ? 'check' : 'circle'}
                    size={isSelected ? 14 : 16}
                    color={isSelected ? colors.white : colors.textDisabled}
                    iconStyle={isSelected ? 'solid' : 'regular'}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </PopupShell>

      {InfoDialog}
    </Fragment>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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
  emptyText: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  secondaryOutline: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  footerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  cardSelectBlock: {
    gap: 6,
  },
  cardSelectLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardSelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  cardSelectIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  cardSelectTextWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardSelectTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSelectMeta: {
    fontSize: 13,
  },
  cardPickerList: {
    gap: 10,
  },
  cardPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  cardPickerRowText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardPickerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardPickerMeta: {
    fontSize: 13,
  },
  cardPickerCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
