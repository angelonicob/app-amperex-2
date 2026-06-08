import { createStackNavigator } from '@react-navigation/stack';
import { ReservaStackParams } from './navigationParams';
import { MyReservasScreen } from '../screens/reservation/MyReservasScreen';

const Stack = createStackNavigator<ReservaStackParams>();

export const StackReservation = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Mis reservas" component={MyReservasScreen} />
  </Stack.Navigator>
);
