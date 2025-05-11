// src/Screens/SignupScreen.tsx
import React, { useState, useCallback, useRef } from 'react'; // Added useRef
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    // Dimensions, // Not used, can be removed
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator'; // Correct ParamList import

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCakeCandles, /*faVenusMars,*/ faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'; // faVenusMars not used in current UI

// --- Colors ---
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8';
const backgroundColor = '#f8f9fa';
const whiteColor = '#ffffff';
const textColor = '#212529';
const placeholderColor = '#6c757d';
const errorColor = '#dc3545';
// const lightGrey = '#e9ecef'; // Not used
const mediumGrey = '#ced4da';
const darkGrey = '#495057';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC = () => { // Added React.FC for typing
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation<SignupScreenNavigationProp>();

    const ageInputRef = useRef<TextInput>(null); // Use useRef
    const emailInputRef = useRef<TextInput>(null); // Use useRef
    const passwordInputRef = useRef<TextInput>(null); // Use useRef

    const validateInput = useCallback(() => {
        setError(null);
        if (!fullName.trim()) return 'Please enter your full name.';
        if (!age.trim()) return 'Please enter your age.';
        const numericAge = Number(age);
        if (isNaN(numericAge) || numericAge <= 0 || numericAge > 120) return 'Please enter a valid age.';
        if (!gender) return 'Please select your gender.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) return 'Please enter a valid email address.';
        if (!password || password.length < 6) return 'Password must be at least 6 characters long.';
        return null;
    }, [fullName, age, gender, email, password]);

    const handleCreateAccount = useCallback(async () => { // Made async for potential future API calls
        Keyboard.dismiss();
        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }
        setIsLoading(true);
        setError(null);
        console.log('Creating Account:', { fullName, age: Number(age), gender, email });

        // Simulate API Call
        await new Promise(resolve => setTimeout(resolve, 1500)); // Use await for clarity
        
        console.log('Account Created Successfully (Simulated)');
        setIsLoading(false);
        
        // Check if SigninTwo route exists before navigating
        // This is a good check but ensure 'SigninTwo' is part of AuthStackParamList if used
        const currentRoutes = navigation.getParent()?.getState().routeNames || navigation.getState().routeNames;

        if (currentRoutes.includes('SigninTwo')) {
            navigation.navigate('SigninTwo', { email: email });
        } else {
            Alert.alert('Account Created', 'Your account has been created successfully.');
            navigation.replace('Login');
        }
    }, [validateInput, navigation, email, fullName, age, gender, password]); // Added missing dependencies

    const navigateToLogin = useCallback(() => {
        if (navigation.canGoBack()) {
             navigation.goBack();
        } else {
             navigation.replace('Login');
        }
    }, [navigation]);

    const GENDER_OPTIONS: Array<'Male' | 'Female' | 'Other'> = ['Male', 'Female', 'Other'];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.innerContainer}>
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Create Your Account</Text>
                                <Text style={styles.subtitle}>Fill in the details below to join us.</Text>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faUser} size={18} color={placeholderColor} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g., John Doe"
                                            placeholderTextColor={placeholderColor}
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => ageInputRef.current?.focus()}
                                            blurOnSubmit={false}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Age</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faCakeCandles} size={18} color={placeholderColor} style={styles.inputIcon} />
                                        <TextInput
                                            ref={ageInputRef}
                                            style={styles.input}
                                            placeholder="Your Age"
                                            placeholderTextColor={placeholderColor}
                                            value={age}
                                            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="number-pad"
                                            maxLength={3}
                                            returnKeyType="next"
                                            onSubmitEditing={() => Keyboard.dismiss()} // Dismiss keyboard before gender
                                            blurOnSubmit={false}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderSegmentContainer}>
                                        {GENDER_OPTIONS.map((option, index) => ( // Added index for key
                                            <TouchableOpacity
                                                key={option}
                                                style={[
                                                    styles.genderSegment,
                                                    gender === option && styles.genderSegmentSelected,
                                                    // No need for first/last specific styles if container has overflow:hidden
                                                    index === GENDER_OPTIONS.length - 1 && { borderRightWidth: 0 } // remove border for last only
                                                ]}
                                                onPress={() => {
                                                    setGender(option);
                                                    Keyboard.dismiss();
                                                    setTimeout(() => emailInputRef.current?.focus(), 100); // Focus next after selection
                                                }}
                                                activeOpacity={0.8}
                                                disabled={isLoading}
                                            >
                                                <Text style={[
                                                    styles.genderSegmentText,
                                                    gender === option && styles.genderSegmentTextSelected
                                                ]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>


                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faEnvelope} size={18} color={placeholderColor} style={styles.inputIcon} />
                                        <TextInput
                                            ref={emailInputRef}
                                            style={styles.input}
                                            placeholder="you@example.com"
                                            placeholderTextColor={placeholderColor}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            returnKeyType="next"
                                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                                            blurOnSubmit={false}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                     <Text style={styles.label}>Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faLock} size={18} color={placeholderColor} style={styles.inputIcon} />
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={styles.input}
                                            placeholder="Minimum 6 characters"
                                            placeholderTextColor={placeholderColor}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            returnKeyType="go"
                                            onSubmitEditing={handleCreateAccount}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>
                            </View>

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.createButton, isLoading && styles.buttonDisabled]}
                                    onPress={handleCreateAccount}
                                    disabled={isLoading}
                                    activeOpacity={0.75}
                                >
                                    {isLoading
                                        ? <ActivityIndicator size="small" color={whiteColor} />
                                        : <Text style={styles.createButtonText}>Create Account</Text>
                                    }
                                </TouchableOpacity>

                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>Already have an account? </Text>
                                    <TouchableOpacity onPress={navigateToLogin} disabled={isLoading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={styles.linkText}>Log In</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: backgroundColor,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    innerContainer: {
        paddingHorizontal: 25,
        paddingVertical: 30,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: textColor,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: darkGrey,
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: darkGrey,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: mediumGrey,
        borderRadius: 8,
        height: 52,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: textColor,
        paddingVertical: 0,
    },
    genderSegmentContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: primaryColor,
        overflow: 'hidden',
        height: 48,
    },
    genderSegment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1.5,
        borderRightColor: primaryColor,
        backgroundColor: whiteColor,
    },
    // genderSegmentLast: { // This style was duplicated and not correctly applied before
    //     borderRightWidth: 0,
    // },
    genderSegmentSelected: {
        backgroundColor: primaryColor,
    },
    genderSegmentText: {
        fontSize: 15,
        fontWeight: '500',
        color: primaryColor,
    },
    genderSegmentTextSelected: {
        color: whiteColor,
        fontWeight: 'bold',
    },
    errorContainer: {
        marginVertical: 15,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 6,
        alignItems: 'center',
    },
    errorText: {
        color: '#721c24',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    actionsContainer: {
        marginTop: 10,
    },
    createButton: {
        backgroundColor: primaryColor,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonText: {
        color: whiteColor,
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonDisabled: {
        backgroundColor: mediumGrey,
        shadowOpacity: 0,
        elevation: 0,
    },
    footerContainer: {
        marginTop: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: darkGrey,
        fontSize: 14,
    },
    linkText: {
        color: primaryColor,
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
});

export default SignupScreen;