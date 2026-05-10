import {
  createStackNavigator,
  StackCardStyleInterpolator,
} from '@react-navigation/stack';
import { CarStackParams } from './navigationParams';
import { CarsScreen } from '../screens/user/car/CarsScreen';
import { CreateCarScreen } from '../screens/user/car/CreateCarScreen';
import { RequestVehicleScreen } from '../screens/user/car/RequestVehicleScreen';

const Stack = createStackNavigator<CarStackParams>();

export const StackCar = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Mis autos" component={CarsScreen} />
      <Stack.Screen name="Crear auto" component={CreateCarScreen} />
      <Stack.Screen
        name="Solicitar vehículo"
        component={RequestVehicleScreen}
      />
    </Stack.Navigator>
  );
};
