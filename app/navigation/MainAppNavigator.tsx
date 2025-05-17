// src/navigation/MainAppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoggingOutScreen from '../screens/LoggingOutScreen'; // Import the new screen

export type MainAppStackParamList = {
  Home: undefined;
  LoggingOut: undefined; // Add LoggingOut screen
};

const Stack = createNativeStackNavigator<MainAppStackParamList>();

export default function MainAppNavigator() {
  console.log('[MainAppNavigator] Rendering Main App Stack');
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Keep header hidden for all screens in this stack
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="LoggingOut" // Name used to navigate to this screen
        component={LoggingOutScreen}
      />
    </Stack.Navigator>
  );
}