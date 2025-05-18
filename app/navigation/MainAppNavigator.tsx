// src/navigation/MainAppNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoggingOutScreen from '../screens/LoggingOutScreen';

export type MainAppStackParamList = {
  Home: undefined;
  LoggingOut: undefined;
};

const Stack = createNativeStackNavigator<MainAppStackParamList>();

export default function MainAppNavigator() {
  console.log('[MainAppNavigator] Rendering Main App Stack');
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="LoggingOut" component={LoggingOutScreen} />
    </Stack.Navigator>
  );
}
