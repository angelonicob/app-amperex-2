import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Layout, Text } from '@ui-kitten/components';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { CarFormStackParams } from '../../../routes/navigationParams';
import { navigationRef } from '../../../routes/navigationRef';
import { useSessionStore } from '../../../../modules/session/store/useSessionStore';
import type { FormSelectIndexPath } from '../../../../shared/components/ui/form';
import { FormInput, FormSelect } from '../../../../shared/components/ui/form';
import { LabelWarning } from '../../../../shared/components/ui/card';
import {
  ButtonPrimary,
  ButtonTransparent,
} from '../../../../shared/components/ui/button';
import { useAccountStore } from '../../../../modules/user/store/useAccountStore';
import {
  CHILE_PLATE_HINT,
  isValidChilePlateFormat,
  normalizeChilePlate,
} from '../../../../shared/utils/chilePlate';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { globalStyles } from '../../../../shared/theme/theme';

type Nav = StackNavigationProp<CarFormStackParams, 'Crear auto'>;
type CreateCarRoute = RouteProp<CarFormStackParams, 'Crear auto'>;

export const CreateCarScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<CreateCarRoute>();
  const colors = useAppTheme();
  const [form, setForm] = useState({ vehicleId: '', plate: '' });
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [selectedBrandIndex, setSelectedBrandIndex] = useState<
    FormSelectIndexPath | undefined
  >(undefined);
  const [selectedModelIndex, setSelectedModelIndex] = useState<
    FormSelectIndexPath | undefined
  >(undefined);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    FormSelectIndexPath | undefined
  >(undefined);
  const [isPosting, setIsPosting] = useState(false);
  const [plateSubmitAttempted, setPlateSubmitAttempted] = useState(false);
  const { assignVehicle, availableVehicles, fetchVehicles } = useAccountStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const brandContainerRef = useRef<View>(null);
  const modelContainerRef = useRef<View>(null);
  const variantContainerRef = useRef<View>(null);
  const patenteContainerRef = useRef<View>(null);
  const prevBrandIndexRef = useRef<FormSelectIndexPath | undefined>(undefined);
  const prevModelIndexRef = useRef<FormSelectIndexPath | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const timeoutId = setTimeout(() => {
        if (isMounted) fetchVehicles();
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }, [fetchVehicles]),
  );

  const selectedBrand = useMemo(() => {
    if (
      availableVehicles.length > 0 &&
      selectedBrandIndex !== undefined &&
      selectedBrandIndex.row < availableVehicles.length
    ) {
      return availableVehicles[selectedBrandIndex.row];
    }
    return null;
  }, [availableVehicles, selectedBrandIndex]);

  const availableModels = useMemo(() => selectedBrand?.models || [], [selectedBrand]);

  const selectedModel = useMemo(() => {
    if (
      availableModels.length > 0 &&
      selectedModelIndex !== undefined &&
      selectedModelIndex.row < availableModels.length
    ) {
      return availableModels[selectedModelIndex.row];
    }
    return null;
  }, [availableModels, selectedModelIndex]);

  const availableVariants = useMemo(() => selectedModel?.variants || [], [selectedModel]);

  const selectedVariant = useMemo(() => {
    if (
      availableVariants.length > 0 &&
      selectedVariantIndex !== undefined &&
      selectedVariantIndex.row < availableVariants.length
    ) {
      return availableVariants[selectedVariantIndex.row];
    }
    return null;
  }, [availableVariants, selectedVariantIndex]);

  useLayoutEffect(() => {
    if (
      prevBrandIndexRef.current !== undefined &&
      selectedBrandIndex !== prevBrandIndexRef.current
    ) {
      setSelectedModelIndex(undefined);
      setSelectedVariantIndex(undefined);
      setForm({ vehicleId: '', plate: '' });
    }
    prevBrandIndexRef.current = selectedBrandIndex;
  }, [selectedBrandIndex]);

  useLayoutEffect(() => {
    if (
      prevModelIndexRef.current !== undefined &&
      selectedModelIndex !== prevModelIndexRef.current
    ) {
      setSelectedVariantIndex(undefined);
      setForm(prev => ({ ...prev, vehicleId: '' }));
    }
    prevModelIndexRef.current = selectedModelIndex;
  }, [selectedModelIndex]);

  useLayoutEffect(() => {
    if (selectedVariant) {
      setForm(prev =>
        prev.vehicleId !== selectedVariant.vehicleId
          ? { ...prev, vehicleId: selectedVariant.vehicleId }
          : prev,
      );
    }
  }, [selectedVariant]);

  const plateWarningMessage = useMemo(() => {
    if (isValidChilePlateFormat(form.plate)) return '';
    const p = normalizeChilePlate(form.plate);
    if (p.length === 0) return '';
    if (p.length < 6 && !plateSubmitAttempted) return '';
    return CHILE_PLATE_HINT;
  }, [form.plate, plateSubmitAttempted]);

  const scrollToInput = useCallback(
    (containerRef: React.RefObject<View | null>) => {
      if (!containerRef.current || !scrollViewRef.current) return;
      const performScroll = () => {
        const container = containerRef.current;
        const scrollView = scrollViewRef.current;
        if (!container || !scrollView) return;
        container.measureLayout(
          scrollView as any,
          (x, y) => {
            const offset = 150;
            scrollView.scrollTo({ y: Math.max(0, y - offset), animated: true });
          },
          () => {
            setTimeout(() => scrollView.scrollToEnd({ animated: true }), 100);
          },
        );
      };
      requestAnimationFrame(() => {
        setTimeout(performScroll, Platform.OS === 'android' ? 250 : 150);
        setTimeout(performScroll, Platform.OS === 'android' ? 400 : 300);
      });
    },
    [],
  );

  const onAddVehicle = async () => {
    if (!form.vehicleId || !form.plate.trim()) {
      setWarningMessage('Por favor completa todos los campos.');
      return;
    }
    if (!isValidChilePlateFormat(form.plate)) {
      setPlateSubmitAttempted(true);
      setWarningMessage('');
      return;
    }
    const plateNormalized = normalizeChilePlate(form.plate);
    setIsPosting(true);
    try {
      const newVehicle = await assignVehicle(form.vehicleId, plateNormalized);
      setIsPosting(false);
      if (newVehicle) {
        await fetchVehicles();
        const resumeQrSession = route.params?.resumeQrSession === true;
        const scan = useSessionStore.getState().scanQrResponse;
        if (resumeQrSession && scan && navigationRef.isReady()) {
          navigationRef.navigate('Session', { screen: 'Parámetros' });
          return;
        }
        navigation.goBack();
      } else {
        setWarningMessage('No se pudo asociar el vehículo.');
      }
    } catch (error: unknown) {
      setIsPosting(false);
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No se pudo asociar el vehículo. Intenta nuevamente.';
      setWarningMessage(message);
    }
  };

  const brands = availableVehicles.map(brand => brand.brand);
  const models = availableModels.map(model => model.model);
  const variants = availableVariants.map(
    variant => `${variant.name} (${variant.yearFrom} - ${variant.yearTo})`,
  );

  const scrollContentStyle = useMemo(
    () => [
      globalStyles.scrollContent,
      styles.scrollContent,
      { paddingTop: 16, paddingBottom: 40 },
    ],
    [],
  );

  if (isPosting) {
    return (
      <Layout style={globalStyles.container}>
        <View style={styles.centered}>
          <Text category="s1" style={{ color: colors.text }}>
            Cargando...
          </Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={globalStyles.container}>
      <KeyboardAvoidingView
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={globalStyles.scroll}
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Por favor, ingrese los datos del auto
            </Text>
            <LabelWarning
              message={
                warningMessage.trim()
                  ? warningMessage
                  : plateWarningMessage
              }
            />
            <View style={styles.formBlock}>
              <FormSelect
                label="Marca"
                placeholder={
                  selectedBrandIndex === undefined
                    ? 'Selecciona la marca'
                    : 'Selecciona una marca'
                }
                selectedIndex={selectedBrandIndex}
                onSelect={(idx) => {
                  setWarningMessage('');
                  setSelectedBrandIndex(idx);
                }}
                value={selectedBrand?.brand || ''}
                options={brands}
                containerRef={brandContainerRef}
                onSelectCallback={() => scrollToInput(brandContainerRef)}
              />
              <FormSelect
                label="Modelo"
                placeholder={
                  selectedBrandIndex === undefined
                    ? 'Selecciona la marca primero'
                    : selectedModelIndex === undefined
                    ? 'Selecciona el modelo'
                    : 'Selecciona un modelo'
                }
                selectedIndex={selectedModelIndex}
                onSelect={(idx) => {
                  setWarningMessage('');
                  setSelectedModelIndex(idx);
                }}
                value={selectedModel?.model || ''}
                options={models}
                disabled={selectedBrandIndex === undefined}
                containerRef={modelContainerRef}
                onSelectCallback={() => scrollToInput(modelContainerRef)}
              />
              <FormSelect
                label="Variante"
                placeholder={
                  selectedModelIndex === undefined
                    ? 'Selecciona el modelo primero'
                    : selectedVariantIndex === undefined
                    ? 'Selecciona la variante'
                    : 'Selecciona una variante'
                }
                selectedIndex={selectedVariantIndex}
                onSelect={(idx) => {
                  setWarningMessage('');
                  setSelectedVariantIndex(idx);
                }}
                value={
                  selectedVariant
                    ? `${selectedVariant.name} (${selectedVariant.yearFrom} - ${selectedVariant.yearTo})`
                    : ''
                }
                options={variants}
                disabled={selectedModelIndex === undefined}
                containerRef={variantContainerRef}
                onSelectCallback={() => scrollToInput(variantContainerRef)}
              />
              <FormInput
                label="Patente"
                placeholder={
                  selectedVariantIndex === undefined
                    ? 'Selecciona la variante primero'
                    : 'Ej: AB1234 o ABCD12'
                }
                value={form.plate}
                onChangeText={(text: string) => {
                  setPlateSubmitAttempted(false);
                  setWarningMessage('');
                  setForm({
                    ...form,
                    plate: text.replace(/[^A-Za-z0-9\s-]/g, '').toUpperCase(),
                  });
                }}
                onFocus={() => setTimeout(() => scrollToInput(patenteContainerRef), 100)}
                autoCapitalize="characters"
                disabled={selectedVariantIndex === undefined}
                containerRef={patenteContainerRef}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <ButtonPrimary
              title="Agregar"
              onPress={() => void onAddVehicle()}
              disabled={isPosting}
            />
            <View style={styles.ghostBlock}>
              <Text style={[styles.ghostLabel, { color: colors.textSecondary }]}>
                ¿No encuentras tu vehículo?
              </Text>
              <ButtonTransparent
                title="Agrégalo"
                onPress={() => navigation.navigate('Solicitar vehículo')}
                style={styles.ghostButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  formBlock: { marginTop: 8 },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  ghostBlock: {
    marginTop: 12,
    alignItems: 'center',
  },
  ghostLabel: {
    textAlign: 'center',
    marginBottom: 2,
    fontSize: 14,
  },
  ghostButton: {
    marginTop: 0,
    paddingVertical: 6,
  },
});
