// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen'; 
import SignupScreen from '../Screens/Signup'; 
import SigninTwo from '../Screens/SigninTwo';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Signup: undefined;
  SigninTwo: { email?: string };
  SetPasscode: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      /> 
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SigninTwo"
        component={SigninTwo}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}