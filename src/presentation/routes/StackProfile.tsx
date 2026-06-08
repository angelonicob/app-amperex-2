import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParams } from './navigationParams';
import { ProfileScreen } from '../screens/user/profile/ProfileScreen';
import { StackProfileForms } from './StackProfileForms';

const Stack = createStackNavigator<ProfileStackParams>();

export const StackProfile = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Formularios" component={StackProfileForms} />
  </Stack.Navigator>
);
