import { createStackNavigator } from '@react-navigation/stack';
import { CarStackParams } from './navigationParams';
import { CarsScreen } from '../screens/user/car/CarsScreen';
import { StackCarForms } from './StackCarForms';

const Stack = createStackNavigator<CarStackParams>();

export const StackCar = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Mis autos" component={CarsScreen} />
    <Stack.Screen name="Formularios" component={StackCarForms} />
  </Stack.Navigator>
);
