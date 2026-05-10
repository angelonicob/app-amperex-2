import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

export const EditReservaScreen = () => {
  const colors = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Edit reservas</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
