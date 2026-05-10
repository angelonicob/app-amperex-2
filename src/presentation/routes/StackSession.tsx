import { createStackNavigator } from '@react-navigation/stack';
import { SessionStackParams } from './navigationParams';
import { PaymentScreen } from '../screens/session/PaymentScreen';
import { SessionChargeScreen } from '../screens/session/SessionChargeScreen';
import { StartSessionScreen } from '../screens/session/StartSessionScreen';

const Stack = createStackNavigator<SessionStackParams>();

export const StackSession = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Parámetros" component={StartSessionScreen} />
      <Stack.Screen name="Sesión" component={SessionChargeScreen} />
      <Stack.Screen name="Pago" component={PaymentScreen} />
    </Stack.Navigator>
  );
};
