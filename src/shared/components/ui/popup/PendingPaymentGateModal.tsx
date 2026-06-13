import { Text } from '@ui-kitten/components';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PendingPaymentSession } from '../../../../modules/session/pendingPayment';
import { useAppTheme } from '../../../theme/useAppTheme';
import { ButtonPrimary, ButtonTransparent } from '../button';
import { PopupShell } from './PopupShell';
import { popupTemplateStyles } from './popupStyles';

type Step = 'warning' | 'ack';

export type PendingPaymentGateModalProps = {
  visible: boolean;
  oldest: PendingPaymentSession | null;
  onDismiss: () => void;
  onPayNow: () => void;
};

export function PendingPaymentGateModal({
  visible,
  oldest,
  onDismiss,
  onPayNow,
}: PendingPaymentGateModalProps) {
  const colors = useAppTheme();
  const [step, setStep] = useState<Step>('warning');

  useEffect(() => {
    if (visible) setStep('warning');
  }, [visible]);

  const resetAndDismiss = () => {
    setStep('warning');
    onDismiss();
  };

  const amountLabel = useMemo(() => {
    if (oldest == null) return null;
    return `$${Math.round(oldest.amountClp).toLocaleString('es-CL')} ${oldest.currency}`;
  }, [oldest]);

  const title =
    step === 'warning' ? 'Tienes un pago pendiente' : 'Aviso importante';

  const bodyText =
    step === 'warning' ? (
      <>
        {oldest?.stationName
          ? `Carga en ${oldest.stationName}`
          : 'Tienes una sesión de carga sin pagar'}
        {amountLabel ? `\nMonto: ${amountLabel}` : ''}
        {'\n\n'}Debes pagar para volver a usar el servicio de carga.
      </>
    ) : (
      'Ten en cuenta que no podrás usar el servicio hasta pagar tu deuda.'
    );

  const footer =
    step === 'warning' ? (
      <View style={styles.actions}>
        <ButtonPrimary
          title="Pagar ahora"
          onPress={onPayNow}
          style={styles.actionBtn}
        />
        <ButtonTransparent
          title="Pagar más tarde"
          onPress={() => setStep('ack')}
          style={styles.actionBtn}
        />
      </View>
    ) : (
      <View style={styles.actions}>
        <ButtonPrimary
          title="Pagar"
          onPress={onPayNow}
          style={styles.actionBtn}
        />
        <ButtonTransparent
          title="Confirmar"
          onPress={resetAndDismiss}
          color={colors.textSecondary}
          style={styles.actionBtn}
        />
      </View>
    );

  return (
    <PopupShell
      visible={visible}
      onRequestClose={() => {}}
      title={title}
      footer={footer}
    >
      <Text category="s1" appearance="hint" style={popupTemplateStyles.body}>
        {bodyText}
      </Text>
    </PopupShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    width: '100%',
  },
});
