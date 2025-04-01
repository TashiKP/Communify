import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import NavBarComponent from '../components/Symbols'; 

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CustomPage: undefined;
  NavBarPage: undefined; 
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
    </Stack.Navigator>
  );
}