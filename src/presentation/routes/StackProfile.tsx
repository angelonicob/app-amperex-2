import {
  createStackNavigator,
  StackCardStyleInterpolator,
} from '@react-navigation/stack';
import { ProfileStackParams } from './navigationParams';
import { ProfileScreen } from '../screens/user/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/user/profile/EditProfileScreen';

const Stack = createStackNavigator<ProfileStackParams>();

const fadeAnimation: StackCardStyleInterpolator = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export const StackProfile = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: fadeAnimation,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};
