import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParams } from '../routes/navigationParams';
import { PropsWithChildren, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParams>>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const apiStatus = useAuthStore((s) => s.apiStatus);
  const retryApiBootstrap = useAuthStore((s) => s.retryApiBootstrap);
  const navigationKeyRef = useRef('');
  const isInitialMount = useRef(true);
  const netPrevOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false;

      if (netPrevOnlineRef.current === null) {
        netPrevOnlineRef.current = online;
        return;
      }

      if (netPrevOnlineRef.current === false && online) {
        const { isAuthenticated: authed, apiStatus: api } =
          useAuthStore.getState();
        if (
          authed === 'authenticated' &&
          (api === 'unreachable' || api === 'error')
        ) {
          void retryApiBootstrap();
        }
      }
      netPrevOnlineRef.current = online;
    });
    return () => unsub();
  }, [retryApiBootstrap]);

  useEffect(() => {
    if (isAuthenticated === 'checking') return;

    const key = `${isAuthenticated}:${apiStatus}`;
    if (
      !isInitialMount.current &&
      navigationKeyRef.current === key
    ) {
      return;
    }

    isInitialMount.current = false;
    navigationKeyRef.current = key;

    try {
      if (isAuthenticated === 'unauthenticated') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          }),
        );
        return;
      }

      if (isAuthenticated === 'authenticated') {
        if (apiStatus === 'reachable') {
          const navState = navigation.getState();
          const idx = navState?.index ?? 0;
          const route = navState?.routes?.[idx];
          if (route?.name === 'Session' || route?.name === 'Loading') {
            return;
          }
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'App' }],
            }),
          );
        } else if (apiStatus === 'unreachable') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Offline' }],
            }),
          );
        } else if (apiStatus === 'error') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'BackendError' }],
            }),
          );
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [isAuthenticated, apiStatus, navigation]);

  return <>{children}</>;
};
