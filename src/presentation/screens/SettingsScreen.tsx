import { Input, Layout, Text } from '@ui-kitten/components';
import { isAxiosError } from 'axios';
import * as Application from 'expo-application';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ThemeMode, useThemeStore } from '../../shared/theme/store/useThemeStore';
import { useAppTheme } from '../../shared/theme/useAppTheme';
import { api } from '../../infrastructure/http/Api';
import { ButtonPrimary, ButtonTransparent } from '../../shared/components/ui/button';
import { ConfirmPopup } from '../../shared/components/ui/popup/ConfirmPopup';
import { SectionLabel } from '../../shared/components/ui/SectionLabel';
import { PermissionSettingsRow } from '../../shared/components/permissions/PermissionSettingsRow';
import { PermissionConfirmPopup } from '../../shared/components/permissions/PermissionConfirmPopup';
import { usePermissionsStore } from '../../modules/permissions/store/usePermissionsStore';
import type { PermissionKind } from '../../modules/permissions/types';
import { registerPushTokenIfGranted } from '../../modules/notifications/push';
import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseAuth';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { deleteMe } from '../../modules/user/user';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';
import { LegalSettingsRow } from '../../shared/components/legal/LegalSettingsRow';
import { openLegalDocument } from '../routes/openLegalDocument';
import {
  LEGAL_PRIVACY_TITLE,
  LEGAL_PRIVACY_URL,
  LEGAL_TERMS_TITLE,
  LEGAL_TERMS_URL,
} from '../../shared/config/legal';

