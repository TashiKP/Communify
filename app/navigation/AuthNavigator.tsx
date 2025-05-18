// src/navigation/AuthNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SigninTwo from '../screens/SigninTwo';

export type UserSignupData = {
  fullName: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  email: string;
  password: string;
  avatarUri?: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  SigninTwo: {signupData: UserSignupData};
};
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  console.log('[AuthNavigator] Rendering Auth Stack');
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="SigninTwo"
        component={SigninTwo}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
