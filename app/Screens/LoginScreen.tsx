// src/Screens/LoginScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/types'; // Adjust import path as necessary

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    // Animated, // <-- Removed Animated
    // Easing, // <-- Removed Easing
    Dimensions,
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

// --- Colors ---
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8';
const backgroundColor = '#f0f9ff';
const whiteColor = '#ffffff';
const textColor = '#343a40';
const placeholderColor = '#adb5bd';
const errorColor = '#dc3545';
const subtleBorderColor = '#e0e0e0';

const { width, height } = Dimensions.get('window');
const FULL_SLOGAN = 'Where Voices Find Their Way';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- REMOVED ALL ANIMATION STATE/REFS ---

    const communify = 'Communify';
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const passwordInputRef = React.createRef<TextInput>();

    // --- Animation Effect (Now Empty or Removed) ---
    useEffect(() => {
        // --- ALL ANIMATIONS COMMENTED OUT ---
        /*
        Animated.parallel([
            Animated.timing(contentFadeAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true, }),
            Animated.timing(formSlideAnim, { toValue: 0, duration: 700, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: true, })
        ]).start();
        */
        // --- SLOGAN/CURSOR LOGIC ALREADY COMMENTED OUT ---
        /*
        // ... interval logic ...
        return () => {
            // ... cleanup logic ...
        };
        */
    }, []); // Empty dependency array, runs once on mount


    // --- Handlers ---
    const handleLogin = () => {
        Keyboard.dismiss();
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        console.log('Attempting Login:', email);

        setTimeout(() => {
            if (email.toLowerCase() === 'test@gmail.com' && password === '123') {
                console.log('Login Successful');
                navigation.replace('Home');
            } else {
                setError('Invalid email or password.');
            }
            setIsLoading(false);
        }, 1500);
    };

    const navigateToSignup = () => {
        navigation.navigate('Signup');
    };

    const navigateToForgotPassword = () => {
        console.log('Forgot Password Pressed');
        // navigation.navigate('ForgotPassword');
    };

    // --- Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.outerContainer}>
                    <View style={styles.container}>

                        {/* Left Branding Column */}
                        <View style={styles.leftContainer}>
                             {/* Removed Animated.View wrapper */}
                             <View style={styles.brandingContent}>
                                <Text style={styles.communifyText}>{communify}</Text>
                                <View style={styles.sloganContainer}>
                                    <Text style={styles.sloganText}>{FULL_SLOGAN}</Text>
                                </View>
                             </View>
                             <View style={styles.decorativeLine} />
                        </View>

                        {/* Right Form Column */}
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            <View style={styles.rightContainer}>
                                 {/* Removed Animated.View wrapper and styles */}
                                <View style={styles.formContent}>
                                    <Text style={styles.title}>Welcome Back!</Text>
                                    <Text style={styles.subtitle}>Sign in to continue</Text>

                                    {/* Email Input */}
                                    <View style={styles.inputWrapper}>
                                         <FontAwesomeIcon icon={faEnvelope} size={18} color={placeholderColor} style={styles.inputIcon} />
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
                                        />
                                     </View>

                                    {/* Password Input */}
                                    <View style={styles.inputWrapper}>
                                         <FontAwesomeIcon icon={faLock} size={18} color={placeholderColor} style={styles.inputIcon} />
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
                                        />
                                     </View>

                                     {/* Error Message Display */}
                                     {error && (
                                         <View style={styles.errorContainer}>
                                             <Text style={styles.errorText}>{error}</Text>
                                         </View>
                                     )}

                                    {/* Forgot Password Link */}
                                    <TouchableOpacity
                                        style={styles.forgotPasswordButton}
                                        onPress={navigateToForgotPassword}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.secondaryLinkText}>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                                        onPress={handleLogin}
                                        disabled={isLoading}
                                        activeOpacity={0.75}
                                    >
                                        {isLoading
                                            ? <ActivityIndicator size="small" color={whiteColor} />
                                            : <Text style={styles.loginButtonText}>Login</Text>
                                        }
                                    </TouchableOpacity>


                                    {/* Sign Up Link */}
                                    <View style={styles.footer}>
                                         <Text style={styles.footerText}>Don't have an account? </Text>
                                         <TouchableOpacity
                                            onPress={navigateToSignup}
                                            disabled={isLoading}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                         >
                                            <Text style={styles.signupLinkText}>Sign Up</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: backgroundColor,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Platform.OS === 'web' ? 0 : 20,
        backgroundColor: backgroundColor,
    },
    container: {
        flexDirection: 'row',
        width: Platform.OS === 'web' ? '80%' : '100%',
        maxWidth: Platform.OS === 'web' ? 900 : undefined,
        height: Platform.OS === 'web' ? 600 : '95%',
        maxHeight: 650,
        backgroundColor: whiteColor,
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    leftContainer: {
        flex: Platform.OS === 'web' ? 0.5 : 0.55,
        backgroundColor: primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        position: 'relative',
    },
    brandingContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        // Removed animation style 'opacity'
    },
    communifyText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: whiteColor,
        textAlign: 'center',
        marginBottom: 15,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    sloganContainer: {
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        paddingHorizontal: 10,
    },
    sloganText: {
        fontSize: 17,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    // cursor style removed
    decorativeLine: {
        position: 'absolute',
        bottom: 40,
        left: '15%',
        right: '15%',
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
    },
    rightContainer: {
        flex: Platform.OS === 'web' ? 0.5 : 0.45,
        backgroundColor: whiteColor,
        justifyContent: 'center',
        paddingHorizontal: Platform.OS === 'web' ? 40 : 30,
        paddingVertical: 20,
    },
    formContent: {
        width: '100%',
         // Removed animation styles 'opacity', 'transform'
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: primaryColor,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: textColor,
        textAlign: 'center',
        marginBottom: 35,
        opacity: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: backgroundColor,
        borderWidth: 1,
        borderColor: subtleBorderColor,
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 12,
        color: placeholderColor,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: textColor,
        paddingVertical: 0,
    },
    errorContainer: {
        marginBottom: 15,
        marginTop: -10,
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    errorText: {
        color: errorColor,
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        paddingVertical: 5,
    },
    secondaryLinkText: {
        color: primaryColor,
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: primaryColor,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        minHeight: 55,
    },
    loginButtonText: {
        color: whiteColor,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    buttonDisabled: {
        backgroundColor: secondaryColor,
        shadowOpacity: 0.1,
        elevation: 2,
        opacity: 0.8,
    },
    footer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: textColor,
        fontSize: 14,
        opacity: 0.9,
    },
    signupLinkText: {
        color: primaryColor,
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 4,
    },
});

export default LoginScreen;