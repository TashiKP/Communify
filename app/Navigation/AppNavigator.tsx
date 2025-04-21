// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// --- Screen Imports --- (Adjust paths as needed)
import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen'; // <-- UNCOMMENTED
import SignupScreen from '../Screens/Signup'; // <-- UNCOMMENTED
import SigninTwo from '../Screens/SigninTwo'; // <-- UNCOMMENTED
// --- Component Import for potential wrapping --- (Adjust path)
// import CustomPageComponent from '../components/CustomPageComponent'; // Keep commented if not used as direct route

// --- Root Stack Parameter List Definition ---
// Ensure all screens used below are defined here
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  // CustomPage: undefined; // Keep commented if not used as direct route
  Signup: undefined;
  SigninTwo: { email?: string }; // Ensure SigninTwo still defined if used
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Wrapper for CustomPageComponent if needed ---
// Keep commented if CustomPage screen is not used directly in the stack
// const CustomPageWrapper: React.FC<
//   NativeStackScreenProps<RootStackParamList, 'CustomPage'>
// > = ({ navigation }) => {
//   return (
//     <CustomPageComponent onBackPress={() => navigation.goBack()} />
//   );
// };

// --- App Navigator Component ---
export default function AppNavigator() {
  return (
    // Set the initial route, usually Login
    <Stack.Navigator initialRouteName="Login">
      {/* --- Login Screen --- */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }} // Hide the default header
      />
      {/* ------------------ */}

      {/* --- Home Screen --- */}
      <Stack.Screen
        name="Home" // MUST match the name used in navigation.replace() or navigation.navigate()
        component={HomeScreen}
        options={{ headerShown: false }} // Hide the default header
      />
      {/* ------------------ */}

      {/* --- Custom Page Screen (Optional Direct Route) --- */}
      {/* Keep commented out unless you navigate directly to this as a full screen */}
      {/* <Stack.Screen
        name="CustomPage"
        component={CustomPageWrapper} // Or CustomPageComponent if it handles navigation internally
        options={{ headerShown: false }}
      /> */}
      {/* -------------------------------------------------- */}

      {/* --- Signup Screen --- */}
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }} // Hide the default header
      />
      {/* ------------------- */}

      {/* --- SigninTwo Screen --- */}
      <Stack.Screen
        name="SigninTwo"
        component={SigninTwo}
        options={{ headerShown: false }} // Hide the default header
      />
      {/* ---------------------- */}

    </Stack.Navigator>
  );
}