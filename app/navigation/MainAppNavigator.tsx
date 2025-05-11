// src/navigation/MainAppNavigator.tsx 
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

export type MainAppStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<MainAppStackParamList>();

export default function MainAppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}