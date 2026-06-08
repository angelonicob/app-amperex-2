import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cancelReservation,
  confirmReservation,
  fetchReservationDetail,
  getDeviceTimezone,
} from '../../../modules/reservation/reservationApi';
import { useReservationConfirmStore } from '../../../modules/reservation/store/useReservationConfirmStore';
import type { ReservationDetail } from '../../../modules/reservation/types';
import { useAppTheme } from '../../theme/useAppTheme';
import { popupTemplateStyles, withPopupInsets } from '../ui/popup/popupStyles';

function normalizeConfirmationBody(text: string): string {
  return text.replace(/\btolerancia\b/gi, 'espera');
}

export const ReservationConfirmModal = () => {
  const reservationId = useReservationConfirmStore((s) => s.reservationId);
  const close = useReservationConfirmStore((s) => s.close);
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = reservationId != null;

  useEffect(() => {
    if (!reservationId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchReservationDetail(reservationId, getDeviceTimezone())
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No pudimos cargar tu reserva. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  const handleConfirm = useCallback(async () => {
    if (!reservationId) return;
    setActionLoading(true);
    try {
      await confirmReservation(reservationId);
      close();
    } catch {
      setError('No se pudo confirmar. Inténtalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  }, [reservationId, close]);

  const handleCancelReservation = useCallback(async () => {
    if (!reservationId) return;
    setActionLoading(true);
    try {
      await cancelReservation(reservationId);
      close();
    } catch {
      setError('No se pudo cancelar la reserva.');
    } finally {
      setActionLoading(false);
    }
  }, [reservationId, close]);

  const title =
    detail?.confirmationCopy?.title ?? 'Confirma tu reserva';
  const body = normalizeConfirmationBody(
    detail?.confirmationCopy?.body ??
      'Si confirmas tu asistencia tendrás más minutos de espera para conectar tu vehículo después de la hora de inicio.',
  );

  const timeRange =
    detail?.startAtLocal && detail?.endAtLocal
      ? `${detail.startAtLocal.slice(11, 16)} – ${detail.endAtLocal.slice(11, 16)}`
      : null;

  const stationName = detail?.station?.name?.trim() || null;

  const scheduleCardBg = theme.isDark ? '#0A0A0A' : theme.backgroundTertiary;
  const scheduleMutedColor = theme.isDark ? '#9A9A9A' : theme.textSecondary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={[popupTemplateStyles.backdrop, withPopupInsets(insets)]}>
        <Pressable onPress={() => {}} style={popupTemplateStyles.cardHitSlop}>
          <Layout
            level="2"
            style={[popupTemplateStyles.sheet, { borderColor: theme.border }]}
          >
            <Text category="h5" style={popupTemplateStyles.title}>
              {title}
            </Text>
            {loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <>
                {timeRange ? (
                  <View
                    style={[styles.scheduleCard, { backgroundColor: scheduleCardBg }]}
                  >
                    {stationName ? (
                      <Text
                        style={[styles.scheduleStation, { color: scheduleMutedColor }]}
                        numberOfLines={2}
                      >
                        {stationName}
                      </Text>
                    ) : null}
                    <Text style={[styles.scheduleTime, { color: scheduleMutedColor }]}>
                      {timeRange}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.body}>{body}</Text>
                {error ? (
                  <Text status="danger" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
              </>
            )}
            <View style={styles.actions}>
              <Button
                appearance="filled"
                style={styles.primaryBtn}
                onPress={() => void handleConfirm()}
                disabled={loading || actionLoading}
              >
                {actionLoading ? '…' : 'Confirmar asistencia'}
              </Button>
              <Button
                appearance="ghost"
                status="danger"
                style={styles.secondaryBtn}
                onPress={() => void handleCancelReservation()}
                disabled={loading || actionLoading}
              >
                Cancelar reserva
              </Button>
              <Button
                appearance="ghost"
                style={styles.tertiaryBtn}
                onPress={close}
                disabled={actionLoading}
              >
                Ahora no
              </Button>
            </View>
          </Layout>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loader: { marginVertical: 24 },
  scheduleCard: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: 'center',
    gap: 6,
  },
  scheduleStation: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  scheduleTime: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: { marginBottom: 16 },
  error: { marginBottom: 8 },
  actions: { gap: 10 },
  primaryBtn: { width: '100%' },
  secondaryBtn: { width: '100%' },
  tertiaryBtn: { width: '100%' },
});
