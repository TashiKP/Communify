import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/types';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';

// --- Colors ---
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8';
const backgroundColor = '#f0f9ff';
const whiteColor = '#ffffff';
const textColor = '#343a40';
const placeholderColor = '#adb5bd';
const errorColor = '#dc3545';
const subtleBorderColor = '#e0e0e0';
const cursorColor = 'rgba(255, 255, 255, 0.75)';
const inputBackground = '#e6f0fa';
const gradientStart = '#0066a3';
const gradientEnd = '#0099c6';

const { width, height } = Dimensions.get('window');

const FULL_SLOGAN = 'Connect, Share, Inspire';
const TYPING_SPEED_MS = 75;
const CURSOR_BLINK_MS = 500;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Slogan and cursor state
    const [displayedSlogan, setDisplayedSlogan] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const sloganIndex = useRef(0);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Animation values
    const contentFadeAnim = useRef(new Animated.Value(0)).current;
    const formSlideAnim = useRef(new Animated.Value(40)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const buttonPulseAnim = useRef(new Animated.Value(1)).current;
    const emailInputAnim = useRef(new Animated.Value(1)).current;
    const passwordInputAnim = useRef(new Animated.Value(1)).current;
    const emailLabelAnim = useRef(new Animated.Value(0)).current;
    const passwordLabelAnim = useRef(new Animated.Value(0)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const emailIconAnim = useRef(new Animated.Value(1)).current;
    const passwordIconAnim = useRef(new Animated.Value(1)).current;

    const communify = 'Communify';
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const emailInputRef = React.createRef<TextInput>();
    const passwordInputRef = React.createRef<TextInput>();

    // Animation and typing effect
    useEffect(() => {
        Animated.parallel([
            Animated.timing(contentFadeAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(formSlideAnim, {
                toValue: 0,
                duration: 700,
                delay: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
        sloganIndex.current = 0;
        setDisplayedSlogan('');
        setShowCursor(true);

        const startTypingTimeout = setTimeout(() => {
            cursorIntervalRef.current = setInterval(() => {
                setShowCursor((prev) => !prev);
            }, CURSOR_BLINK_MS);

            typingIntervalRef.current = setInterval(() => {
                if (sloganIndex.current < FULL_SLOGAN.length) {
                    setDisplayedSlogan((prev) => prev + FULL_SLOGAN[sloganIndex.current]);
                    sloganIndex.current += 1;
                } else {
                    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                }
            }, TYPING_SPEED_MS);
        }, 700);

        // Wave animation for left panel
        Animated.loop(
            Animated.timing(waveAnim, {
                toValue: 1,
                duration: 4000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            })
        ).start();

        // Button pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(buttonPulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(buttonPulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        return () => {
            clearTimeout(startTypingTimeout);
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
        };
    }, [contentFadeAnim, formSlideAnim, waveAnim, buttonPulseAnim]);

    // Input focus animations
    useEffect(() => {
        Animated.parallel([
            Animated.spring(emailInputAnim, {
                toValue: emailFocused ? 0.97 : 1,
                friction: 7,
                tension: 120,
                useNativeDriver: true,
            }),
            Animated.timing(emailLabelAnim, {
                toValue: email || emailFocused ? 1 : 0,
                duration: 200,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(emailIconAnim, {
                toValue: emailFocused ? 1.2 : 1,
                friction: 6,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [emailFocused, email]);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(passwordInputAnim, {
                toValue: passwordFocused ? 0.97 : 1,
                friction: 7,
                tension: 120,
                useNativeDriver: true,
            }),
            Animated.timing(passwordLabelAnim, {
                toValue: password || passwordFocused ? 1 : 0,
                duration: 200,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(passwordIconAnim, {
                toValue: passwordFocused ? 1.2 : 1,
                friction: 6,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [passwordFocused, password]);

    // Handlers
    const handleLogin = () => {
        Keyboard.dismiss();
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        Animated.spring(buttonScaleAnim, {
            toValue: 0.92,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
        }).start(() => {
            buttonScaleAnim.setValue(1);
        });

        setTimeout(() => {
            if (email.toLowerCase() === 'test@gmail.com' && password === '123') {
                navigation.replace('Home');
            } else {
                setError('Invalid email or password.');
            }
            setIsLoading(false);
        }, 1200);
    };

    const navigateToSignup = () => {
        navigation.navigate('Signup');
    };

    const navigateToForgotPassword = () => {
        console.log('Forgot Password Pressed');
    };

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
                            {/* Left Branding Column */}
                            <LinearGradient
                                colors={[gradientStart, gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.leftContainer}
                            >
                                {/* Puzzle Piece Pattern Overlay */}
                                <View style={styles.puzzleOverlay}>
                                    {[...Array(3)].map((_, index) => (
                                        <View key={index} style={styles.puzzleRow}>
                                            {[...Array(3)].map((_, colIndex) => (
                                                <View
                                                    key={colIndex}
                                                    style={[
                                                        styles.puzzlePiece,
                                                        {
                                                            transform: [
                                                                { rotate: `${(index + colIndex) * 45}deg` },
                                                            ],
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                                {/* Wave Animation */}
                                <Animated.View
                                    style={[
                                        styles.wave,
                                        {
                                            transform: [
                                                {
                                                    translateY: waveAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 20],
                                                    }),
                                                },
                                            ],
                                            opacity: waveAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.3, 0.5],
                                            }),
                                        },
                                    ]}
                                />
                                <Animated.View style={[styles.brandingContent, { opacity: contentFadeAnim }]}>
                                    <Text style={styles.communifyText}>{communify}</Text>
                                    <View style={styles.sloganContainer}>
                                        <Text style={styles.sloganText}>
                                            {displayedSlogan}
                                            {showCursor && <Text style={styles.cursor}>|</Text>}
                                            {!displayedSlogan && !showCursor && (
                                                <Text style={styles.sloganText}> </Text>
                                            )}
                                        </Text>
                                    </View>
                                </Animated.View>
                                <View style={styles.decorativeLine} />
                            </LinearGradient>

                            {/* Right Form Column */}
                            <View style={styles.rightContainer}>
                                <Animated.View
                                    style={[
                                        styles.formContent,
                                        {
                                            opacity: contentFadeAnim,
                                            transform: [{ translateY: formSlideAnim }],
                                        },
                                    ]}
                                >
                                    <Text style={styles.title}>Welcome Back</Text>
                                    <View style={styles.spectrumLine} />
                                    <Text style={styles.subtitle}>Sign in to your account</Text>
                                    <Animated.View
                                        style={[
                                            styles.inputWrapper,
                                            emailFocused && styles.inputWrapperFocused,
                                            { transform: [{ scale: emailInputAnim }] },
                                        ]}
                                    >
                                        <Animated.View style={{ transform: [{ scale: emailIconAnim }] }}>
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                size={20}
                                                color={emailFocused ? primaryColor : placeholderColor}
                                                style={styles.inputIcon}
                                            />
                                        </Animated.View>
                                        <View style={styles.inputContent}>
                                            <Animated.Text
                                                style={[
                                                    styles.inputLabel,
                                                    {
                                                        transform: [
                                                            {
                                                                translateY: emailLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, -24],
                                                                }),
                                                            },
                                                            {
                                                                scale: emailLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [1, 0.75],
                                                                }),
                                                            },
                                                        ],
                                                        color: emailLabelAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [placeholderColor, primaryColor],
                                                        }),
                                                    },
                                                ]}
                                            >
                                                Email Address
                                            </Animated.Text>
                                            <TextInput
                                                ref={emailInputRef}
                                                style={styles.input}
                                                placeholder=""
                                                value={email}
                                                onChangeText={setEmail}
                                                onFocus={() => setEmailFocused(true)}
                                                onBlur={() => setEmailFocused(false)}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                returnKeyType="next"
                                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                                                blurOnSubmit={false}
                                                aria-label="Email Address"
                                                accessibilityLabel="Email Address"
                                            />
                                            <Animated.View
                                                style={[
                                                    styles.underline,
                                                    {
                                                        transform: [
                                                            {
                                                                scaleX: emailLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, 1],
                                                                }),
                                                            },
                                                        ],
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </Animated.View>
                                    <Animated.View
                                        style={[
                                            styles.inputWrapper,
                                            passwordFocused && styles.inputWrapperFocused,
                                            { transform: [{ scale: passwordInputAnim }] },
                                        ]}
                                    >
                                        <Animated.View style={{ transform: [{ scale: passwordIconAnim }] }}>
                                            <FontAwesomeIcon
                                                icon={faLock}
                                                size={20}
                                                color={passwordFocused ? primaryColor : placeholderColor}
                                                style={styles.inputIcon}
                                            />
                                        </Animated.View>
                                        <View style={styles.inputContent}>
                                            <Animated.Text
                                                style={[
                                                    styles.inputLabel,
                                                    {
                                                        transform: [
                                                            {
                                                                translateY: passwordLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, -24],
                                                                }),
                                                            },
                                                            {
                                                                scale: passwordLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [1, 0.75],
                                                                }),
                                                            },
                                                        ],
                                                        color: passwordLabelAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [placeholderColor, primaryColor],
                                                        }),
                                                    },
                                                ]}
                                            >
                                                Password
                                            </Animated.Text>
                                            <TextInput
                                                ref={passwordInputRef}
                                                style={styles.input}
                                                placeholder=""
                                                value={password}
                                                onChangeText={setPassword}
                                                onFocus={() => setPasswordFocused(true)}
                                                onBlur={() => setPasswordFocused(false)}
                                                secureTextEntry
                                                returnKeyType="go"
                                                onSubmitEditing={handleLogin}
                                                aria-label="Password"
                                                accessibilityLabel="Password"
                                            />
                                            <Animated.View
                                                style={[
                                                    styles.underline,
                                                    {
                                                        transform: [
                                                            {
                                                                scaleX: passwordLabelAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: [0, 1],
                                                                }),
                                                            },
                                                        ],
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </Animated.View>
                                    {error && (
                                        <View style={styles.errorContainer}>
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.forgotPasswordButton}
                                        onPress={navigateToForgotPassword}
                                        disabled={isLoading}
                                        accessibilityRole="button"
                                        accessibilityLabel="Forgot Password"
                                    >
                                        <Text style={styles.secondaryLinkText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                                        onPress={handleLogin}
                                        disabled={isLoading}
                                        accessibilityRole="button"
                                        accessibilityLabel="Sign In"
                                    >
                                        <Animated.View
                                            style={{
                                                transform: [
                                                    { scale: buttonScaleAnim },
                                                    { scale: buttonPulseAnim },
                                                ],
                                            }}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator size="small" color={whiteColor} />
                                            ) : (
                                                <Text style={styles.loginButtonText}>Sign In</Text>
                                            )}
                                        </Animated.View>
                                    </TouchableOpacity>
                                    <View style={styles.footer}>
                                        <Text style={styles.footerText}>New to Communify? </Text>
                                        <TouchableOpacity
                                            onPress={navigateToSignup}
                                            disabled={isLoading}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            accessibilityRole="button"
                                            accessibilityLabel="Create Account"
                                        >
                                            <Text style={styles.signupLinkText}>Create Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
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
        padding: Platform.OS === 'web' ? 0 : 12,
        backgroundColor: backgroundColor,
    },
    container: {
        flexDirection: 'row',
        width: Platform.OS === 'web' ? '90%' : '100%',
        maxWidth: 960,
        height: Platform.OS === 'web' ? 620 : '95%',
        maxHeight: 680,
        backgroundColor: whiteColor,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: subtleBorderColor,
    },
    leftContainer: {
        flex: Platform.OS === 'web' ? 0.5 : 0.55,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 36,
        position: 'relative',
    },
    puzzleOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    puzzleRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    puzzlePiece: {
        width: 30,
        height: 30,
        backgroundColor: whiteColor,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    wave: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    },
    brandingContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    communifyText: {
        fontSize: 48,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        color: whiteColor,
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1,
    },
    sloganContainer: {
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
    },
    sloganText: {
        fontSize: 18,
        fontWeight: '400',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        color: 'rgba(255, 255, 255, 0.92)',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 24,
    },
    cursor: {
        fontSize: 18,
        color: cursorColor,
        fontWeight: '600',
        marginLeft: 2,
    },
    decorativeLine: {
        position: 'absolute',
        bottom: 48,
        left: '18%',
        right: '18%',
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 1.5,
    },
    rightContainer: {
        flex: Platform.OS === 'web' ? 0.5 : 0.45,
        backgroundColor: whiteColor,
        justifyContent: 'center',
        paddingHorizontal: Platform.OS === 'web' ? 48 : 32,
        paddingVertical: 28,
    },
    formContent: {
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        color: primaryColor,
        textAlign: 'center',
        marginBottom: 8,
    },
    spectrumLine: {
        width: 60,
        height: 4,
        backgroundColor: secondaryColor,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        color: textColor,
        textAlign: 'center',
        marginBottom: 36,
        opacity: 0.65,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: inputBackground,
        borderRadius: 12,
        marginBottom: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: 64,
        borderWidth: 1,
        borderColor: subtleBorderColor,
    },
    inputWrapperFocused: {
        backgroundColor: '#d8e8f4',
        borderColor: primaryColor,
    },
    inputIcon: {
        marginRight: 12,
    },
    inputContent: {
        flex: 1,
        justifyContent: 'center',
        position: 'relative',
    },
    inputLabel: {
        position: 'absolute',
        left: 0,
        fontSize: 16,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        color: textColor,
        paddingVertical: 4,
        paddingBottom: 8,
    },
    underline: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: primaryColor,
    },
    errorContainer: {
        marginBottom: 16,
        marginTop: -12,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    errorText: {
        color: errorColor,
        fontSize: 14,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        textAlign: 'center',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    secondaryLinkText: {
        color: primaryColor,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        opacity: 0.9,
    },
    loginButton: {
        backgroundColor: primaryColor,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    loginButtonText: {
        color: whiteColor,
        fontWeight: '700',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.4,
    },
    buttonDisabled: {
        backgroundColor: secondaryColor,
        opacity: 0.75,
    },
    footer: {
        marginTop: 32,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: textColor,
        fontSize: 14,
        fontWeight: '400',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        opacity: 0.75,
    },
    signupLinkText: {
        color: primaryColor,
        fontWeight: '700',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        marginLeft: 4,
    },
});

export default LoginScreen;