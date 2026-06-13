import { Layout, Text, useTheme } from '@ui-kitten/components';
import { Image as ExpoImage } from 'expo-image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ImageBackground,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ButtonPrimary,
  ButtonFrosted,
  ButtonTransparent,
} from '../../../shared/components/ui/button';
import { LabelWarning } from '../../../shared/components/ui/card';
import {
  FORM_FIELD_CONTAINER_PADDING_H,
  FormInput,
  FormPasswordInput,
} from '../../../shared/components/ui/form';
import { useAuthStore } from '../../../modules/auth/store/userAuthStore';
import { api } from '../../../infrastructure/http/Api';
import { isAxiosError } from 'axios';
import { TermsAcceptanceRow } from '../../../shared/components/legal/TermsAcceptanceRow';

const PANEL_TIMING_MS = 260;

/** Debe coincidir con la validación del backend (p. ej. IsLength 8). */
const MIN_PASSWORD_LENGTH = 8;

/** Con el panel colapsado: fracción del alto útil (bajo status bar) que ocupa el formulario. El resto es hero. */
const COLLAPSED_FORM_VISIBLE_RATIO = 0.7;

type AuthMode = 'signin' | 'register';
type SheetPhase = 'form' | 'forgotPassword';
type ForgotStep = 'email' | 'success';

const FORGOT_SLIDE_MS = 320;

const AnimatedLayout = Animated.createAnimatedComponent(Layout);

