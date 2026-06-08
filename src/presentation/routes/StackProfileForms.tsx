import { createStackNavigator } from '@react-navigation/stack';
import type { ProfileFormStackParams } from './navigationParams';
import { EditProfileScreen } from '../screens/user/profile/EditProfileScreen';

const Stack = createStackNavigator<ProfileFormStackParams>();

/** Edición de perfil (anidado en `StackProfile`). */
export const StackProfileForms = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Editar perfil" component={EditProfileScreen} />
  </Stack.Navigator>
);
