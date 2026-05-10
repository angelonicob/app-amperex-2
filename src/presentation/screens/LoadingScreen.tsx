import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../../shared/theme/useAppTheme';

export const LoadingScreen = () => {
  const colors = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text, marginTop: 20 }]}>
          Cargando...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, fontWeight: '600' },
});
