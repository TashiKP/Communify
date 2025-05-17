import 'react-native-url-polyfill/auto';
import React, { useEffect, useState, useMemo } from 'react';
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
import { createStackNavigator } from '@react-navigation/stack';
import Orientation from 'react-native-orientation-locker';
import * as Sentry from '@sentry/react-native';

// --- Import Constants ---
import {
  LOADER_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  ERROR_FALLBACK_TEXT_COLOR,
  ERROR_FALLBACK_MESSAGE_COLOR,
  ERROR_DETAILS_COLOR,
} from './constants/colors';
import { TestIDs } from './constants/testIDs';

// Contexts
import { GridProvider } from './context/GridContext';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Navigators
import AuthNavigator from './navigation/AuthNavigator';
import MainAppNavigator from './navigation/MainAppNavigator';

// --- Error Boundary ---
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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

// --- Transition Screen ---
const TransitionScreen: React.FC = () => {
  const { signOut, isLoading: isAuthLoading } = useAuth();
  const { theme } = useAppearance();
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const performLogout = async () => {
      try {
        await signOut();
        if (isMounted) {
          // Wait for cleanup
          await new Promise(resolve => setTimeout(resolve, 200));
          setIsTransitioning(false);
        }
      } catch (error) {
        console.error('[TransitionScreen] Logout failed:', error);
        setIsTransitioning(false);
      }
    };

    performLogout();

    return () => {
      isMounted = false;
      console.log('[TransitionScreen] Unmounted');
    };
  }, [signOut]);

  if (isTransitioning || isAuthLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={LOADER_COLOR} />
        <Text style={[styles.text, { color: theme.text }]}>Logging out...</Text>
      </View>
    );
  }

  return null; // Transition complete, navigator will switch
};

// --- Themed Content ---
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

// --- Root Navigator ---
const RootStack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { userToken, isLoading: isAuthLoading } = useAuth();
  const { theme, isLoadingAppearance } = useAppearance();

  const navigationTheme = useMemo(() => {
    return theme.isDark ? DarkTheme : DefaultTheme;
  }, [theme]);

  if (isAuthLoading || isLoadingAppearance) {
    return (
      <View style={styles.loadingContainer} testID={TestIDs.APP_LOADING_INDICATOR}>
        <ActivityIndicator size="large" color={LOADER_COLOR} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <RootStack.Screen name="MainApp" component={ThemedAppContent} />
        ) : userToken === null ? ( // Check for null instead of false
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Transition" component={TransitionScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
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
    <AppErrorBoundary>
      <AuthProvider>
        <AppearanceProvider>
          <GridProvider>
            <LanguageProvider>
              <SafeAreaView style={styles.safeAreaContainer}>
                <AppNavigator />
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
  text: {
    marginTop: 20,
  },
});