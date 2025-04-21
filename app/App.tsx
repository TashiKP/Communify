// src/App.tsx
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

// Import the context provider and navigator (adjust paths if necessary)
import { GridProvider } from './context/GridContext';
import AppNavigator from './Navigation/AppNavigator';

export default function App() {
  // Lock orientation to landscape on mount 
  useEffect(() => {
    Orientation.lockToLandscape();
    // Optional: Hide status bar in landscape for more screen space
    if (Platform.OS !== 'web') { // react-native-orientation-locker might not work on web
      StatusBar.setHidden(true, 'slide');
    }

    // Unlock on unmount (optional, depends if you want portrait elsewhere)
    return () => {
        Orientation.unlockAllOrientations();
        if (Platform.OS !== 'web') {
            StatusBar.setHidden(false, 'slide');
        }
    };
  }, []);

  return (
    // The GridProvider wraps everything that needs access to the grid layout state
    <GridProvider>
        {/*
          It's generally recommended to have NavigationContainer handle the top-level
          safe area, especially if your navigator has headers that need padding.
          The SafeAreaView here might cause double padding issues depending on your navigator setup.
          Consider removing this outer SafeAreaView if you manage safe areas within AppNavigator or its screens.
        */}
        <SafeAreaView style={styles.container}>
          {/* NavigationContainer is necessary for react-navigation */}
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaView>
    </GridProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color for the safe area padding itself (notch/island areas)
    // You might want this to match your Navbar color or be transparent
    backgroundColor: '#0077b6', // Example: Match Navbar color
  },
});