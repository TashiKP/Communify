// src/navigation/AppNavigator.tsx OR wherever your navigator lives
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// --- Screen Imports --- (Adjust paths as needed)
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import SignupScreen from '../Screens/Signup';
import SigninTwo from '../Screens/SigninTwo';
// --- Component Import for potential wrapping --- (Adjust path)
import CustomPageComponent from '../components/CustomPageComponent';

// --- Root Stack Parameter List Definition ---
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CustomPage: undefined; // Only if navigated to directly
  Signup: undefined;
  SigninTwo: { email?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Wrapper for CustomPageComponent if needed ---
const CustomPageWrapper: React.FC<
  NativeStackScreenProps<RootStackParamList, 'CustomPage'>
> = ({ navigation }) => {
  return (
    <CustomPageComponent onBackPress={() => navigation.goBack()} />
  );
};

// --- App Navigator Component ---
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
      {/* Example of including CustomPage if needed as a direct route */}
      {/* <Stack.Screen
        name="CustomPage"
        component={CustomPageWrapper}
        options={{ headerShown: false }}
      /> */}
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