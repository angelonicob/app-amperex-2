import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layout } from '@ui-kitten/components';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { globalStyles } from '../../../../shared/theme/theme';
import type { CarStackParams } from '../../../routes/navigationParams';
import { createVariantRequest } from '../../../../modules/vehicles/requestVariant';
import { FormInput, FormText } from '../../../../shared/components/ui/form';
import { InfoPopup } from '../../../../shared/components/ui/popup/InfoPopup';

type Nav = StackNavigationProp<CarStackParams, 'Solicitar vehículo'>;
export const RequestVehicleScreen = () => {
  const navigation = useNavigation<Nav>();
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    brand: '',
    model: '',
    variant: '',
    year: '',
    additionalInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
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
            (x, y, width, height) => {
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
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }
    const yearNum = parseInt(form.year, 10);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > 2100) {
      Alert.alert('Error', 'Ingresa un año válido');
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
      setSuccessPopupVisible(true);
    } catch (e: any) {
      const message = e?.response?.data?.message ?? e?.message ?? 'Error al enviar la solicitud';
      Alert.alert('Error', String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={globalStyles.container}>
      <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={globalStyles.scroll}
          contentContainerStyle={[
            globalStyles.scrollContent,
            {
              paddingTop: insets.top + 24,
              paddingBottom: 40,
              flexGrow: 1,
              justifyContent: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={[{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' as const }, { color: colors.text }]}>Solicitar Vehículo</Text>
            <Text style={[{ textAlign: 'center', marginTop: 8, opacity: 0.7, fontSize: 14 }, { color: colors.textSecondary }]}>Si no encuentras tu vehículo, solicítalo aquí</Text>
          </View>
          <View style={{ marginTop: 20 }}>
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
          <Pressable onPress={onSubmitRequest} disabled={submitting} style={{ marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', opacity: submitting ? 0.7 : 1 }}>
            <Text style={{ color: colors.white, fontWeight: '600' as const }}>{submitting ? 'Enviando…' : 'Enviar solicitud'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <InfoPopup
        visible={successPopupVisible}
        title="Solicitud enviada"
        message="Tu solicitud ha sido enviada. Te notificaremos cuando tu vehículo esté disponible."
        buttonTitle="OK"
        onAccept={() => {
          setSuccessPopupVisible(false);
          navigation.navigate('Mis autos');
        }}
      />
    </Layout>
  );
};