export const AuthScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [sheetPhase, setSheetPhase] = useState<SheetPhase>('form');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { completeEmailPasswordLogin } = useAuthStore();

  const isExpandedRef = useRef(false);
  const passwordInputRef = useRef<TextInput | null>(null);
  const firstNameInputRef = useRef<TextInput | null>(null);
  const lastNameInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    setWarningMessage(null);
  }, [email, password, firstName, lastName, authMode, sheetPhase]);

  useEffect(() => {
    if (authMode === 'signin') {
      setTermsAccepted(false);
    }
  }, [authMode]);

  const usableHeight = Math.max(0, windowHeight - insets.top);
  const collapsedTranslateY =
    usableHeight * (1 - COLLAPSED_FORM_VISIBLE_RATIO);

  const usableH = useSharedValue(usableHeight);
  const panelTranslateY = useSharedValue(collapsedTranslateY);
  const forgotSlideX = useSharedValue(0);

  /** Ancho útil del formulario (padding horizontal 24+24 del scroll). */
  const forgotPanelWidth = Math.max(0, windowWidth - 48);

  useEffect(() => {
    usableH.value = usableHeight;
  }, [usableHeight]);

  useEffect(() => {
    const collapsed =
      usableHeight * (1 - COLLAPSED_FORM_VISIBLE_RATIO);
    const target = isExpandedRef.current ? 0 : collapsed;
    panelTranslateY.value = withTiming(target, { duration: 0 });
  }, [usableHeight]);

  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
  }));

  const forgotSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: forgotSlideX.value }],
  }));

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const uh = usableH.value;
    const t = panelTranslateY.value;
    const maxT = uh * (1 - COLLAPSED_FORM_VISIBLE_RATIO);
    const opacity = maxT > 0 ? t / maxT : 0;
    return { opacity };
  });

  const setPanelExpanded = useCallback(
    (expanded: boolean) => {
      isExpandedRef.current = expanded;
      const collapsed =
        usableHeight * (1 - COLLAPSED_FORM_VISIBLE_RATIO);
      const target = expanded ? 0 : collapsed;
      panelTranslateY.value = withTiming(target, { duration: PANEL_TIMING_MS });
    },
    [usableHeight],
  );

  const expandPanelOnInputFocus = useCallback(() => {
    setPanelExpanded(true);
  }, [setPanelExpanded]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => {
      setPanelExpanded(true);
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleCallbackId: number | undefined;

    const cancelScheduledCollapse = () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      const g = globalThis as typeof globalThis & {
        cancelIdleCallback?: (id: number) => void;
      };
      if (idleCallbackId != null && g.cancelIdleCallback) {
        g.cancelIdleCallback(idleCallbackId);
        idleCallbackId = undefined;
      }
    };

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      cancelScheduledCollapse();
      const collapse = () => {
        setPanelExpanded(false);
      };
      if (Platform.OS === 'android') {
        timeoutId = setTimeout(collapse, 120);
      } else {
        const g = globalThis as typeof globalThis & {
          requestIdleCallback?: (
            cb: () => void,
            opts?: { timeout?: number },
          ) => number;
        };
        if (typeof g.requestIdleCallback === 'function') {
          idleCallbackId = g.requestIdleCallback(collapse, { timeout: 500 });
        } else {
          timeoutId = setTimeout(collapse, 0);
        }
      }
    });

    return () => {
      cancelScheduledCollapse();
      showSub.remove();
      hideSub.remove();
    };
  }, [setPanelExpanded]);

  const onSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setWarningMessage('Introduce correo y contraseña.');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailOk) {
      setWarningMessage('Introduce un correo electrónico válido.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setWarningMessage(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
      return;
    }
    if (authMode === 'register') {
      if (!termsAccepted) {
        setWarningMessage(
          'Debes aceptar la política de privacidad y los términos de uso.',
        );
        return;
      }
      const fn = firstName.trim();
      const ln = lastName.trim();
      if (!fn || !ln) {
        setWarningMessage('Introduce nombre y apellido.');
        return;
      }
    }

    setWarningMessage(null);
    setIsPosting(true);
    const { ok, errorMessage } =
      authMode === 'signin'
        ? await completeEmailPasswordLogin(trimmed, password, 'signin')
        : await completeEmailPasswordLogin(trimmed, password, 'register', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
    setIsPosting(false);
    if (ok) {
      /** Navegación la resuelve `AuthProvider` según `apiStatus` (App u Offline). */
    } else {
      setWarningMessage(errorMessage ?? 'No se pudo completar la operación.');
    }
  }, [
    authMode,
    email,
    password,
    firstName,
    lastName,
    termsAccepted,
    completeEmailPasswordLogin,
  ]);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((m) => (m === 'signin' ? 'register' : 'signin'));
    setSheetPhase('form');
  }, []);

  const openForgotPassword = useCallback(() => {
    setSheetPhase('forgotPassword');
    setForgotStep('email');
    forgotSlideX.value = 0;
    setPanelExpanded(true);
  }, [forgotSlideX, setPanelExpanded]);

  const backToSignInForm = useCallback(() => {
    setSheetPhase('form');
    setForgotStep('email');
    forgotSlideX.value = 0;
    setPanelExpanded(false);
  }, [forgotSlideX, setPanelExpanded]);

  const sendPasswordResetRequest = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setWarningMessage('Introduce tu correo electrónico.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setWarningMessage('Introduce un correo electrónico válido.');
      return;
    }
    setWarningMessage(null);
    setIsSendingReset(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmed });
    } catch (e: unknown) {
      // El endpoint no debe filtrar si el correo existe; la UX siempre muestra éxito.
      // Si hay rate limit, podemos informar sin cambiar el mensaje principal.
      if (isAxiosError(e) && e.response?.status === 429) {
        setWarningMessage(
          'Has alcanzado el límite de envíos. Espera un momento e intenta de nuevo.',
        );
      }
    } finally {
      setForgotStep('success');
      setIsSendingReset(false);
    }
  }, [email]);

  const resendPasswordResetEmail = useCallback(() => {
    void sendPasswordResetRequest();
  }, [sendPasswordResetRequest]);

  useEffect(() => {
    if (sheetPhase !== 'forgotPassword' || forgotPanelWidth <= 0) {
      return;
    }
    forgotSlideX.value = withTiming(
      forgotStep === 'success' ? -forgotPanelWidth : 0,
      { duration: FORGOT_SLIDE_MS },
    );
  }, [forgotPanelWidth, forgotStep, sheetPhase]);

  const formTitle =
    authMode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta';
  const formSubtitle = 'Ingresa tus datos a continuación';
  const registerBlocked = authMode === 'register' && !termsAccepted;
  const primaryLabel =
    isPosting
      ? authMode === 'signin'
        ? 'Iniciando sesión…'
        : 'Registrando…'
      : authMode === 'signin'
        ? 'Iniciar sesión'
        : 'Registrarme';

  return (
    <ImageBackground
      source={require('../../../../assets/images/bg/BK4WEBp.webp')}
      style={styles.outer}
      imageStyle={styles.outerImage}
      resizeMode="cover"
    >
      <View
        style={[
          styles.heroArea,
          {
            top: insets.top,
            height:
              usableHeight * (1 - COLLAPSED_FORM_VISIBLE_RATIO),
          },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[heroAnimatedStyle, styles.heroAnimatedFill]}
          pointerEvents="box-none"
        >
          <View style={styles.hero}>
            <ExpoImage
              source={require('../../../../assets/logo/icon_white.png')}
              style={styles.heroLogo}
              contentFit="contain"
            />

            <Text category="s1" style={styles.heroQuestion}>
              {authMode === 'register'
                ? '¿Ya tienes una cuenta?'
                : '¿Aún no tienes una cuenta?'}
            </Text>
            <ButtonFrosted
              title={
                authMode === 'signin' ? 'Registrarme' : 'Iniciar sesión'
              }
              onPress={toggleAuthMode}
              disabled={sheetPhase === 'forgotPassword'}
            />
          </View>
        </Animated.View>
      </View>

      <AnimatedLayout
        level="1"
        style={[
          styles.formPanel,
          {
            height: usableHeight,
            paddingBottom: insets.bottom,
          },
          panelAnimatedStyle,
        ]}
      >
        <View style={styles.sheetHandleContainer} pointerEvents="none">
          <View
            style={[
              styles.sheetHandle,
              { backgroundColor: theme['border-basic-color-3'] },
            ]}
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScroll}
        >
          {sheetPhase === 'forgotPassword' ? (
            <View style={styles.forgotPasswordSlideOuter}>
              <Animated.View
                style={[
                  styles.forgotPasswordRow,
                  { width: forgotPanelWidth * 2 },
                  forgotSlideAnimatedStyle,
                ]}
              >
                <View
                  style={[
                    styles.forgotPasswordPanel,
                    { width: forgotPanelWidth },
                  ]}
                >
                  <Text category="h3" style={styles.formTitle}>
                    Recuperar cuenta
                  </Text>
                  <Text
                    category="s1"
                    appearance="hint"
                    style={styles.formSubtitle}
                  >
                    Te enviaremos un enlace para restablecer tu contraseña.
                  </Text>
                  <LabelWarning message={warningMessage ?? ''} />
                  <FormInput
                    label="Correo electrónico"
                    placeholder="tu@email.com"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={expandPanelOnInputFocus}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    disabled={isSendingReset}
                  />
                  <ButtonPrimary
                    title={
                      isSendingReset ? 'Enviando…' : 'Enviar instrucciones'
                    }
                    onPress={() => void sendPasswordResetRequest()}
                    disabled={isSendingReset}
                    style={[styles.primaryBtn, styles.primaryBtnAboveLink]}
                  />
                  <ButtonTransparent
                    title="Volver a iniciar sesión"
                    onPress={backToSignInForm}
                    disabled={isSendingReset}
                    style={styles.secondaryLinkWrap}
                  />
                </View>
                <View
                  style={[
                    styles.forgotPasswordPanel,
                    { width: forgotPanelWidth },
                  ]}
                >
                  <Text category="h3" style={styles.formTitle}>
                    Correo enviado
                  </Text>
                  <Text
                    category="s1"
                    appearance="hint"
                    style={styles.forgotSuccessBody}
                  >
                    Si el correo es válido te llegará un mensaje con un enlace
                    para restablecer tu contraseña. No olvides revisar spam.
                  </Text>
                  <LabelWarning message={warningMessage ?? ''} />
                  <ButtonTransparent
                    title={
                      isSendingReset ? 'Enviando…' : 'Volver a enviar correo'
                    }
                    onPress={resendPasswordResetEmail}
                    disabled={isSendingReset}
                  />
                  <ButtonPrimary
                    title="Volver a iniciar sesión"
                    onPress={backToSignInForm}
                    disabled={isSendingReset}
                    style={styles.primaryBtn}
                  />
                </View>
              </Animated.View>
            </View>
          ) : (
            <>
              <Text category="h3" style={styles.formTitle}>
                {formTitle}
              </Text>
              <Text category="s1" appearance="hint" style={styles.formSubtitle}>
                {formSubtitle}
              </Text>
              <LabelWarning message={warningMessage ?? ''} />
              <FormInput
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                onFocus={expandPanelOnInputFocus}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                disabled={isPosting}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              <FormPasswordInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                onFocus={expandPanelOnInputFocus}
                autoComplete="password"
                textContentType="password"
                disabled={isPosting}
                inputRef={passwordInputRef}
                returnKeyType={authMode === 'register' ? 'next' : 'done'}
                blurOnSubmit={authMode !== 'register'}
                onSubmitEditing={() => {
                  if (authMode === 'register') {
                    firstNameInputRef.current?.focus();
                  } else {
                    void onSubmit();
                  }
                }}
              />

              {authMode === 'signin' ? (
                <Pressable
                  onPress={openForgotPassword}
                  style={({ pressed }) => [
                    styles.forgotPasswordWrap,
                    pressed && styles.secondaryLinkPressed,
                  ]}
                  disabled={isPosting}
                >
                  <Text category="c1" style={styles.forgotPasswordText}>
                    Olvidé mi contraseña…
                  </Text>
                </Pressable>
              ) : null}

              {authMode === 'register' ? (
                <>
                  <FormInput
                    label="Nombre"
                    placeholder="Tu nombre"
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={expandPanelOnInputFocus}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    textContentType="givenName"
                    disabled={isPosting}
                    inputRef={firstNameInputRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => lastNameInputRef.current?.focus()}
                  />
                  <FormInput
                    label="Apellido"
                    placeholder="Tu apellido"
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={expandPanelOnInputFocus}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    textContentType="familyName"
                    disabled={isPosting}
                    inputRef={lastNameInputRef}
                    returnKeyType="done"
                    onSubmitEditing={() => void onSubmit()}
                  />
                </>
              ) : null}

              {authMode === 'register' ? (
                <TermsAcceptanceRow
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                  disabled={isPosting}
                />
              ) : null}

              <ButtonPrimary
                title={primaryLabel}
                onPress={() => void onSubmit()}
                disabled={isPosting || registerBlocked}
                style={styles.primaryBtn}
              />
            </>
          )}
        </ScrollView>
      </AnimatedLayout>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  outerImage: {
    width: '100%',
    height: '100%',
  },
  heroArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  heroAnimatedFill: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  heroLogo: {
    width: 80,
    height: 80,
  },
  heroQuestion: {
    color: '#fff',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.95,
  },
  formPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 132,
    height: 5,
    borderRadius: 999,
  },
  formScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  formSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  forgotPasswordSlideOuter: {
    overflow: 'hidden',
    width: '100%',
  },
  forgotPasswordRow: {
    flexDirection: 'row',
  },
  forgotPasswordPanel: {
    flexShrink: 0,
  },
  forgotSuccessBody: {
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },

  /** Separación respecto al campo anterior; el botón ya usa `marginBottom` como `FormInput`. */
  primaryBtn: {
    marginTop: 8,
  },
  primaryBtnAboveLink: {
    marginBottom: 4,
  },
  forgotPasswordWrap: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: -4,
    paddingHorizontal: FORM_FIELD_CONTAINER_PADDING_H,
  },
  forgotPasswordText: {
    color: '#CBD639',
    fontWeight: '700',
  },
  secondaryLinkWrap: {
    alignSelf: 'center',
    marginTop: 4,
  },
  secondaryLinkPressed: {
    opacity: 0.75,
  },
});
