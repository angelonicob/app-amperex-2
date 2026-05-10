import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReservaStackParams } from '../../routes/navigationParams';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

type Nav = StackNavigationProp<ReservaStackParams, 'Mis reservas'>;
export const MyReservasScreen = () => {
  const colors = useAppTheme();
  const navigation = useNavigation<Nav>();
  const { reservations } = useAccountStore();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const cardStyle = {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  if (!reservations || reservations.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerBlock}>
          <Pressable
            onPress={() => navigation.navigate('Crear reserva')}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>Crear reserva</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Mis reservas</Text>
        <View style={styles.emptyBlock}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tienes reservas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBlock}>
        <Pressable
          onPress={() => navigation.navigate('Crear reserva')}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>Crear reserva</Text>
        </Pressable>
      </View>
      <Text style={[styles.titleList, { color: colors.text }]}>Mis reservas</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reservations.map(reservation => (
          <View key={reservation.id} style={cardStyle}>
            <View style={styles.cardColumn}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Fecha
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatDate(reservation.startAt)}
              </Text>
            </View>
            <View style={styles.cardColumn}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Hora Entrada
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatTime(reservation.startAt)}
              </Text>
            </View>
            <View style={styles.cardColumn}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Hora Salida
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {formatTime(reservation.endAt)}
              </Text>
            </View>
            <View style={styles.cardColumn}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Estado
              </Text>
              <Text style={[styles.cardValue, { color: colors.text }]}>
                {reservation.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: { marginHorizontal: 20, marginTop: 20 },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  title: { marginHorizontal: 20, marginTop: 20, fontSize: 22, fontWeight: '700' },
  titleList: { marginVertical: 20, marginHorizontal: 20, fontSize: 22, fontWeight: '700' },
  emptyBlock: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600' },
  scroll: { marginHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  cardColumn: { flex: 1 },
  cardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '600' },
});
