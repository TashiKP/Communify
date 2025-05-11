// src/Screens/LoginScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { API_BASE_URL } from '../config/apiConfig'; // Import your API base URL

import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';

// --- Constants for Colors (as provided) ---
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8';
const backgroundColor = '#f0f9ff'; // Assuming this is the intended main background
const whiteColor = '#ffffff';
const textColor = '#343a40';
const placeholderColor = '#adb5bd';
const errorColor = '#dc3545';
const subtleBorderColor = '#e0e0e0';
const inputBackground = '#e6f0fa';
const gradientStart = '#0066a3';
const gradientEnd = '#0099c6';
// --- End Constants ---

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Interface for the expected API token response
interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface FastAPIErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}
interface FastAPIErrorResponse {
  detail: string | FastAPIErrorDetail[];
}


const LoginScreen: React.FC = () => {
  const instanceId = useRef(`LoginScreen-${Math.random().toString(36).substring(7)}`).current;
  console.log(`[${instanceId}] Component instance created.`);

  const { signIn, isLoading: isAuthLoading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    console.log(`[${instanceId}] Mounted.`);
    // Optionally reset form fields if screen might be revisited in a stale state
    // setEmail('');
    // setPassword('');
    // setError(null);
    // setLocalIsLoading(false);

    return () => {
      console.log(`[${instanceId}] Unmounted.`);
    };
  }, [instanceId]);

  const handleLogin = async () => {
    console.log(`[${instanceId}] handleLogin initiated.`);
    Keyboard.dismiss();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLocalIsLoading(true);

    try {
      const endpoint = `${API_BASE_URL}/api/v1/auth/token`;
      console.log(`[${instanceId}] Attempting to login to: ${endpoint}`);

      // For FastAPI's OAuth2PasswordRequestForm, data needs to be form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI's OAuth2PasswordRequestForm expects 'username'
      formData.append('password', password);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.';
        if (responseData && responseData.detail) {
          if (typeof responseData.detail === 'string') {
            errorMessage = responseData.detail;
          } else if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
            // For validation errors, take the first message
            errorMessage = responseData.detail[0].msg || 'Invalid input.';
          }
        }
        console.error(`[${instanceId}] Login API error (${response.status}):`, responseData);
        setError(errorMessage);
        throw new Error(errorMessage); // Propagate to catch block
      }

      const tokenData = responseData as TokenResponse;
      if (tokenData.access_token) {
        console.log(`[${instanceId}] Login successful. Token received.`);
        await signIn(tokenData.access_token);
        // Navigation to the main app stack will be handled by AuthContext listener
      } else {
        console.error(`[${instanceId}] Login error: No access_token in response.`, tokenData);
        setError('Login failed: Invalid response from server.');
      }
    } catch (apiError: any) {
      console.error(`[${instanceId}] Login process error:`, apiError);
      // Set error message if not already set by API response handling
      if (!error) {
        // Check if it's a network error (TypeError often indicates network issues with fetch)
        if (apiError instanceof TypeError && apiError.message.includes('Network request failed')) {
            setError('Network error. Please check your connection and ensure the server is running.');
        } else {
            setError(apiError.message || 'An unexpected error occurred during login.');
        }
      }
    } finally {
      console.log(`[${instanceId}] handleLogin finished.`);
      setLocalIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    if (!combinedIsLoading) {
      console.log(`[${instanceId}] Navigating to Signup.`);
      navigation.navigate('Signup');
    }
  };

  const combinedIsLoading = localIsLoading || isAuthLoading;

  // Only log when it changes or on initial render
  useEffect(() => {
    console.log(`[${instanceId}] combinedIsLoading state: ${combinedIsLoading}`);
  }, [combinedIsLoading, instanceId]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.outerContainer}>
            <View style={styles.container}>
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.leftContainer}
              >
                <Text style={styles.communifyText}>Communify</Text>
                <Text style={styles.sloganTextSimplified}>Connect, Share, Inspire</Text>
              </LinearGradient>

              <View style={styles.rightContainer}>
                <View style={styles.formContent}>
                  <Text style={styles.title}>Welcome Back</Text>
                  <View style={styles.spectrumLine} />
                  <Text style={styles.subtitle}>Sign in to your account</Text>

                  <View style={styles.inputWrapper}>
                    <FontAwesomeIcon icon={faEnvelope} size={20} color={placeholderColor} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor={placeholderColor}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                      editable={!combinedIsLoading}
                      testID="email-input"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <FontAwesomeIcon icon={faLock} size={20} color={placeholderColor} style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={placeholderColor}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      returnKeyType="go"
                      onSubmitEditing={handleLogin}
                      editable={!combinedIsLoading}
                      testID="password-input"
                    />
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText} testID="error-message">{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => console.log('[LoginScreen] Forgot Password action triggered.')}
                    disabled={combinedIsLoading}
                  >
                    <Text style={styles.secondaryLinkText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.loginButton, combinedIsLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={combinedIsLoading}
                    testID="login-button"
                  >
                    {combinedIsLoading ? (
                      <ActivityIndicator size="small" color={whiteColor} />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>New to Communify? </Text>
                    <TouchableOpacity
                      onPress={navigateToSignup}
                      disabled={combinedIsLoading}
                    >
                      <Text style={styles.signupLinkText}>Create Account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles (as provided) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: backgroundColor }, // Use defined backgroundColor
  keyboardAvoidingView: { flex: 1 },
  outerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, backgroundColor: backgroundColor }, // Use defined backgroundColor
  container: { flexDirection: 'row', width: '100%', maxWidth: 960, height: '95%', maxHeight: 680, backgroundColor: whiteColor, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: subtleBorderColor, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 15 },
  leftContainer: { flex: 0.55, justifyContent: 'center', alignItems: 'center', padding: 36 },
  communifyText: { fontSize: 48, fontWeight: '700', color: whiteColor, textAlign: 'center', marginBottom: 16 },
  sloganTextSimplified: { fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontStyle: 'italic' },
  rightContainer: { flex: 0.45, backgroundColor: whiteColor, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 28 },
  formContent: { width: '100%' },
  title: { fontSize: 32, fontWeight: '700', color: primaryColor, textAlign: 'center', marginBottom: 8 },
  spectrumLine: { width: 60, height: 4, backgroundColor: secondaryColor, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: textColor, textAlign: 'center', marginBottom: 36, opacity: 0.65 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: inputBackground, borderRadius: 12, marginBottom: 24, paddingHorizontal: 16, height: 64, borderWidth: 1, borderColor: subtleBorderColor },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: textColor },
  errorContainer: { marginBottom: 16, marginTop: -12, alignItems: 'center' },
  errorText: { color: errorColor, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 20, paddingVertical: 4 },
  secondaryLinkText: { color: primaryColor, fontSize: 14, fontWeight: '600' },
  loginButton: { backgroundColor: primaryColor, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  loginButtonText: { color: whiteColor, fontWeight: '700', fontSize: 16 },
  buttonDisabled: { backgroundColor: secondaryColor, opacity: 0.75 }, // Changed from primaryColor to secondaryColor for disabled state for better visual cue
  footer: { marginTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: textColor, fontSize: 14 },
  signupLinkText: { color: primaryColor, fontWeight: '700', fontSize: 14, marginLeft: 4 },
});
// --- End Styles ---

export default LoginScreen;