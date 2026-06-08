import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { EmptyStateLayout } from '../../../shared/components/layout/EmptyStateLayout';

/**
 * Punto de aterrizaje del deep link `amperex://password-reset/success`.
 * Se invoca cuando el usuario completa el reset de contraseña iniciado desde la app
 * (Firebase → puente HTTPS del panel → app). Reinicia la pila al login para que vuelva
 * a entrar con la nueva contraseña.
 */
export const PasswordResetSuccessScreen = () => {
  const navigation = useNavigation();

  const handleGoToSignIn = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      }),
    );
  }, [navigation]);

  return (
    <EmptyStateLayout
      fullScreen
      icon={{ name: 'circle-check', size: 80, iconStyle: 'solid' }}
      title="Contraseña actualizada"
      subtitle="Tu contraseña se restableció correctamente. Ya puedes iniciar sesión con la nueva contraseña."
      action={{
        label: 'Ir al inicio de sesión',
        onPress: handleGoToSignIn,
      }}
    />
  );
};
