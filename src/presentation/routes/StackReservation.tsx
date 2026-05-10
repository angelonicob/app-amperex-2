import { createStackNavigator } from '@react-navigation/stack';
import { ReservaStackParams } from './navigationParams';
import { MyReservasScreen } from '../screens/reservation/MyReservasScreen';
import { CreateReservationScreen } from '../screens/reservation/CreateReservationScreen';
import { EditReservaScreen } from '../screens/reservation/EditReservaScreen';

const Stack = createStackNavigator<ReservaStackParams>();

export const StackReservation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Mis reservas" component={MyReservasScreen} />
      <Stack.Screen name="Crear reserva" component={CreateReservationScreen} />
      <Stack.Screen name="Editar reserva" component={EditReservaScreen} />
    </Stack.Navigator>
  );
};
