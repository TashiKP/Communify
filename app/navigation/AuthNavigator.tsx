// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen'; // Ensure path is correct
import SignupScreen from '../screens/SignupScreen'; // Ensure path and component name are correct
import SigninTwo from '../screens/SigninTwo';    // Ensure path is correct

// Define the type for the data passed from SignupScreen to SigninTwo
export type UserSignupData = {
  fullName: string;
  age: string; // Kept as string from input, handle conversion later if needed
  gender: 'Male' | 'Female' | 'Other' | ''; // Adjust type if your gender options differ
  email: string;
  password: string; // Password collected on SignupScreen
  avatarUri?: string; // Add optional avatar URI collected on SignupScreen
};

// Define the parameters expected by each screen in the stack
export type AuthStackParamList = {
  Login: undefined; // No parameters expected for Login screen
  Signup: undefined; // No parameters expected for Signup screen
  SigninTwo: { signupData: UserSignupData }; // SigninTwo expects an object with signupData
};

// Create the stack navigator instance
const Stack = createNativeStackNavigator<AuthStackParamList>();

// Define the AuthNavigator component
const AuthNavigator: React.FC = () => {
  console.log('[AuthNavigator] Rendering Auth Stack'); // Log rendering for debugging

  return (
    // Configure the stack navigator
    <Stack.Navigator
      initialRouteName="Login" // Start on the Login screen
      screenOptions={{
        headerShown: false, // Hide the header globally for this stack
      }}
    >
      {/* Define the Login screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        // No specific options needed beyond screenOptions
      />

      {/* Define the Signup screen */}
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        // No specific options needed beyond screenOptions
      />

      {/* Define the SigninTwo screen */}
      <Stack.Screen
        name="SigninTwo" // This is the route name used for navigation
        component={SigninTwo}
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;