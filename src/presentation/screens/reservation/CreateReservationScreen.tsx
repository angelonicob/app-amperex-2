import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { formatDateTime } from '../../../modules/user/account';
import type { ReservaStackParams } from '../../routes/navigationParams';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

type Nav = StackNavigationProp<ReservaStackParams, 'Crear reserva'>;
export const CreateReservationScreen = () => {
  const colors = useAppTheme();
  const navigation = useNavigation<Nav>();
  const { addReservation, vehicles } = useAccountStore();

  const [date, setDate] = useState(() => new Date());
  const [horaEntrada, setHoraEntrada] = useState<string>('');
  const [horaSalida, setHoraSalida] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

  const handleDateSelect = useCallback(
    (_event: unknown, nextDate?: Date) => {
      if (Platform.OS === 'android') setShowDatePicker(false);
      if (nextDate != null) setDate(nextDate);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!horaEntrada || horaEntrada.length !== 4) {
      Alert.alert('Error', 'Ingresa una hora de entrada válida (4 dígitos)');
      return;
    }
    if (!horaSalida || horaSalida.length !== 4) {
      Alert.alert('Error', 'Ingresa una hora de salida válida (4 dígitos)');
      return;
    }
    if (vehicles.length === 0) {
      Alert.alert('Error', 'No tienes vehículos registrados');
      return;
    }

    setIsSubmitting(true);
    try {
      const reservation = {
        vehicleId: vehicles[0].id,
        startAt: formatDateTime(date, horaEntrada),
        endAt: formatDateTime(date, horaSalida),
      };
      const result = await addReservation(reservation);
      if (result) {
        Alert.alert('Éxito', 'Reserva creada correctamente');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo crear la reserva');
      }
    } catch {
      Alert.alert('Error', 'No se pudo crear la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: colors.text,
    backgroundColor: colors.background,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Nueva Reserva</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Completa los datos de tu reserva
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Fecha</Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {date.toLocaleDateString()}
          </Text>
          {Platform.OS === 'android' && (
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateButton, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.primary }}>Elegir fecha</Text>
            </Pressable>
          )}
          {(showDatePicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateSelect}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Hora de Entrada</Text>
          <TextInput
            value={horaEntrada}
            onChangeText={setHoraEntrada}
            placeholder="0900"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={5}
            style={inputStyle}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Hora de Salida</Text>
          <TextInput
            value={horaSalida}
            onChangeText={setHoraSalida}
            placeholder="1800"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={5}
            style={inputStyle}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { marginHorizontal: 20 },
  scrollContent: { paddingVertical: 40, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 5, opacity: 0.7 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  dateText: { marginTop: 4 },
  dateButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonContainer: { marginTop: 20 },
  button: {
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
