import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Layout, Text } from '@ui-kitten/components';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import type { ProfileFormStackParams } from '../../../routes/navigationParams';
import { useUserStore } from '../../../../modules/user/store/useUserStore';
import { ScreenBackHeader } from '../../../../shared/components/layout/ScreenBackHeader';
import { FormInput } from '../../../../shared/components/ui/form';
import { useInfoDialog } from '../../../../shared/hooks/useInfoDialog';

type Nav = StackNavigationProp<ProfileFormStackParams, 'Editar perfil'>;

export const EditProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useUserStore();
  const [isPosting, setIsPosting] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', phone: '' });
  const { showInfo, InfoDialog } = useInfoDialog();

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

  const handleBack = () => navigation.goBack();

  if (!user) {
    return (
      <Layout style={styles.flex1}>
        <ScreenBackHeader onBack={handleBack} />
        <Layout style={styles.centered}>
          <Text category="s1">Cargando información del usuario...</Text>
        </Layout>
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
      showInfo('Info', 'No hay cambios para guardar');
      return;
    }
    const success = await updateUser(emailToUpdate, firstNameToUpdate, lastNameToUpdate, phoneToUpdate);
    setIsPosting(false);
    if (success) {
      showInfo('Éxito', 'Perfil actualizado correctamente.', {
        onAfterAccept: () => navigation.goBack(),
      });
    } else {
      showInfo('Error', 'No se pudo actualizar el perfil');
    }
  };

  return (
    <Layout style={styles.flex1}>
      {InfoDialog}
      <ScreenBackHeader onBack={handleBack} />
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
        </GHScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scroll: { marginHorizontal: 20 },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: { marginTop: 8 },
});
