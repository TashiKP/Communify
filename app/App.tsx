import 'react-native-url-polyfill/auto';
import React, { useEffect, useMemo } from 'react';
import 'react-native-get-random-values';
import {
    SafeAreaView,
    StyleSheet,
    StatusBar,
    View,
    ActivityIndicator,
    Text,
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import * as Sentry from '@sentry/react-native';

// --- Import Constants ---
import {
    LOADER_COLOR,
    DEFAULT_BACKGROUND_COLOR,
    ERROR_FALLBACK_TEXT_COLOR,
    ERROR_FALLBACK_MESSAGE_COLOR,
    ERROR_DETAILS_COLOR,
} from './constants/colors'; // Or import from './constants' if using barrel file fully
import { TestIDs } from './constants/testIDs';

// Contexts
import { GridProvider } from './context/GridContext';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Navigators
import AuthNavigator from './navigation/AuthNavigator';
import MainAppNavigator from './navigation/MainAppNavigator';

// --- Error Boundary (Simple Example) ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    Sentry.captureException(error, {
        extra: {
            componentStack: errorInfo.componentStack,
        },
    });
}

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.errorFallbackContainer}>
          <Text style={styles.errorFallbackText}>Oops! Something went wrong.</Text>
          <Text style={styles.errorFallbackMessage}>
            Please try restarting the application.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetails}>
              {this.state.error.toString()}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

// --- Themed Content (Main App UI after loading) ---
const ThemedAppContent: React.FC = () => {
    const { theme, brightnessOverlayOpacity, statusBarStyle } = useAppearance();

    return (
        <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor={theme.primary}
                translucent={false}
            />
            <MainAppNavigator />
            {brightnessOverlayOpacity > 0 && (
                <View
                    style={[
                        styles.brightnessOverlay,
                        { backgroundColor: `rgba(0, 0, 0, ${brightnessOverlayOpacity})` },
                    ]}
                    pointerEvents="none"
                />
            )}
        </View>
    );
};

// --- Component to Decide Between Loading, Auth, or Main App ---
const AppLoadingOrContent: React.FC = () => {
    const { userToken, isLoading: isAuthLoading } = useAuth();
    const { isLoadingAppearance, theme } = useAppearance();

    const isAppLoading = isAuthLoading || isLoadingAppearance;

    const navigationTheme = useMemo(() => {
        if (!theme) {
            return DefaultTheme;
        }
        return theme.isDark ? DarkTheme : DefaultTheme;
        // More detailed theme mapping:
        // return {
        //   ...(theme.isDark ? DarkTheme : DefaultTheme),
        //   colors: {
        //     ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
        //     background: theme.background,
        //     card: theme.card,
        //     text: theme.text,
        //     primary: theme.primary,
        //     border: theme.border,
        //   },
        // };
    }, [theme]);

    if (isAppLoading) {
        return (
            <View style={styles.loadingContainer} testID={TestIDs.APP_LOADING_INDICATOR}>
                <ActivityIndicator size="large" color={LOADER_COLOR} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={navigationTheme}>
            {userToken ? <ThemedAppContent /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

// --- Main App Component ---
export default function App() {
    useEffect(() => {
        Orientation.lockToLandscape();
        // return () => {
        //     Orientation.unlockAllOrientations();
        // };
    }, []);

    // Sentry.init({ dsn: "YOUR_SENTRY_DSN" });

    return (
        <AppErrorBoundary>
            <AuthProvider>
                <AppearanceProvider>
                    <GridProvider>
                        <LanguageProvider>
                            <SafeAreaView style={styles.safeAreaContainer}>
                                <AppLoadingOrContent />
                            </SafeAreaView>
                        </LanguageProvider>
                    </GridProvider>
                </AppearanceProvider>
            </AuthProvider>
        </AppErrorBoundary>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
    },
    appContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
    },
    brightnessOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    errorFallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
    },
    errorFallbackText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: ERROR_FALLBACK_TEXT_COLOR,
    },
    errorFallbackMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: ERROR_FALLBACK_MESSAGE_COLOR,
    },
    errorDetails: {
        fontSize: 12,
        textAlign: 'center',
        color: ERROR_DETAILS_COLOR,
        marginTop: 10,
    },
});