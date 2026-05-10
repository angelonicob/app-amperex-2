import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Layout, Text } from '@ui-kitten/components';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CarStackParams } from '../../../routes/navigationParams';
import { CarCardHorizontal } from '../../../../shared/components/ui/card';
import { ButtonPrimary } from '../../../../shared/components/ui/button';
import { ConfirmPopup } from '../../../../shared/components/ui/popup';
import { useAccountStore } from '../../../../modules/user/store/useAccountStore';
import type { Car } from '../../../../modules/user/types/car';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { globalStyles } from '../../../../shared/theme/theme';

type Nav = StackNavigationProp<CarStackParams, 'Mis autos'>;

export const CarsScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();
  const { vehicles, fetchVehicles, removeVehicle } = useAccountStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Car | null>(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const timeoutId = setTimeout(() => {
        if (!isMounted) return;
        fetchVehicles();
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }, [fetchVehicles]),
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!vehicleToDelete) return;
    setDeleting(true);
    try {
      await removeVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'No se pudo eliminar el vehículo';
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  }, [vehicleToDelete, removeVehicle]);

  if (!vehicles) {
    return (
      <Layout style={styles.centered}>
        <Text category="s1">Cargando información del usuario...</Text>
      </Layout>
    );
  }

  return (
    <Layout style={globalStyles.container}>
      <ConfirmPopup
        visible={vehicleToDelete != null}
        onRequestClose={() => {
          if (!deleting) setVehicleToDelete(null);
        }}
        title="¿Eliminar este vehículo?"
        labelConfirm="Eliminar"
        confirmDestructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
      >
        {vehicleToDelete ? (
          <Text category="s1" appearance="hint" style={styles.confirmText}>
            Se quitará {vehicleToDelete.plate} ({vehicleToDelete.brand}{' '}
            {vehicleToDelete.model}) de tu cuenta.
          </Text>
        ) : null}
      </ConfirmPopup>
      <ScrollView
        ref={scrollViewRef}
        style={globalStyles.scroll}
        contentContainerStyle={[
          globalStyles.scrollContent,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text category="h3" style={[styles.title, { color: colors.primary }]}>
          Lista de vehículos
        </Text>
        {vehicles.map(vehicle => (
          <CarCardHorizontal
            key={vehicle.id}
            vehicle={vehicle}
            onDeletePress={() => setVehicleToDelete(vehicle)}
          />
        ))}
        <ButtonPrimary
          title="Agregar vehículo"
          onPress={() => navigation.navigate('Crear auto')}
          style={styles.addButton}
        />
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addButton: {
    width: '100%',
    marginTop: 4,
  },
  confirmText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
