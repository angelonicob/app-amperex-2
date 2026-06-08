import { createStackNavigator } from '@react-navigation/stack';
import type { CarFormStackParams } from './navigationParams';
import { CreateCarScreen } from '../screens/user/car/CreateCarScreen';
import { RequestVehicleScreen } from '../screens/user/car/RequestVehicleScreen';
import { ScreenBackHeader } from '../../shared/components/layout/ScreenBackHeader';

const Stack = createStackNavigator<CarFormStackParams>();

/** Flujo crear auto / solicitar vehículo (anidado en `StackCar`). */
export const StackCarForms = () => (
  <Stack.Navigator
    screenOptions={({ navigation, route }) => ({
      headerShown: true,
      header: () => (
        <ScreenBackHeader
          onBack={() => navigation.goBack()}
          title={
            route.name === 'Crear auto'
              ? 'Agregar auto'
              : route.name === 'Solicitar vehículo'
                ? 'Solicitar vehículo'
                : route.name
          }
        />
      ),
    })}
  >
    <Stack.Screen
      name="Crear auto"
      component={CreateCarScreen}
      options={{ title: 'Agregar auto' }}
    />
    <Stack.Screen
      name="Solicitar vehículo"
      component={RequestVehicleScreen}
      options={{ title: 'Solicitar vehículo' }}
    />
  </Stack.Navigator>
);
