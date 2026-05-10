import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useEffect } from 'react';
import type { RootStackParams } from '../routes/navigationParams';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';
import { LoadingScreen } from './LoadingScreen';

type Nav = StackNavigationProp<RootStackParams, 'Loading'>;

export const LoadingGateScreen = () => {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, apiStatus, checkAuthStatus } = useAuthStore();

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
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated === 'checking') return;
    if (isAuthenticated === 'authenticated') {
      if (apiStatus === 'reachable') navigation.replace('App');
      else if (apiStatus === 'unreachable') navigation.replace('Offline');
      else if (apiStatus === 'error') navigation.replace('BackendError');
    } else {
      navigation.replace('Auth');
    }
  }, [isAuthenticated, apiStatus, navigation]);

  return <LoadingScreen />;
};
