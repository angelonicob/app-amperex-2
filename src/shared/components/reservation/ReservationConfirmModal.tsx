import { Text } from '@ui-kitten/components';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  cancelReservation,
  confirmReservation,
  fetchReservationDetail,
  getDeviceTimezone,
} from '../../../modules/reservation/reservationApi';
import { useReservationConfirmStore } from '../../../modules/reservation/store/useReservationConfirmStore';
import type { ReservationDetail } from '../../../modules/reservation/types';
import { useAppTheme } from '../../theme/useAppTheme';
import { ButtonPrimary, ButtonTransparent } from '../ui/button';
import { PopupShell } from '../ui/popup/PopupShell';
import { popupTemplateStyles } from '../ui/popup/popupStyles';

function normalizeConfirmationBody(text: string): string {
  return text.replace(/\btolerancia\b/gi, 'espera');
}

export const ReservationConfirmModal = () => {
  const reservationId = useReservationConfirmStore((s) => s.reservationId);
  const close = useReservationConfirmStore((s) => s.close);
  const theme = useAppTheme();
  const [shellVisible, setShellVisible] = useState(false);
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCloseShell = useCallback(() => {
    setShellVisible(false);
  }, []);

  const handleDismissed = useCallback(() => {
    close();
    setDetail(null);
    setError(null);
    setLoading(false);
    setActionLoading(false);
  }, [close]);

  useEffect(() => {
    if (!reservationId) {
      return;
    }
    setShellVisible(true);
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
      requestCloseShell();
    } catch {
      setError('No se pudo confirmar. Inténtalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  }, [reservationId, requestCloseShell]);

  const handleCancelReservation = useCallback(async () => {
    if (!reservationId) return;
    setActionLoading(true);
    try {
      await cancelReservation(reservationId);
      requestCloseShell();
    } catch {
      setError('No se pudo cancelar la reserva.');
    } finally {
      setActionLoading(false);
    }
  }, [reservationId, requestCloseShell]);

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
    <PopupShell
      visible={shellVisible}
      onRequestClose={requestCloseShell}
      onDismissed={handleDismissed}
      title={title}
      footer={
        <View style={styles.actions}>
          <ButtonPrimary
            title={actionLoading ? '…' : 'Confirmar asistencia'}
            onPress={() => void handleConfirm()}
            disabled={loading || actionLoading}
            style={styles.primaryBtn}
          />
          <ButtonTransparent
            title="Cancelar reserva"
            onPress={() => void handleCancelReservation()}
            disabled={loading || actionLoading}
            color={theme.danger}
            style={styles.secondaryBtn}
          />
          <ButtonTransparent
            title="Ahora no"
            onPress={requestCloseShell}
            disabled={actionLoading}
            color={theme.primary}
            style={styles.tertiaryBtn}
          />
        </View>
      }
    >
      <View
        style={[styles.scheduleCard, { backgroundColor: scheduleCardBg }]}
      >
        {loading ? (
          <>
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonStation,
                { backgroundColor: theme.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonTime,
                { backgroundColor: theme.border },
              ]}
            />
          </>
        ) : timeRange ? (
          <>
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
          </>
        ) : null}
      </View>
      <View style={styles.bodyBlock}>
        {loading ? (
          <View style={styles.skeletonBody}>
            <View
              style={[styles.skeletonLine, { backgroundColor: theme.border }]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonBodyMid,
                { backgroundColor: theme.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonBodyShort,
                { backgroundColor: theme.border },
              ]}
            />
          </View>
        ) : (
          <>
            <Text style={popupTemplateStyles.body}>{body}</Text>
            {error ? (
              <Text status="danger" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </PopupShell>
  );
};

const styles = StyleSheet.create({
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
  bodyBlock: {
    minHeight: 88,
  },
  skeletonBody: {
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  skeletonLine: {
    borderRadius: 6,
    opacity: 0.45,
  },
  skeletonStation: {
    width: '72%',
    height: 14,
  },
  skeletonTime: {
    width: '48%',
    height: 28,
    marginTop: 4,
  },
  skeletonBodyMid: {
    width: '92%',
    height: 12,
  },
  skeletonBodyShort: {
    width: '64%',
    height: 12,
  },
  error: { marginBottom: 8, textAlign: 'center' },
  actions: { gap: 10 },
  primaryBtn: { width: '100%' },
  secondaryBtn: { width: '100%' },
  tertiaryBtn: { width: '100%' },
});
