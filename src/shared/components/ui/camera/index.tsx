import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';

interface CameraScannerProps {
  isActive: boolean;
  onCodeScanned: (value: string) => void;
}

/**
 * Componente de cámara compartido basado en expo-camera.
 * Escanea códigos QR y delega el manejo a onCodeScanned.
 */
export const CameraScanner = ({ isActive, onCodeScanned }: CameraScannerProps) => {
  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isActive) return;
      if (!result?.data) return;
      onCodeScanned(result.data);
    },
    [isActive, onCodeScanned],
  );

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      onBarcodeScanned={handleBarcodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      /**
       * CameraView no expone isActive directamente; controlamos el escaneo
       * habilitando/deshabilitando onBarcodeScanned según isActive.
       */
    />
  );
};

