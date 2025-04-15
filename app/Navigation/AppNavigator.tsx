import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import NavBarComponent from '../components/Symbols';
import SignupScreen from '../Screens/Signup';
import SigninTwo from '../Screens/SigninTwo'; // Import the SigninTwo screen

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CustomPage: undefined;
  NavBarPage: undefined;
  Signup: undefined;
  SigninTwo: undefined; // Add the SigninTwo route to the param list
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const CustomPageWrapper: React.FC<
  NativeStackScreenProps<RootStackParamList, 'CustomPage'>
> = props => {
  return (
    <CustomPageComponent {...props} onBackPress={() => props.navigation.goBack()} />
  );
};

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
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
        name="CustomPage"
        component={CustomPageWrapper}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NavBarPage"
        component={NavBarComponent}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SigninTwo" // Add the SigninTwo screen to the navigator
        component={SigninTwo}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}