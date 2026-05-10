import { useNavigation } from '@react-navigation/native';
import { Button, Layout, Text } from '@ui-kitten/components';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useUserStore } from '../../../../modules/user/store/useUserStore';
import { FormInput } from '../../../../shared/components/ui/form';

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useUserStore();
  const [isPosting, setIsPosting] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <Layout style={styles.centered}>
        <Text category="s1">Cargando información del usuario...</Text>
      </Layout>
    );
  }

  const onUpdate = async () => {
    setIsPosting(true);
    const emailToUpdate = form.email !== user.email ? form.email : undefined;
    const firstNameToUpdate = form.firstName !== (user.firstName || '') ? form.firstName : undefined;
    const lastNameToUpdate = form.lastName !== (user.lastName || '') ? form.lastName : undefined;
    const phoneToUpdate = form.phone !== (user.phone || '') ? form.phone : undefined;
    if (!emailToUpdate && !firstNameToUpdate && !lastNameToUpdate && !phoneToUpdate) {
      setIsPosting(false);
      Alert.alert('Info', 'No hay cambios para guardar');
      return;
    }
    const success = await updateUser(emailToUpdate, firstNameToUpdate, lastNameToUpdate, phoneToUpdate);
    setIsPosting(false);
    if (success) {
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  return (
    <Layout style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <GHScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Layout style={styles.headerBlock}>
            <Text category="h5" style={styles.title}>
              Editar Perfil
            </Text>
            <Text category="s1" appearance="hint" style={styles.subtitle}>
              Modifica tu información personal
            </Text>
          </Layout>
          <FormInput
            label="Nombre"
            placeholder="Tu nombre"
            value={form.firstName}
            onChangeText={(text) => setForm({ ...form, firstName: text })}
            autoCapitalize="words"
            autoComplete="name-given"
            textContentType="givenName"
            disabled={isPosting}
          />
          <FormInput
            label="Apellido"
            placeholder="Tu apellido"
            value={form.lastName}
            onChangeText={(text) => setForm({ ...form, lastName: text })}
            autoCapitalize="words"
            autoComplete="name-family"
            textContentType="familyName"
            disabled={isPosting}
          />
          <FormInput
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            disabled={isPosting}
          />
          <FormInput
            label="Teléfono"
            placeholder="+56 9 1234 5678"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            disabled={isPosting}
          />
          <Button
            status="primary"
            onPress={onUpdate}
            disabled={isPosting}
            style={styles.primaryButton}
          >
            Guardar
          </Button>
          <Button
            appearance="outline"
            onPress={() => navigation.goBack()}
            disabled={isPosting}
            style={styles.secondaryButton}
          >
            Cancelar
          </Button>
        </GHScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { marginHorizontal: 20 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBlock: { marginBottom: 20 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 20 },
  primaryButton: { marginBottom: 12 },
  secondaryButton: {},
});
