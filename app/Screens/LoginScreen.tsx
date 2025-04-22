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
    Animated, // <-- UNCOMMENTED
    Easing, // <-- UNCOMMENTED
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
const cursorColor = 'rgba(255, 255, 255, 0.75)'; // <-- UNCOMMENTED

const { width, height } = Dimensions.get('window');

const FULL_SLOGAN = 'Where Voices Find Their Way';
const TYPING_SPEED_MS = 100; // <-- UNCOMMENTED
const CURSOR_BLINK_MS = 500; // <-- UNCOMMENTED

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- UNCOMMENTED SLOGAN/CURSOR STATE ---
    const [displayedSlogan, setDisplayedSlogan] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const sloganIndex = useRef(0);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // --------------------------------------

    // --- UNCOMMENTED ANIMATION VALUES ---
    const contentFadeAnim = useRef(new Animated.Value(0)).current;
    const formSlideAnim = useRef(new Animated.Value(30)).current;
    // ----------------------------------

    const communify = 'Communify';
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const passwordInputRef = React.createRef<TextInput>();

    // --- Animation Effect ---
    useEffect(() => {
        // --- UNCOMMENTED INITIAL ANIMATIONS ---
        Animated.parallel([
            Animated.timing(contentFadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true, // Keep native driver for opacity/transform
            }),
            Animated.timing(formSlideAnim, {
                toValue: 0,
                duration: 700,
                delay: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true, // Keep native driver for opacity/transform
            })
        ]).start();
        // --------------------------------------

        // --- UNCOMMENTED SLOGAN/CURSOR LOGIC ---
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
        sloganIndex.current = 0;
        setDisplayedSlogan('');
        setShowCursor(true); // Ensure cursor starts visible

        const startTypingTimeout = setTimeout(() => {
            cursorIntervalRef.current = setInterval(() => {
                setShowCursor(prev => !prev);
            }, CURSOR_BLINK_MS);

            typingIntervalRef.current = setInterval(() => {
                if (sloganIndex.current < FULL_SLOGAN.length) {
                    setDisplayedSlogan(prev => prev + FULL_SLOGAN[sloganIndex.current]);
                    sloganIndex.current += 1;
                } else {
                    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                    // Optionally stop cursor blinking here if desired
                    // if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
                    // setShowCursor(false);
                }
            }, TYPING_SPEED_MS);

        }, 600); // Delay before starting typing

        // --- Cleanup Function ---
        return () => {
            clearTimeout(startTypingTimeout);
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
        };
        // -----------------------------------------------------

    }, [contentFadeAnim, formSlideAnim]); // Dependencies are the initial animation values


    // --- Handlers (Keep as before) ---
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
                navigation.replace('Home'); // Make sure 'Home' screen is defined in navigator
            } else {
                setError('Invalid email or password.');
            }
            setIsLoading(false);
        }, 1500);
    };

    const navigateToSignup = () => {
        navigation.navigate('Signup'); // Make sure 'Signup' screen is defined
    };

    const navigateToForgotPassword = () => {
        console.log('Forgot Password Pressed');
        // navigation.navigate('ForgotPassword'); // If you implement this screen
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
                             {/* --- UNCOMMENTED Animated.View and style --- */}
                             <Animated.View style={[styles.brandingContent, { opacity: contentFadeAnim }]}>
                                <Text style={styles.communifyText}>{communify}</Text>
                                {/* --- UNCOMMENTED Slogan/Cursor Rendering --- */}
                                <View style={styles.sloganContainer}>
                                    <Text style={styles.sloganText}>
                                        {displayedSlogan}
                                        {showCursor && <Text style={styles.cursor}>|</Text>}
                                        {/* Placeholder for height */}
                                        {!displayedSlogan && !showCursor && <Text style={styles.sloganText}> </Text>}
                                    </Text>
                                </View>
                                {/* -------------------------------------- */}
                             </Animated.View>
                             {/* -------------------------------------- */}
                             <View style={styles.decorativeLine} />
                        </View>

                        {/* Right Form Column */}
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            <View style={styles.rightContainer}>
                                 {/* --- UNCOMMENTED Animated.View and styles --- */}
                                <Animated.View style={[
                                    styles.formContent,
                                    {
                                        opacity: contentFadeAnim,
                                        transform: [{ translateY: formSlideAnim }]
                                    }
                                ]}>
                                    {/* ... Rest of the form ... */}
                                    <Text style={styles.title}>Welcome Back!</Text>
                                    <Text style={styles.subtitle}>Sign in to continue</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faEnvelope} size={18} color={placeholderColor} style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={placeholderColor} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passwordInputRef.current?.focus()} blurOnSubmit={false}/>
                                     </View>
                                    <View style={styles.inputWrapper}>
                                         <FontAwesomeIcon icon={faLock} size={18} color={placeholderColor} style={styles.inputIcon} />
                                         <TextInput ref={passwordInputRef} style={styles.input} placeholder="Password" placeholderTextColor={placeholderColor} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="go" onSubmitEditing={handleLogin}/>
                                     </View>
                                    {error && (<View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>)}
                                    <TouchableOpacity style={styles.forgotPasswordButton} onPress={navigateToForgotPassword} disabled={isLoading}><Text style={styles.secondaryLinkText}>Forgot Password?</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.loginButton, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>{isLoading ? <ActivityIndicator size="small" color={whiteColor} /> : <Text style={styles.loginButtonText}>Login</Text>}</TouchableOpacity>
                                    <View style={styles.footer}><Text style={styles.footerText}>Don't have an account? </Text><TouchableOpacity onPress={navigateToSignup} disabled={isLoading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.signupLinkText}>Sign Up</Text></TouchableOpacity></View>
                                </Animated.View>
                                 {/* -------------------------------------- */}
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
    cursor: { // <-- UNCOMMENTED Style
        fontSize: 17,
        color: cursorColor,
        fontWeight: 'bold',
        marginLeft: 1,
    },
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