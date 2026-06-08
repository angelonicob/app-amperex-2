import { Button, Layout, Text } from '@ui-kitten/components';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PendingPaymentSession } from '../../../../modules/session/pendingPayment';
import { useAppTheme } from '../../../theme/useAppTheme';
import { popupTemplateStyles, withPopupInsets } from './popupStyles';

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
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [step, setStep] = useState<Step>('warning');

  useEffect(() => {
    if (visible) setStep('warning');
  }, [visible]);

  const resetAndDismiss = () => {
    setStep('warning');
    onDismiss();
  };

  const amountLabel =
    oldest != null
      ? `$${Math.round(oldest.amountClp).toLocaleString('es-CL')} ${oldest.currency}`
      : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={[popupTemplateStyles.backdrop, withPopupInsets(insets)]}>
        <Pressable onPress={() => {}} style={popupTemplateStyles.cardHitSlop}>
          <Layout
            level="2"
            style={[popupTemplateStyles.sheet, { borderColor: theme.border }]}
          >
            {step === 'warning' ? (
              <>
                <Text category="h5" style={popupTemplateStyles.title}>
                  Tienes un pago pendiente
                </Text>
                <Text category="s1" appearance="hint" style={popupTemplateStyles.body}>
                  {oldest?.stationName
                    ? `Carga en ${oldest.stationName}`
                    : 'Tienes una sesión de carga sin pagar'}
                  {amountLabel ? `\nMonto: ${amountLabel}` : ''}
                  {'\n\n'}Debes pagar para volver a usar el servicio de carga.
                </Text>
                <Button
                  status="primary"
                  onPress={onPayNow}
                  style={styles.button}
                >
                  Pagar ahora
                </Button>
                <Button
                  appearance="ghost"
                  status="basic"
                  onPress={() => setStep('ack')}
                  style={styles.button}
                >
                  Pagar más tarde
                </Button>
              </>
            ) : (
              <>
                <Text category="h5" style={popupTemplateStyles.title}>
                  Aviso importante
                </Text>
                <Text category="s1" appearance="hint" style={popupTemplateStyles.body}>
                  Ten en cuenta que no podrás usar el servicio hasta pagar tu deuda.
                </Text>
                <Button
                  status="primary"
                  onPress={onPayNow}
                  style={styles.button}
                >
                  Pagar
                </Button>
                <Button
                  appearance="outline"
                  status="basic"
                  onPress={resetAndDismiss}
                  style={styles.button}
                >
                  Confirmar
                </Button>
              </>
            )}
          </Layout>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginTop: 8,
  },
});
