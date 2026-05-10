import { useNavigation } from '@react-navigation/native';
import { Button, Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../../modules/auth/store/userAuthStore';
import { deleteMe } from '../../../../modules/user/user';
import { useUserStore } from '../../../../modules/user/store/useUserStore';
import { replaceToRoute } from '../../../routes/navigationRef';
import { AvatarInitial } from '../../../../shared/components/AvatarInitial';
import { ButtonPrimary } from '../../../../shared/components/ui/button';
import { ConfirmPopup } from '../../../../shared/components/ui/popup';
import { FormView } from '../../../../shared/components/ui/form';
import { getDisplayName } from '../../../../shared/utils/displayName';
import { globalStyles } from '../../../../shared/theme/theme';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { logout } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) {
    return (
      <Layout style={[styles.centered, { paddingTop: insets.top }]}>
        <Text category="s1">Cargando información del usuario...</Text>
      </Layout>
    );
  }

  const handleEditProfile = () => {
    (navigation.getParent() as any)?.navigate?.('Perfil', {
      screen: 'EditProfile',
    });
  };

  const handleConfirmDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const result = await deleteMe();
      if (result.success) {
        setShowDeleteConfirm(false);
        logout();
        replaceToRoute('Auth');
      } else {
        setShowDeleteConfirm(false);
        Alert.alert('No se pudo eliminar la cuenta', result.message);
      }
    } finally {
      setDeleting(false);
    }
  }, [logout]);

  return (
    <Layout style={globalStyles.container}>
      <ConfirmPopup
        visible={showDeleteConfirm}
        onRequestClose={() => {
          if (!deleting) setShowDeleteConfirm(false);
        }}
        title="Eliminar cuenta"
        labelConfirm="Eliminar"
        confirmDestructive
        loading={deleting}
        onConfirm={handleConfirmDeleteAccount}
      >
        <Text category="s1" appearance="hint" style={styles.confirmText}>
          ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede
          deshacer.
        </Text>
      </ConfirmPopup>
      <ScrollView
        style={globalStyles.scroll}
        contentContainerStyle={[
          globalStyles.scrollContent,
          styles.scrollContent,
          {
            paddingTop: insets.top + 24,
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
            paddingTop: 16
          },
        ]}
      >
        <ButtonPrimary
          title="Editar perfil"
          onPress={handleEditProfile}
          disabled={deleting}
        />
        <Button
          status="danger"
          appearance="ghost"
          onPress={() => setShowDeleteConfirm(true)}
          disabled={deleting || showDeleteConfirm}
          style={styles.dangerButton}
        >
          {deleting ? 'Eliminando…' : 'Eliminar cuenta'}
        </Button>
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
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  fields: {
    width: '100%',
  },
  footer: {
    gap: 12,
  },
  dangerButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  confirmText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
