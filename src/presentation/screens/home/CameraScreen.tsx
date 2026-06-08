import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParams } from '../../routes/navigationParams';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import CarVerticalIcon from '../../../../assets/images/icons/car-vertical.svg';
import { usePermissionsStore } from '../../../modules/permissions/store/usePermissionsStore';
import { scanQrCode } from '../../../modules/session/scanQr';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import {
  applySystemChrome,
  getKittenScreenBackground,
  getStatusBarStyle,
} from '../../../shared/theme/systemChrome';
import { useTheme } from '@ui-kitten/components';
import { InfoPopup, ModalPopup } from '../../../shared/components/ui/popup';
import { Disclaimer } from '../../../shared/components/permissions/Disclaimer';
import { PermissionRequest } from '../../../shared/components/permissions/PermissionRequest';
import { PermissionBlocked } from '../../../shared/components/permissions/PermissionBlocked';
import { CameraScanner } from '../../../shared/components/ui/camera';
import { navigateToSessionCompletion } from '../../../shared/utils/navigateToSessionCompletion';
import { getPaymentSummary } from '../../../modules/session/pendingPayment';

export const CameraScreen = () => {
  const { isDark } = useAppTheme();
  const theme = useTheme();
  const {
    cameraStatus,
    refreshCameraPermission,
    requestCameraPermission,
  } = usePermissionsStore();
  const hasPermission = cameraStatus === 'granted';
  const { width } = useWindowDimensions();
  const { setScanQrResponse } = useSessionStore();
  const { fetchVehicles } = useAccountStore();
  const hasScannedRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [needVehicleModalVisible, setNeedVehicleModalVisible] = useState(false);
  const [qrErrorVisible, setQrErrorVisible] = useState(false);
  const [qrErrorTitle, setQrErrorTitle] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [paymentDebtVisible, setPaymentDebtVisible] = useState(false);
  const [paymentDebtSessionId, setPaymentDebtSessionId] = useState<string | null>(
    null,
  );
  const navigation = useNavigation<StackNavigationProp<RootStackParams>>();
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Status bar claro solo en cámara; al salir se restaura el chrome del tema activo.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => {
        applySystemChrome(
          getKittenScreenBackground(theme),
          getStatusBarStyle(isDark),
        );
      };
    }, [isDark, theme]),
  );

  // Pausar la cámara cuando la app va a segundo plano para evitar camera-is-restricted
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  const dismissQrError = useCallback(() => {
    setQrErrorVisible(false);
    setQrErrorTitle('');
    setQrErrorMessage('');
    hasScannedRef.current = false;
  }, []);

  const processQRCode = useCallback(
    async (codeValue: string) => {
      if (hasScannedRef.current || isScanning) return;
      if (!codeValue || codeValue.trim().length === 0) return;

      hasScannedRef.current = true;
      setIsScanning(true);

      try {
        const result = await scanQrCode(codeValue.trim());
        if (result.ok) {
          setScanQrResponse(result.data);
          await fetchVehicles();
          const hasVehicles = useAccountStore.getState().vehicles.length > 0;
          if (!hasVehicles) {
            setNeedVehicleModalVisible(true);
          } else {
            navigation.navigate('Session', { screen: 'Parámetros' });
          }
        } else if (result.paymentRequired) {
          setPaymentDebtSessionId(result.pendingSessionId);
          setQrErrorTitle(result.title);
          setQrErrorMessage(result.message);
          setPaymentDebtVisible(true);
        } else {
          setQrErrorTitle(result.title);
          setQrErrorMessage(result.message);
          setQrErrorVisible(true);
        }
      } catch (error) {
        console.error('Error scanning QR:', error);
        setQrErrorTitle('Error');
        setQrErrorMessage(
          'Ocurrió un error inesperado. Cierra este mensaje e inténtalo de nuevo.',
        );
        setQrErrorVisible(true);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, navigation, setScanQrResponse, fetchVehicles],
  );

  const handleCloseNeedVehicleModal = useCallback(() => {
    setNeedVehicleModalVisible(false);
    useSessionStore.getState().clearSession();
    hasScannedRef.current = false;
  }, []);

  const handleNavigateCreateVehicle = useCallback(() => {
    setNeedVehicleModalVisible(false);
    navigation.navigate('App', {
      screen: 'Autos',
      params: {
        screen: 'Formularios',
        params: {
          screen: 'Crear auto',
          params: { resumeQrSession: true },
        },
      },
    } as never);
  }, [navigation]);

  const isCameraActive = isFocused && appState === 'active' && hasPermission;
  /** Sin lectura de QR mientras un modal bloquea (error de escaneo o falta de vehículo). */
  const isScannerActive =
    isCameraActive && !qrErrorVisible && !needVehicleModalVisible;

  // Early returns: mismo número de hooks en todos los renders (todos los hooks ya están arriba)
  if (cameraStatus === 'not-determined') {
    return (
      <Disclaimer
        title="Acceso a la cámara"
        message="Necesitamos acceso a la cámara para escanear códigos QR en estaciones."
        buttonText="Continuar"
        onConfirm={() => requestCameraPermission()}
      />
    );
  }

  if (cameraStatus === 'requestable') {
    return (
      <PermissionRequest
        title="Se necesita cámara"
        message="La cámara es necesaria para escanear el QR de la estación."
        screenName="Cámara"
        onRequest={requestCameraPermission}
        onClose={() => refreshCameraPermission()}
      />
    );
  }

  if (cameraStatus === 'blocked' || cameraStatus === 'unavailable') {
    return (
      <PermissionBlocked
        title="Permiso bloqueado"
        message="Has bloqueado el permiso de cámara. Para usar esta función debes habilitarlo en configuración."
        screenName="Cámara"
        onRefresh={() => refreshCameraPermission()}
      />
    );
  }

  const scanAreaSize = width * 0.8;

  return (
    <View style={StyleSheet.absoluteFill}>
      <ModalPopup
        visible={needVehicleModalVisible}
        onClose={handleCloseNeedVehicleModal}
        imageNode={<CarVerticalIcon width={120} height={120} />}
        title="Registra un vehículo"
        text="Para iniciar una carga necesitas tener al menos un vehículo registrado. Puedes crear uno ahora."
        buttonTitle="Registrar vehículo"
        onButtonPress={handleNavigateCreateVehicle}
      />
      <InfoPopup
        visible={qrErrorVisible}
        title={qrErrorTitle}
        message={qrErrorMessage}
        buttonTitle="Aceptar"
        onAccept={dismissQrError}
      />
      <InfoPopup
        visible={paymentDebtVisible}
        title={qrErrorTitle || 'Pago pendiente'}
        message={qrErrorMessage}
        buttonTitle="Pagar ahora"
        onAccept={() => {
          const sessionId = paymentDebtSessionId;
          setPaymentDebtVisible(false);
          hasScannedRef.current = false;
          if (!sessionId) return;
          void (async () => {
            try {
              const summary = await getPaymentSummary(sessionId);
              await navigateToSessionCompletion(sessionId, summary);
            } catch {
              setQrErrorTitle('Error');
              setQrErrorMessage('No se pudo cargar el pago pendiente.');
              setQrErrorVisible(true);
            }
          })();
        }}
      />
      <CameraScanner
        isActive={isScannerActive}
        onCodeScanned={(value) => {
          // processQRCode ya controla debouncing vía hasScannedRef/isScanning
          void processQRCode(value);
        }}
      />

      {/* Overlay semi-transparente */}
      <View style={styles.overlay}>
        {/* Área superior con texto */}
        <View style={styles.topSection}>
          <Text style={styles.instructionText}>
            Escanear QR de estación
          </Text>
        </View>

        {/* Área central con cuadro de escaneo */}
        <View style={styles.middleSection}>
          <View style={styles.scanAreaContainer}>
            {/* Cuadro de escaneo */}
            <View
              style={[
                styles.scanArea,
                { width: scanAreaSize, height: scanAreaSize },
              ]}
            >
              {/* Esquinas del cuadro */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </View>

        {/* Área inferior vacía */}
        <View style={styles.bottomSection} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  permissionPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#44b778',
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  permissionSecondaryButton: {
    marginTop: 16,
    paddingVertical: 10,
  },
  permissionSecondaryText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  middleSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  bottomSection: {
    flex: 1,
  },
});
