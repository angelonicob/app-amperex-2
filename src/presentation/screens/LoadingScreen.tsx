import { Layout, Text } from '@ui-kitten/components';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export const LoadingScreen = () => {
  return (
    <Layout level="1" style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" />
        <Text category="s1" style={styles.text}>
          Cargando...
        </Text>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 20, textAlign: 'center' },
});
