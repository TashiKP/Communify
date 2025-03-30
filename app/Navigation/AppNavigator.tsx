import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import NavBarComponent from '../components/Symbols';  // Import NavBarComponent

// Define the type for your navigation stack
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CustomPage: undefined;
  NavBarPage: undefined;  // Add a new screen for NavBarComponent
};

const Stack = createNativeStackNavigator<RootStackParamList>();  // Type the navigator

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }} // Hide the header for LoginScreen
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }} // Hide the default header
      />
      <Stack.Screen
        name="CustomPage"
        component={(props: NativeStackScreenProps<RootStackParamList, 'CustomPage'>) => <CustomPageComponent {...props} onBackPress={() => props.navigation.goBack()} />}
        options={{ headerShown: false }} // Hide header if not needed
      />
      <Stack.Screen
        name="NavBarPage"  // Define the NavBarPage
        component={NavBarComponent}
        options={{ headerShown: false }}  // Hide header if not needed
      />
    </Stack.Navigator>
  );
}