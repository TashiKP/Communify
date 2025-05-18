// src/Screens/LoginScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import apiService, { handleApiError, UserRead } from '../services/apiService';
import { useAuth, AuthUser } from '../context/AuthContext'; // Assuming AuthUser is exported from context

import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, KeyboardAvoidingView, Platform, StatusBar,
    TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';

// Import Constants
import * as Colors from '../constants/colors';
import * as Dimens from '../constants/dimensions';
import * as Strings from '../constants/strings';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface TokenResponse {
  access_token: string;
  token_type: string;
}

const LoginScreen: React.FC = () => {
  const { signIn, isLoading: isAuthLoading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInputRef = useRef<TextInput>(null);


  const handleLogin = async () => {
    Keyboard.dismiss();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError(Strings.LOGIN_ERROR_MISSING_FIELDS);
      return;
    }
    setLocalIsLoading(true);

    try {
      const tokenData: TokenResponse = await apiService.login(email, password);
      if (tokenData.access_token) {
        const currentUserData: UserRead = await apiService.getCurrentUser(); // Assuming returns UserRead or compatible type
        await signIn(tokenData.access_token, currentUserData);
      } else {
        setError(Strings.LOGIN_ERROR_INVALID_CREDENTIALS_FALLBACK);
        console.error('[LoginScreen] Login Error: No access_token in response despite no error throw.');
      }
    } catch (apiError: any) {
      const errorInfo = handleApiError(apiError);
      setError(errorInfo.message);
      console.error(`[LoginScreen] Login/Fetch User Error: ${errorInfo.message}`, apiError);
    } finally {
      setLocalIsLoading(false);
    }
  };
    const navigateToSignup = () => {
    if (!combinedIsLoading) {
      navigation.navigate('Signup');
    }
  };
  const combinedIsLoading = localIsLoading || isAuthLoading;
  return (
        <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.STATUS_BAR_BACKGROUND_DARK} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.outerContainer}>
            <View style={styles.container}>
              <LinearGradient
                colors={[Colors.GRADIENT_START_LOGIN, Colors.GRADIENT_END_LOGIN]} // Use color constants
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.leftContainer}
              >
                <Text style={styles.communifyText}>{Strings.BRAND_NAME}</Text>
                <Text style={styles.sloganTextSimplified}>{Strings.BRAND_SLOGAN}</Text>
              </LinearGradient>

              <View style={styles.rightContainer}>
                <View style={styles.formContent}>
                  <Text style={styles.title}>{Strings.LOGIN_TITLE}</Text>
                  <View style={styles.spectrumLine} />
                  <Text style={styles.subtitle}>{Strings.LOGIN_SUBTITLE}</Text>

                  <View style={styles.inputWrapper}>
                    <FontAwesomeIcon icon={faEnvelope} size={Dimens.ICON_SIZE_MEDIUM} color={Colors.PLACEHOLDER_COLOR_LOGIN} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={Strings.LOGIN_EMAIL_PLACEHOLDER}
                      placeholderTextColor={Colors.PLACEHOLDER_COLOR_LOGIN}
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
                    <FontAwesomeIcon icon={faLock} size={Dimens.ICON_SIZE_MEDIUM} color={Colors.PLACEHOLDER_COLOR_LOGIN} style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder={Strings.LOGIN_PASSWORD_PLACEHOLDER}
                      placeholderTextColor={Colors.PLACEHOLDER_COLOR_LOGIN}
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
                    <Text style={styles.secondaryLinkText}>{Strings.LOGIN_FORGOT_PASSWORD_TEXT}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.loginButton, combinedIsLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={combinedIsLoading}
                    testID="login-button"
                  >
                    {combinedIsLoading ? (
                      <ActivityIndicator size="small" color={Colors.LOADER_COLOR_ON_PRIMARY_BUTTON} />
                    ) : (
                      <Text style={styles.loginButtonText}>{Strings.LOGIN_SIGN_IN_BUTTON}</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>{Strings.LOGIN_NO_ACCOUNT_TEXT}</Text>
                    <TouchableOpacity
                      onPress={navigateToSignup}
                      disabled={combinedIsLoading}
                    >
                      <Text style={styles.signupLinkText}>{Strings.LOGIN_CREATE_ACCOUNT_LINK}</Text>
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

const LOGIN_SCREEN_PADDING = 12; // Example: Dimens.SCREEN_PADDING_SMALL
const LOGIN_CONTAINER_BORDER_RADIUS = 24; // Example: Dimens.BORDER_RADIUS_LARGE
const LOGIN_ICON_SIZE = 20; // Example: Dimens.ICON_SIZE_MEDIUM
const LOGIN_INPUT_HEIGHT = 64; // Example: Dimens.INPUT_HEIGHT_LARGE
const LOGIN_BUTTON_HEIGHT = 56; // Example: Dimens.BUTTON_HEIGHT_LARGE
const LOGIN_FONT_SIZE_TITLE = 32; // Example: Dimens.FONT_SIZE_XLARGE
const LOGIN_FONT_SIZE_SLOGAN = 18;
const LOGIN_FONT_SIZE_SUBTITLE = 16;
const LOGIN_FONT_SIZE_INPUT = 16;
const LOGIN_FONT_SIZE_LINK = 14;
const LOGIN_FONT_SIZE_BUTTON_TEXT = 16;
const LOGIN_MARGIN_LARGE = 36;
const LOGIN_MARGIN_MEDIUM = 24;
const LOGIN_MARGIN_SMALL = 16;
const LOGIN_MARGIN_XSMALL = 8;
const LOGIN_MARGIN_XXSMALL = 4;


// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.BACKGROUND_COLOR_LOGIN_SCREEN },
  keyboardAvoidingView: { flex: 1 },
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LOGIN_SCREEN_PADDING,
    backgroundColor: Colors.BACKGROUND_COLOR_LOGIN_SCREEN,
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 960, // Could be a Dimens constant
    height: '95%',  // Consider Dimens for percentages or fixed values
    maxHeight: 680, // Could be a Dimens constant
    backgroundColor: Colors.WHITE_COLOR,
    borderRadius: LOGIN_CONTAINER_BORDER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.BORDER_COLOR_SUBTLE_LOGIN,
    elevation: 10, // Could be Dimens.ELEVATION_MEDIUM
    shadowColor: Colors.SHADOW_COLOR_LOGIN,
    shadowOffset: { width: 0, height: 5 }, // Could be Dimens.SHADOW_OFFSET_MEDIUM
    shadowOpacity: 0.15, // Could be Dimens.SHADOW_OPACITY_MEDIUM
    shadowRadius: 15,   // Could be Dimens.SHADOW_RADIUS_LARGE
  },
  leftContainer: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LOGIN_MARGIN_LARGE,
  },
  communifyText: {
    fontSize: Dimens.FONT_SIZE_XXLARGE, // Example Dimens constant
    fontWeight: '700',
    color: Colors.WHITE_COLOR,
    textAlign: 'center',
    marginBottom: LOGIN_MARGIN_SMALL,
  },
  sloganTextSimplified: {
    fontSize: LOGIN_FONT_SIZE_SLOGAN,
    color: Colors.TEXT_COLOR_SLOGAN_LOGIN,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rightContainer: {
    flex: 0.45,
    backgroundColor: Colors.WHITE_COLOR,
    justifyContent: 'center',
    paddingHorizontal: Dimens.SCREEN_PADDING_HORIZONTAL, // Example usage
    paddingVertical: Dimens.SCREEN_PADDING_VERTICAL,   // Example usage
  },
  formContent: { width: '100%' },
  title: {
    fontSize: LOGIN_FONT_SIZE_TITLE,
    fontWeight: '700',
    color: Colors.PRIMARY_COLOR_LOGIN_ACCENT,
    textAlign: 'center',
    marginBottom: LOGIN_MARGIN_XSMALL,
  },
  spectrumLine: {
    width: 60, // Could be Dimens.SPECTRUM_LINE_WIDTH
    height: 4, // Could be Dimens.SPECTRUM_LINE_HEIGHT
    backgroundColor: Colors.SECONDARY_COLOR_LOGIN_ACCENT,
    borderRadius: 2, // Could be Dimens.BORDER_RADIUS_SMALL
    alignSelf: 'center',
    marginBottom: LOGIN_MARGIN_XSMALL,
  },
  subtitle: {
    fontSize: LOGIN_FONT_SIZE_SUBTITLE,
    color: Colors.TEXT_COLOR_SUBTITLE_LOGIN,
    textAlign: 'center',
    marginBottom: LOGIN_MARGIN_LARGE,
    opacity: 0.65, // Could be Dimens.OPACITY_MEDIUM
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.INPUT_BACKGROUND_LOGIN,
    borderRadius: Dimens.BORDER_RADIUS_INPUT_LOGIN, // Example
    marginBottom: LOGIN_MARGIN_MEDIUM,
    paddingHorizontal: LOGIN_MARGIN_SMALL,
    height: LOGIN_INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: Colors.BORDER_COLOR_SUBTLE_LOGIN,
  },
  inputIcon: {
    marginRight: Dimens.ICON_MARGIN_RIGHT_LOGIN, // Example
  },
  input: {
    flex: 1,
    fontSize: LOGIN_FONT_SIZE_INPUT,
    color: Colors.TEXT_COLOR_INPUT_LOGIN,
  },
  errorContainer: {
    marginBottom: LOGIN_MARGIN_SMALL,
    marginTop: -LOGIN_SCREEN_PADDING, // Adjust if LOGIN_SCREEN_PADDING is used for outer padding
    alignItems: 'center',
    // Consider using constants from your Colors file for error background/text/border
    backgroundColor: Colors.ERROR_BACKGROUND_LOGIN,
    borderColor: Colors.ERROR_BORDER_LOGIN,
    borderWidth: Dimens.BORDER_WIDTH_ERROR,
    borderRadius: Dimens.BORDER_RADIUS_ERROR,
    padding: Dimens.PADDING_SMALL,
  },
  errorText: {
    color: Colors.ERROR_TEXT_LOGIN,
    fontSize: LOGIN_FONT_SIZE_LINK,
    fontWeight: '500',
    textAlign: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Dimens.MARGIN_MEDIUM, // Example
    paddingVertical: LOGIN_MARGIN_XXSMALL,
  },
  secondaryLinkText: {
    color: Colors.PRIMARY_COLOR_LOGIN_ACCENT,
    fontSize: LOGIN_FONT_SIZE_LINK,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.BUTTON_PRIMARY_BACKGROUND_LOGIN,
    paddingVertical: LOGIN_MARGIN_SMALL,
    borderRadius: Dimens.BORDER_RADIUS_BUTTON_LOGIN, // Example
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LOGIN_BUTTON_HEIGHT,
  },
  loginButtonText: {
    color: Colors.BUTTON_PRIMARY_TEXT_LOGIN,
    fontWeight: '700',
    fontSize: LOGIN_FONT_SIZE_BUTTON_TEXT,
  },
  buttonDisabled: {
    backgroundColor: Colors.BUTTON_DISABLED_BACKGROUND_LOGIN,
    opacity: 0.75, // Could be Dimens.OPACITY_MEDIUM
  },
  footer: {
    marginTop: LOGIN_MARGIN_LARGE,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.TEXT_COLOR_FOOTER_LOGIN,
    fontSize: LOGIN_FONT_SIZE_LINK,
  },
  signupLinkText: {
    color: Colors.PRIMARY_COLOR_LOGIN_ACCENT,
    fontWeight: '700',
    fontSize: LOGIN_FONT_SIZE_LINK,
    marginLeft: LOGIN_MARGIN_XXSMALL,
  },
});
export default LoginScreen;