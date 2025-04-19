import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack'; // Keep this for screen props if needed
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import NavBarComponent from '../components/Symbols'; // Assuming this is a screen component
import SignupScreen from '../Screens/Signup';
import SigninTwo from '../Screens/SigninTwo';

// --- Root Stack Parameter List Definition ---
// It's generally better practice to define this in a central types file (e.g., src/navigation/types.ts)
// and import it here and in your screens. But defining it here works too.
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CustomPage: undefined; // Assuming CustomPageComponent might be navigated to directly sometimes
  NavBarPage: undefined; // Assuming NavBarComponent might be a screen
  Signup: undefined;
  // *** Define parameters for SigninTwo ***
  SigninTwo: { email?: string }; // SigninTwo receives an optional email string
};

// Create the stack navigator with the defined types
const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Wrapper for CustomPageComponent if needed (if it's not already a screen) ---
// This wrapper correctly receives navigation props and passes them down.
// You only need this if CustomPageComponent itself doesn't use useNavigation directly
// and needs the navigation prop passed explicitly for its 'onBackPress'.
// If CustomPageComponent uses useNavigation, you can potentially use it directly in Stack.Screen.
const CustomPageWrapper: React.FC<
  NativeStackScreenProps<RootStackParamList, 'CustomPage'> // Use the correct screen name
> = ({ navigation }) => {
  // Pass the goBack function as onBackPress
  return (
    <CustomPageComponent onBackPress={() => navigation.goBack()} />
  );
};

// --- App Navigator Component ---
export default function AppNavigator() {
  return (
    // Define initial route - maybe Login? Or Home if handling auth elsewhere?
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
      {/* If CustomPageComponent is mainly shown via Modal inside another screen, */}
      {/* it might not need to be a top-level stack screen. */}
      {/* Only include it here if you intend to navigate to it directly. */}
      {/* <Stack.Screen
        name="CustomPage"
        component={CustomPageWrapper} // Or directly CustomPageComponent if it handles its own back navigation
        options={{ headerShown: false }}
      /> */}

      {/* Assuming NavBarComponent (SymbolGrid) is part of HomeScreen, not a separate screen */}
      {/* <Stack.Screen
        name="NavBarPage"
        component={NavBarComponent}
        options={{ headerShown: false }}
      /> */}

      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SigninTwo" // Ensure component is correctly imported
        component={SigninTwo}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}