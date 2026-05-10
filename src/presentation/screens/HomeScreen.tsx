import { Layout, Text } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';

export const HomeScreen = () => {
  return (
    <Layout style={styles.container}>
      <Text category="h5">Home Screen</Text>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
