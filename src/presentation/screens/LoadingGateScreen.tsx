import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
import type { RootStackParams } from '../routes/navigationParams';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';
import {
  bootstrapActiveSession,
  waitForActiveSessionStoreHydration,
} from '../../modules/session/sessionBootstrap';
import {
  isRestorableActiveSession,
  navigateForRestoreResult,
} from '../../modules/session/sessionRestoreUtils';
import { useActiveSessionStore } from '../../modules/session/store/useActiveSessionStore';
import { LoadingScreen } from './LoadingScreen';

type Nav = StackNavigationProp<RootStackParams, 'Loading'>;

export const LoadingGateScreen = () => {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, apiStatus, checkAuthStatus } = useAuthStore();
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const bootstrapStartedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated !== 'checking') return;

    let cancelled = false;
    const run = async () => {
      try {
        await checkAuthStatus();
      } catch {
        if (!cancelled) useAuthStore.getState().logout();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated === 'checking') return;

    if (isAuthenticated !== 'authenticated') {
      navigation.replace('Auth');
      return;
    }

    if (apiStatus === 'unreachable') {
      navigation.replace('Offline');
      return;
    }
    if (apiStatus === 'error') {
      navigation.replace('BackendError');
      return;
    }
    if (apiStatus !== 'reachable') return;
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    let cancelled = false;
    const run = async () => {
      await waitForActiveSessionStoreHydration();
      const cached = useActiveSessionStore.getState().activeSession;
      if (isRestorableActiveSession(cached)) {
        setLoadingMessage('Retomando tu sesión…');
      }
      const res = await bootstrapActiveSession();
      if (cancelled) return;
      navigateForRestoreResult(res);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, apiStatus, navigation]);

  return <LoadingScreen message={loadingMessage} />;
};
