import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Layout, Text } from '@ui-kitten/components';
import { useCallback, useRef, useState, Fragment } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CarStackParams } from '../../../routes/navigationParams';
import { EmptyStateLayout } from '../../../../shared/components/layout/EmptyStateLayout';
import { CarCardHorizontal } from '../../../../shared/components/ui/card';
import { ButtonPrimary } from '../../../../shared/components/ui/button';
import { ConfirmPopup } from '../../../../shared/components/ui/popup';
import { useAccountStore } from '../../../../modules/user/store/useAccountStore';
import type { Car } from '../../../../modules/user/types/car';
import { globalStyles, CONTENT_HORIZONTAL_PADDING } from '../../../../shared/theme/theme';
import { useInfoDialog } from '../../../../shared/hooks/useInfoDialog';

type Nav = StackNavigationProp<CarStackParams, 'Mis autos'>;

export const CarsScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { vehicles, fetchVehicles, removeVehicle } = useAccountStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Car | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showInfo, InfoDialog } = useInfoDialog();

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
      showInfo('Error', msg);
    } finally {
      setDeleting(false);
    }
  }, [vehicleToDelete, removeVehicle, showInfo]);

  if (!vehicles) {
    return (
      <Fragment>
        <Layout style={styles.centered}>
          <Text category="s1">Cargando información del usuario...</Text>
        </Layout>
        {InfoDialog}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <Layout level="1" style={globalStyles.container}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.length === 0 ? (
            <EmptyStateLayout
              title="Sin vehículos"
              subtitle="Agrega uno para realizar tu primera carga."
              icon={{ name: 'car', iconStyle: 'solid' }}
            />
          ) : (
            vehicles.map((vehicle, index) => (
              <CarCardHorizontal
                key={vehicle.id}
                vehicle={vehicle}
                showTopSeparator={index > 0}
                onDeletePress={() => setVehicleToDelete(vehicle)}
              />
            ))
          )}
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
            },
          ]}
        >
          <ButtonPrimary
            title="Agregar vehículo"
            onPress={() =>
              navigation.navigate('Formularios', { screen: 'Crear auto' })
            }
            style={styles.addButton}
          />
        </View>
      </Layout>
      {InfoDialog}
    </Fragment>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  footer: {
    paddingTop: 8,
  },
  addButton: {
    width: '100%',
  },
  confirmText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
