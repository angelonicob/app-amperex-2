import { Button, Input, Layout, Text } from '@ui-kitten/components';
import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemeMode, useThemeStore } from '../../shared/theme/store/useThemeStore';
import { api } from '../../infrastructure/http/Api';
import { ConfirmPopup } from '../../shared/components/ui/popup/ConfirmPopup';
import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseAuth';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { deleteMe } from '../../modules/user/user';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';

export const SettingsScreen = () => {
  const { themeMode, setThemeMode } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);

  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetRateInfo, setResetRateInfo] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  const handleThemeChange = (mode: ThemeMode) => setThemeMode(mode);

  const ThemeButton = ({ mode, label }: { mode: ThemeMode; label: string }) => (
    <Button
      size="small"
      appearance={themeMode === mode ? 'filled' : 'outline'}
      status="primary"
      onPress={() => handleThemeChange(mode)}
      style={styles.themeButton}
    >
      {label}
    </Button>
  );

  const hasPasswordProvider = useMemo(() => {
    const u = getFirebaseAuth().currentUser;
    return Boolean(u?.providerData?.some((p) => p.providerId === 'password'));
  }, []);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => {
      setCooldownSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  const startCooldown = (sec: number) => {
    setCooldownSec(Math.max(0, Math.ceil(sec)));
  };

  const handleRequestPasswordReset = async () => {
    if (resetSending || cooldownSec > 0) return;
    setResetSending(true);
    setResetError(null);
    setResetRateInfo(null);
    setResetSent(false);
    try {
      await api.post('user/me/request-password-reset', undefined);
      setResetSent(true);
      startCooldown(30);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 429) {
        const retryAfterSeconds =
          typeof (err.response.data as { retryAfterSeconds?: unknown } | undefined)
            ?.retryAfterSeconds === 'number'
            ? (err.response.data as { retryAfterSeconds: number }).retryAfterSeconds
            : 30;
        startCooldown(retryAfterSeconds);
        setResetRateInfo(
          `Has alcanzado el límite de envíos. Podrás reenviar en ${Math.max(
            0,
            Math.ceil(retryAfterSeconds),
          )} segundos.`,
        );
      } else {
        setResetError(
          'No se pudo enviar el correo. Intenta de nuevo en unos segundos.',
        );
      }
    } finally {
      setResetSending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const auth = getFirebaseAuth();
      const fbUser = auth.currentUser;
      if (!fbUser) {
        throw new Error('No hay sesión activa.');
      }
      if (hasPasswordProvider) {
        const email = fbUser.email;
        if (!email?.trim() || !deletePassword.trim()) {
          throw new Error('Introduce tu contraseña.');
        }
        await reauthenticateWithCredential(
          fbUser,
          EmailAuthProvider.credential(email, deletePassword.trim()),
        );
      }

      const out = await deleteMe();
      if (!out.success) {
        throw new Error(out.message);
      }

      setDeleteOpen(false);
      setDeletePassword('');
      logout();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDeleteError(msg || 'No se pudo eliminar la cuenta.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Layout style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text category="h5" style={styles.title}>
          Configuración
        </Text>
        <Layout style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Tema
          </Text>
          <Text category="p2" appearance="hint" style={styles.sectionDescription}>
            Selecciona el tema de la aplicación
          </Text>
          <Layout style={styles.buttonContainer}>
            <ThemeButton mode="light" label="Claro" />
            <ThemeButton mode="dark" label="Oscuro" />
            <ThemeButton mode="system" label="Sistema" />
          </Layout>
        </Layout>

        <Layout style={styles.section}>
          <Text category="s1" style={styles.sectionTitle}>
            Seguridad
          </Text>
          <Text category="p2" appearance="hint" style={styles.sectionDescription}>
            Administra tu contraseña y tu cuenta
          </Text>

          <View style={styles.securityBlock}>
            <Text category="s2" style={styles.securityBlockTitle}>
              Recuperar contraseña
            </Text>
            <Text category="p2" appearance="hint" style={styles.securityBlockBody}>
              Te enviaremos un correo con un enlace para restablecer tu contraseña. No
              olvides revisar spam.
            </Text>
            {resetError ? (
              <Text category="c1" status="danger" style={styles.inlineMsg}>
                {resetError}
              </Text>
            ) : null}
            {resetRateInfo ? (
              <Text category="c1" appearance="hint" style={styles.inlineMsg}>
                {resetRateInfo}
              </Text>
            ) : null}
            {resetSent && !resetError ? (
              <Text category="c1" status="success" style={styles.inlineMsg}>
                Correo enviado.
              </Text>
            ) : null}
            <Button
              status="primary"
              appearance="filled"
              onPress={() => void handleRequestPasswordReset()}
              disabled={resetSending || cooldownSec > 0}
            >
              {resetSending
                ? 'Enviando…'
                : cooldownSec > 0
                  ? `Reenviar en ${cooldownSec}s`
                  : 'Enviar correo'}
            </Button>
          </View>

          <View style={[styles.securityBlock, styles.dangerBlock]}>
            <Text category="s2" style={styles.securityBlockTitle}>
              Eliminar cuenta
            </Text>
            <Text category="p2" appearance="hint" style={styles.securityBlockBody}>
              Esta acción es irreversible. Tu cuenta será desactivada y ya no podrás
              iniciar sesión.
            </Text>
            <Button status="danger" appearance="outline" onPress={() => setDeleteOpen(true)}>
              Eliminar mi cuenta
            </Button>
          </View>
        </Layout>
      </ScrollView>

      <ConfirmPopup
        visible={deleteOpen}
        onRequestClose={() => {
          if (deleteBusy) return;
          setDeleteOpen(false);
          setDeleteError(null);
          setDeletePassword('');
        }}
        title="Eliminar cuenta"
        labelCancel="Cancelar"
        labelConfirm="Eliminar"
        confirmDestructive
        loading={deleteBusy}
        onConfirm={() => void handleConfirmDelete()}
      >
        <Text category="p2" appearance="hint" style={styles.deleteBody}>
          Confirma que deseas eliminar tu cuenta. Esto borrará tu usuario en Firebase y
          desactivará tu cuenta en el servidor (sin perder tus cargas históricas).
        </Text>
        {hasPasswordProvider ? (
          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            disabled={deleteBusy}
            style={styles.deletePasswordInput}
          />
        ) : null}
        {deleteError ? (
          <Text category="c1" status="danger" style={styles.inlineMsg}>
            {deleteError}
          </Text>
        ) : null}
      </ConfirmPopup>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 20 },
  title: { marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 8 },
  sectionDescription: { marginBottom: 16 },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: { minWidth: 100 },
  securityBlock: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    gap: 10,
  },
  dangerBlock: {
    marginTop: 14,
  },
  securityBlockTitle: {
    marginBottom: 2,
  },
  securityBlockBody: {
    marginBottom: 4,
  },
  inlineMsg: {
    marginTop: 6,
  },
  deleteBody: {
    marginBottom: 12,
  },
  deletePasswordInput: {
    marginBottom: 8,
  },
});
