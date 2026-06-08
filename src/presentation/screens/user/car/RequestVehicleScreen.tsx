import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Fragment, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Layout } from '@ui-kitten/components';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { globalStyles } from '../../../../shared/theme/theme';
import type { CarFormStackParams } from '../../../routes/navigationParams';
import { createVariantRequest } from '../../../../modules/vehicles/requestVariant';
import { FormInput, FormText } from '../../../../shared/components/ui/form';
import { useInfoDialog } from '../../../../shared/hooks/useInfoDialog';

type Nav = StackNavigationProp<CarFormStackParams, 'Solicitar vehículo'>;

export const RequestVehicleScreen = () => {
  const navigation = useNavigation<Nav>();
  const colors = useAppTheme();
  const [form, setForm] = useState({
    brand: '',
    model: '',
    variant: '',
    year: '',
    additionalInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { showInfo, InfoDialog } = useInfoDialog();
  const scrollViewRef = useRef<ScrollView>(null);
  const brandContainerRef = useRef<View>(null);
  const modelContainerRef = useRef<View>(null);
  const variantContainerRef = useRef<View>(null);
  const yearContainerRef = useRef<View>(null);
  const additionalInfoContainerRef = useRef<View>(null);

  const scrollToInput = (containerRef: React.RefObject<View | null>) => {
    if (
      Platform.OS === 'android' &&
      containerRef.current &&
      scrollViewRef.current
    ) {
      setTimeout(() => {
        const container = containerRef.current;
        const scrollView = scrollViewRef.current;
        if (container && scrollView) {
          container.measureLayout(
            scrollView as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({
                y: y - 100,
                animated: true,
              });
            },
            () => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            },
          );
        }
      }, 150);
    }
  };

  const onSubmitRequest = async () => {
    if (
      !form.brand.trim() ||
      !form.model.trim() ||
      !form.variant.trim() ||
      !form.year.trim()
    ) {
      showInfo('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }
    const yearNum = parseInt(form.year, 10);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > 2100) {
      showInfo('Error', 'Ingresa un año válido');
      return;
    }
    setSubmitting(true);
    try {
      await createVariantRequest({
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant.trim() || undefined,
        yearFrom: yearNum,
        notes: form.additionalInfo.trim() || undefined,
      });
      showInfo(
        'Solicitud enviada',
        'Tu solicitud ha sido enviada. Te notificaremos cuando tu vehículo esté disponible.',
        {
          onAfterAccept: () => navigation.getParent()?.navigate('Mis autos'),
        },
      );
    } catch (e: unknown) {
      const message =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((e as { response: { data: { message: string } } }).response.data.message)
          : e && typeof e === 'object' && 'message' in e
            ? String((e as { message?: string }).message)
            : 'Error al enviar la solicitud';
      showInfo('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Fragment>
      <Layout style={globalStyles.container}>
        <KeyboardAvoidingView
          style={globalStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            style={globalStyles.scroll}
            contentContainerStyle={[
              globalStyles.scrollContent,
              styles.scrollContent,
              { paddingTop: 16, paddingBottom: 40 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Si no encuentras tu vehículo, solicítalo aquí
            </Text>
            <View style={styles.formBlock}>
              <FormInput
                label="Marca *"
                placeholder="Ingresa la marca del vehículo"
                value={form.brand}
                onChangeText={(text: string) => setForm({ ...form, brand: text })}
                required
                containerRef={brandContainerRef}
                onFocus={() => scrollToInput(brandContainerRef)}
              />
              <FormInput
                label="Modelo *"
                placeholder="Ingresa el modelo del vehículo"
                value={form.model}
                onChangeText={(text: string) => setForm({ ...form, model: text })}
                required
                containerRef={modelContainerRef}
                onFocus={() => scrollToInput(modelContainerRef)}
              />
              <FormInput
                label="Versión *"
                placeholder="Ingresa la variante del vehículo"
                value={form.variant}
                onChangeText={(text: string) => setForm({ ...form, variant: text })}
                required
                containerRef={variantContainerRef}
                onFocus={() => scrollToInput(variantContainerRef)}
              />
              <FormInput
                label="Año *"
                placeholder="Ingresa el año del vehículo"
                value={form.year}
                onChangeText={(text: string) => setForm({ ...form, year: text })}
                keyboardType="numeric"
                required
                containerRef={yearContainerRef}
                onFocus={() => scrollToInput(yearContainerRef)}
              />
              <FormText
                label="Información adicional"
                placeholder="Información adicional sobre el vehículo"
                value={form.additionalInfo}
                onChangeText={(text: string) => setForm({ ...form, additionalInfo: text })}
                containerRef={additionalInfoContainerRef}
                onFocus={() => scrollToInput(additionalInfoContainerRef)}
              />
            </View>
            <Pressable
              onPress={onSubmitRequest}
              disabled={submitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.submitLabel, { color: colors.white }]}>
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Layout>
      {InfoDialog}
    </Fragment>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  formBlock: {
    marginTop: 0,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitLabel: {
    fontWeight: '600',
  },
});
