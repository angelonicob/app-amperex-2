import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import type { CarStackParams } from '../../../routes/navigationParams';
import type { IndexPath } from '../../../../shared/components/ui/form';
import { FormInput, FormSelect } from '../../../../shared/components/ui/form';
import { LabelWarning } from '../../../../shared/components/ui/card';
import { useAccountStore } from '../../../../modules/user/store/useAccountStore';
import {
  CHILE_PLATE_HINT,
  isValidChilePlateFormat,
  normalizeChilePlate,
} from '../../../../shared/utils/chilePlate';

type Nav = StackNavigationProp<CarStackParams, 'Crear auto'>;
export const CreateCarScreen = () => {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState({ vehicleId: '', plate: '' });
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [selectedBrandIndex, setSelectedBrandIndex] = useState<
    IndexPath | undefined
  >(undefined);
  const [selectedModelIndex, setSelectedModelIndex] = useState<
    IndexPath | undefined
  >(undefined);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    IndexPath | undefined
  >(undefined);
  const [isPosting, setIsPosting] = useState(false);
  const [plateSubmitAttempted, setPlateSubmitAttempted] = useState(false);
  const { assignVehicle, availableVehicles, fetchVehicles } = useAccountStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const brandContainerRef = useRef<View>(null);
  const modelContainerRef = useRef<View>(null);
  const variantContainerRef = useRef<View>(null);
  const patenteContainerRef = useRef<View>(null);
  const prevBrandIndexRef = useRef<IndexPath | undefined>(undefined);
  const prevModelIndexRef = useRef<IndexPath | undefined>(undefined);

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
          (x, y, width, h) => {
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
        navigation.goBack();
      } else {
        setWarningMessage('No se pudo asociar el vehículo.');
      }
    } catch (error: any) {
      setIsPosting(false);
      setWarningMessage(
        error?.message ||
          'No se pudo asociar el vehículo. Intenta nuevamente.',
      );
    }
  };

  const brands = availableVehicles.map(brand => brand.brand);
  const models = availableModels.map(model => model.model);
  const variants = availableVariants.map(
    variant => `${variant.name} (${variant.yearFrom} - ${variant.yearTo})`,
  );

  if (isPosting) {
    return (
      <Layout style={styles.centered}>
        <Text category="s1" style={styles.loadingText}>Cargando...</Text>
      </Layout>
    );
  }

  return (
    <Layout style={styles.flex1}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text category="h4" style={styles.title}>Agregar Auto</Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              Por favor, ingrese los datos del auto
            </Text>
          </View>
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
          <View style={styles.buttonBlock}>
            <Button
              status="primary"
              onPress={onAddVehicle}
              disabled={isPosting}
              style={styles.primaryButton}
            >
              Agregar
            </Button>
          </View>
          <View style={styles.ghostBlock}>
            <Text category="s1" appearance="hint" style={styles.ghostLabel}>
              ¿No encuentras tu vehículo?
            </Text>
            <Button
              appearance="ghost"
              status="primary"
              onPress={() => navigation.navigate('Solicitar vehículo')}
            >
              Agrégalo
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, fontWeight: '600' },
  scroll: { marginHorizontal: 40 },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerBlock: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8, opacity: 0.7 },
  formBlock: { marginTop: 8 },
  buttonBlock: { marginTop: 20 },
  primaryButton: {},
  ghostBlock: { marginTop: 20, alignItems: 'center' },
  ghostLabel: { textAlign: 'center', marginBottom: 10 },
});
