// App.tsx - TEST 1 (FAILED): useAppearance() and theme.background

import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, /* StatusBar, */ View, ActivityIndicator, Text } from 'react-native'; // StatusBar still commented
import { NavigationContainer } from '@react-navigation/native';
// import Orientation from 'react-native-orientation-locker'; // Still commented

import { GridProvider } from './context/GridContext';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext'; // RE-IMPORT useAppearance
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthNavigator from './navigation/AuthNavigator';
import MainAppNavigator from './navigation/MainAppNavigator';

const ThemedAppContent: React.FC = () => {
    // UNCOMMENT useAppearance and use theme, isLoadingAppearance
    const { theme, isLoadingAppearance /*, brightnessOverlayOpacity, statusBarStyle */ } = useAppearance();

    console.log('[ThemedAppContent] TEST 1: useAppearance. isLoadingAppearance:', isLoadingAppearance);

    // ADD BACK loading check for appearance
    if (isLoadingAppearance) {
        console.log('[ThemedAppContent] TEST 1: Appearance is loading.');
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0077b6" />
            </View>
        );
    }

    // ADD BACK theme check
    if (!theme) {
        console.warn('[ThemedAppContent] TEST 1: Theme not ready. Fallback loading.');
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0077b6" />
            </View>
        );
    }

    // Use theme for background, but keep StatusBar and Overlay commented for now
    return (
        <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
            {/* StatusBar component fully commented out */}
            <MainAppNavigator />
            {/* Brightness overlay fully commented out */}
        </View>
    );
};

const AppNavigationDecider: React.FC = () => {
    const { userToken, isLoading: isAuthLoading } = useAuth();

    console.log(
        '[AppNavigationDecider] Evaluating: isAuthLoading:', isAuthLoading,
        'userToken:', userToken ? `"${userToken.substring(0,10)}..."` : 'null'
    );

    if (isAuthLoading) {
        console.log('[AppNavigationDecider] Auth is loading. Rendering loading indicator.');
        return (
            <View key="auth-loading-screen" style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0077b6" />
            </View>
        );
    }

    if (userToken) {
        console.log('[AppNavigationDecider] User token exists. Rendering ThemedAppContent (TEST 1).');
        return <ThemedAppContent key="main-app-content-test1" />; // Update key for clarity
    } else {
        console.log('[AppNavigationDecider] No user token. Rendering AuthNavigator.');
        return <AuthNavigator key="auth-navigator" />;
    }
};

export default function App() {
    // useEffect(() => { // Still commented
    //     // Orientation.lockToLandscape();
    //     // return () => {
    //     //     Orientation.unlockAllOrientations();
    //     // };
    // }, []);

    console.log('[App] Component rendering/mounting.');

    return (
        <AuthProvider>
            <AppearanceProvider> {/* Culprit is likely in here or useAppearance */}
                <GridProvider>
                    <LanguageProvider>
                        <SafeAreaView style={styles.safeAreaContainer}>
                            <NavigationContainer>
                                <AppNavigationDecider />
                            </NavigationContainer>
                        </SafeAreaView>
                    </LanguageProvider>
                </GridProvider>
            </AppearanceProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    appContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    brightnessOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
});