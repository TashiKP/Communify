// src/App.tsx
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Platform, View, ActivityIndicator } from 'react-native'; // Added View, ActivityIndicator
import { NavigationContainer } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

// Import Context Providers
import { GridProvider } from './context/GridContext';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext'; 
import AppNavigator from './Navigation/AppNavigator'; // Adjust path if necessary

// --- Component to Apply Theme and Overlay ---
const ThemedAppContent: React.FC = () => {
    const { theme, isLoadingAppearance, brightnessOverlayOpacity, statusBarStyle } = useAppearance();

    // Show loading indicator while appearance settings are being loaded
    if (isLoadingAppearance) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0077b6" /> {/* Use a default color or theme primary if available early */}
            </View>
        );
    }

    // Render the main app content with theme and overlay
    return (
        <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor={theme.primary} // Set status bar background (Android)
            />
            {/* NavigationContainer handles navigation state */}
            <NavigationContainer>
                {/* AppNavigator contains your screens */}
                <AppNavigator />
            </NavigationContainer>

            {/* Brightness Overlay - Renders on top if opacity > 0 */}
            {brightnessOverlayOpacity > 0 && (
                <View
                    style={[
                        styles.brightnessOverlay,
                        { backgroundColor: `rgba(0, 0, 0, ${brightnessOverlayOpacity})` }
                    ]}
                    pointerEvents="none" // Allow touches to pass through
                />
            )}
        </View>
    );
};


// --- Main App Component ---
export default function App() {
  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
        Orientation.unlockAllOrientations();
    };
  }, []);

  return (
    // Wrap with Context Providers
    <GridProvider>
        <AppearanceProvider>
            <SafeAreaView style={styles.safeAreaContainer}>
                 <ThemedAppContent />
            </SafeAreaView>
        </AppearanceProvider>
    </GridProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Default light background
  },
  appContainer: {
    flex: 1, // Ensure it fills the SafeAreaView
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa', // Or a default loading background
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
  },
});