export const SettingsScreen = () => {
  const colors = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const themeSectionPaddingY = Math.max(12, Math.min(28, Math.round(windowHeight * 0.022)));
  const { themeMode, setThemeMode } = useThemeStore();
  const securityBlockSurface = colors.isDark
    ? colors.backgroundTertiary
    : colors.backgroundSecondary;
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
  const [activePermissionPrompt, setActivePermissionPrompt] =
    useState<PermissionKind | null>(null);

  const locationStatus = usePermissionsStore((s) => s.locationStatus);
  const cameraStatus = usePermissionsStore((s) => s.cameraStatus);
  const notificationStatus = usePermissionsStore((s) => s.notificationStatus);
  const isCheckingLocation = usePermissionsStore((s) => s.isCheckingLocation);
  const isCheckingCamera = usePermissionsStore((s) => s.isCheckingCamera);
  const isCheckingNotifications = usePermissionsStore(
    (s) => s.isCheckingNotifications,
  );
  const refreshLocationPermission = usePermissionsStore(
    (s) => s.refreshLocationPermission,
  );
  const refreshCameraPermission = usePermissionsStore(
    (s) => s.refreshCameraPermission,
  );
  const refreshNotificationPermission = usePermissionsStore(
    (s) => s.refreshNotificationPermission,
  );
  const requestLocationPermission = usePermissionsStore(
    (s) => s.requestLocationPermission,
  );
  const requestCameraPermission = usePermissionsStore(
    (s) => s.requestCameraPermission,
  );
  const requestNotificationPermission = usePermissionsStore(
    (s) => s.requestNotificationPermission,
  );

  const permissionPromptConfig = useMemo(() => {
    switch (activePermissionPrompt) {
      case 'location':
        return {
          status: locationStatus,
          disclaimerTitle: 'Ubicación',
          title: 'Activar ubicación',
          message:
            'Permite el acceso a tu ubicación para centrar el mapa y ver estaciones cercanas.',
          requestButtonText: 'Permitir ubicación',
        };
      case 'camera':
        return {
          status: cameraStatus,
          disclaimerTitle: 'Cámara',
          title: 'Activar cámara',
          message:
            'Permite el acceso a la cámara para escanear códigos QR en las estaciones.',
          requestButtonText: 'Permitir cámara',
        };
      case 'notifications':
        return {
          status: notificationStatus,
          disclaimerTitle: 'Notificaciones',
          title: 'Activar notificaciones',
          message:
            'Recibe avisos sobre tus reservas y recordatorios de carga.',
          requestButtonText: 'Activar notificaciones',
        };
      default:
        return null;
    }
  }, [
    activePermissionPrompt,
    cameraStatus,
    locationStatus,
    notificationStatus,
  ]);

  const handlePermissionRowPress = useCallback(
    (kind: PermissionKind) => {
      const status =
        kind === 'location'
          ? locationStatus
          : kind === 'camera'
            ? cameraStatus
            : notificationStatus;
      if (status === 'granted' || status === 'blocked') {
        void Linking.openSettings();
        return;
      }
      setActivePermissionPrompt(kind);
    },
    [cameraStatus, locationStatus, notificationStatus],
  );

  const handlePermissionRequest = useCallback(async () => {
    if (!activePermissionPrompt) return;
    let state;
    if (activePermissionPrompt === 'location') {
      state = await requestLocationPermission();
    } else if (activePermissionPrompt === 'camera') {
      state = await requestCameraPermission();
    } else {
      state = await requestNotificationPermission();
    }
    if (state === 'granted') {
      setActivePermissionPrompt(null);
      if (activePermissionPrompt === 'notifications') {
        await registerPushTokenIfGranted();
      }
    }
  }, [
    activePermissionPrompt,
    requestCameraPermission,
    requestLocationPermission,
    requestNotificationPermission,
  ]);

  const handlePermissionRefresh = useCallback(async () => {
    if (!activePermissionPrompt) return;
    if (activePermissionPrompt === 'location') {
      await refreshLocationPermission();
    } else if (activePermissionPrompt === 'camera') {
      await refreshCameraPermission();
    } else {
      await refreshNotificationPermission();
    }
    const store = usePermissionsStore.getState();
    const state =
      activePermissionPrompt === 'location'
        ? store.locationStatus
        : activePermissionPrompt === 'camera'
          ? store.cameraStatus
          : store.notificationStatus;
    if (state === 'granted') {
      setActivePermissionPrompt(null);
      if (activePermissionPrompt === 'notifications') {
        await registerPushTokenIfGranted();
      }
    }
  }, [
    activePermissionPrompt,
    refreshCameraPermission,
    refreshLocationPermission,
    refreshNotificationPermission,
  ]);

  const handleThemeChange = (mode: ThemeMode) => setThemeMode(mode);

  const appVersionLabel = useMemo(() => {
    const version = Application.nativeApplicationVersion ?? '—';
    const rawBuild = Application.nativeBuildVersion;
    const buildNumber = rawBuild != null ? Number(rawBuild) : NaN;
    const build = Number.isFinite(buildNumber)
      ? String(buildNumber + 100)
      : rawBuild;
    return build && build !== version
      ? `Versión ${version} (${build})`
      : `Versión ${version}`;
  }, []);

  const ThemeButton = ({ mode, label }: { mode: ThemeMode; label: string }) => {
    const selected = themeMode === mode;
    return (
      <ButtonPrimary
        title={label}
        onPress={() => handleThemeChange(mode)}
        style={[styles.themeButton, !selected && styles.themeButtonUnselected]}
      />
    );
  };

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
        <SectionLabel
          label="Tema"
          bleedHorizontal={20}
          style={styles.firstSectionLabel}
        />
        <View style={[styles.themeSection, { paddingVertical: themeSectionPaddingY }]}>
          <View style={styles.buttonContainer}>
            <ThemeButton mode="light" label="Claro" />
            <ThemeButton mode="dark" label="Oscuro" />
            <ThemeButton mode="system" label="Sistema" />
          </View>
        </View>

        <SectionLabel label="Permisos" bleedHorizontal={20} />
        <Layout style={styles.section}>
          <PermissionSettingsRow
            title="Ubicación"
            status={locationStatus}
            isChecking={isCheckingLocation}
            onPress={() => handlePermissionRowPress('location')}
            onRefresh={() => void refreshLocationPermission()}
          />
          <PermissionSettingsRow
            title="Cámara"
            status={cameraStatus}
            isChecking={isCheckingCamera}
            onPress={() => handlePermissionRowPress('camera')}
            onRefresh={() => void refreshCameraPermission()}
          />
          <PermissionSettingsRow
            title="Notificaciones"
            status={notificationStatus}
            isChecking={isCheckingNotifications}
            onPress={() => handlePermissionRowPress('notifications')}
            onRefresh={() => void refreshNotificationPermission()}
          />
        </Layout>

        <SectionLabel label="Legal" bleedHorizontal={20} />
        <Layout style={styles.section}>
          <LegalSettingsRow
            title={LEGAL_TERMS_TITLE}
            onPress={() =>
              openLegalDocument(LEGAL_TERMS_URL, LEGAL_TERMS_TITLE)
            }
          />
          <LegalSettingsRow
            title={LEGAL_PRIVACY_TITLE}
            onPress={() =>
              openLegalDocument(LEGAL_PRIVACY_URL, LEGAL_PRIVACY_TITLE)
            }
          />
        </Layout>

        <SectionLabel label="Seguridad" bleedHorizontal={20} />
        <Layout style={styles.section}>
          <Layout
            level="2"
            style={[
              styles.securityBlock,
              {
                borderColor: colors.border,
                backgroundColor: securityBlockSurface,
              },
            ]}
          >
            <Text
              category="s2"
              style={[styles.securityBlockTitle, { color: colors.text }]}
            >
              Recuperar contraseña
            </Text>
            <Text
              category="p2"
              style={[styles.securityBlockBody, { color: colors.textSecondary }]}
            >
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
            <ButtonPrimary
              title={
                resetSending
                  ? 'Enviando…'
                  : cooldownSec > 0
                    ? `Reenviar en ${cooldownSec}s`
                    : 'Enviar correo'
              }
              onPress={() => void handleRequestPasswordReset()}
              disabled={resetSending || cooldownSec > 0}
            />
          </Layout>

          <Layout
            level="2"
            style={[
              styles.securityBlock,
              styles.dangerBlock,
              {
                borderColor: colors.border,
                backgroundColor: securityBlockSurface,
              },
            ]}
          >
            <Text
              category="s2"
              style={[styles.securityBlockTitle, { color: colors.text }]}
            >
              Eliminar cuenta
            </Text>
            <Text
              category="p2"
              style={[styles.securityBlockBody, { color: colors.textSecondary }]}
            >
              Esta acción es irreversible. Tu cuenta será desactivada y ya no podrás
              iniciar sesión.
            </Text>
            <ButtonTransparent
              title="Eliminar mi cuenta"
              color={colors.danger}
              onPress={() => setDeleteOpen(true)}
            />
          </Layout>
        </Layout>

        <Text
          category="c1"
          appearance="hint"
          style={[styles.versionLabel, { color: colors.textSecondary }]}
        >
          {appVersionLabel}
        </Text>
      </ScrollView>

      {permissionPromptConfig ? (
        <PermissionConfirmPopup
          visible={activePermissionPrompt != null}
          status={permissionPromptConfig.status}
          disclaimerTitle={permissionPromptConfig.disclaimerTitle}
          title={permissionPromptConfig.title}
          message={permissionPromptConfig.message}
          requestButtonText={permissionPromptConfig.requestButtonText}
          onRequest={handlePermissionRequest}
          onRefresh={handlePermissionRefresh}
          onClose={() => setActivePermissionPrompt(null)}
        />
      ) : null}

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
        <Text category="p2" style={[styles.deleteBody, { color: colors.textSecondary }]}>
          Confirma que deseas eliminar tu cuenta. Esto borrará tu usuario en Firebase y
          desactivará tu cuenta en el servidor (sin perder tus cargas históricas).
        </Text>
        {hasPasswordProvider ? (
          <Input
            label="Contraseña"
            placeholder="••••••••••••••••"
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
  contentContainer: {
    padding: 20,
    paddingTop: 8,
  },
  firstSectionLabel: { marginTop: 0 },
  themeSection: {
    alignItems: 'center',
  },
  section: { marginBottom: 24 },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  themeButton: { minWidth: 100 },
  themeButtonUnselected: { opacity: 0.45 },
  securityBlock: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
  versionLabel: {
    marginTop: 24,
    textAlign: 'center',
  },
});
