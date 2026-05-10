import { StyleSheet, Text, View } from 'react-native';

export interface LabelWarningProps {
  /** Si está vacío, no se renderiza nada. */
  message: string;
}

export const LabelWarning = ({ message }: LabelWarningProps) => {
  const trimmed = message.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.text}>{trimmed}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  text: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
});
