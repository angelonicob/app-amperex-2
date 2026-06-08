import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Layout, Text } from '@ui-kitten/components';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../../../modules/user/store/useUserStore';
import type { ProfileStackParams } from '../../../routes/navigationParams';
import { AvatarInitial } from '../../../../shared/components/AvatarInitial';
import { ButtonPrimary } from '../../../../shared/components/ui/button';
import { FormView } from '../../../../shared/components/ui/form';
import { getDisplayName } from '../../../../shared/utils/displayName';
import { globalStyles } from '../../../../shared/theme/theme';

type Nav = StackNavigationProp<ProfileStackParams, 'ProfileMain'>;

export const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

  if (!user) {
    return (
      <Layout style={styles.centered}>
        <Text category="s1">Cargando información del usuario...</Text>
      </Layout>
    );
  }

  const handleEditProfile = () => {
    navigation.navigate('Formularios', { screen: 'Editar perfil' });
  };

  return (
    <Layout style={globalStyles.container}>
      <ScrollView
        style={globalStyles.scroll}
        contentContainerStyle={[
          globalStyles.scrollContent,
          styles.scrollContent,
          {
            paddingTop: 24,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AvatarInitial
          name={getDisplayName(user)}
          size={80}
          style={styles.avatar}
        />

        <View style={styles.fields}>
          <FormView label="Nombre" value={user.firstName ?? ''} />
          <FormView label="Apellido" value={user.lastName ?? ''} />
          <FormView label="Correo electrónico" value={user.email} />
          <FormView label="Teléfono" value={user.phone ?? ''} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
            paddingTop: 16,
          },
        ]}
      >
        <ButtonPrimary title="Editar perfil" onPress={handleEditProfile} />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { alignSelf: 'center', marginBottom: 24 },
  fields: {
    width: '100%',
  },
  footer: {},
});
