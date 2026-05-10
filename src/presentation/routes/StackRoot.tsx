import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParams } from './navigationParams';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { LoadingGateScreen } from '../screens/LoadingGateScreen';
import { OfflineScreen } from '../screens/offline/OfflineScreen';
import { BackendErrorScreen } from '../screens/offline/BackendErrorScreen';
import { DrawerHome } from './DrawerHome';
import { StackSession } from './StackSession';

const Stack = createStackNavigator<RootStackParams>();

export const StackRoot = () => {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="App" component={DrawerHome} />
      <Stack.Screen name="Loading" component={LoadingGateScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Offline" component={OfflineScreen} />
      <Stack.Screen name="BackendError" component={BackendErrorScreen} />
      <Stack.Screen name="Session" component={StackSession} />
    </Stack.Navigator>
  );
};
