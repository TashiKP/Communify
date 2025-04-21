import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/types'; // Adjust the import path

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faCakeCandles, faVenusMars, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

// --- Colors ---
const primaryColor = '#0077b6';
const secondaryColor = '#00b4d8'; // Keep for potential accents or disabled states
const backgroundColor = '#f8f9fa'; // Slightly off-white for main background
const whiteColor = '#ffffff';
const textColor = '#212529'; // Slightly darker text for better contrast
const placeholderColor = '#6c757d'; // Adjusted placeholder grey
const errorColor = '#dc3545';
const lightGrey = '#e9ecef'; // For input backgrounds or borders
const mediumGrey = '#ced4da'; // For borders
const darkGrey = '#495057'; // For labels or secondary text

// --- Component ---
const SignupScreen = () => {
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Define refs for inputs
    const ageInputRef = React.createRef<TextInput>();
    const emailInputRef = React.createRef<TextInput>();
    const passwordInputRef = React.createRef<TextInput>();
    // No specific ref needed for gender selection UI focus logic here

    // --- Validation & Signup Logic ---
    const validateInput = useCallback(() => {
        setError(null); // Clear previous error first
        if (!fullName.trim()) return 'Please enter your full name.';
        if (!age.trim()) return 'Please enter your age.';
        const numericAge = Number(age);
        if (isNaN(numericAge) || numericAge <= 0 || numericAge > 120) return 'Please enter a valid age.';
        if (!gender) return 'Please select your gender.';
        // More robust email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) return 'Please enter a valid email address.';
        if (!password || password.length < 6) return 'Password must be at least 6 characters long.';
        return null;
    }, [fullName, age, gender, email, password]); // Dependencies for useCallback

    const handleCreateAccount = useCallback(() => {
        Keyboard.dismiss();
        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }
        setIsLoading(true);
        setError(null); // Clear error on successful validation start
        console.log('Creating Account:', { fullName, age: Number(age), gender, email });

        // Simulate API Call
        setTimeout(() => {
            console.log('Account Created Successfully (Simulated)');
            setIsLoading(false);
             // Navigate to a confirmation or login screen, passing email if needed
             // Example: Navigate to a SigninTwo screen if it exists and is defined
             // Ensure 'SigninTwo' exists in RootStackParamList and accepts 'email' param
             if (navigation.getState().routeNames.includes('SigninTwo')) {
                 navigation.navigate('SigninTwo', { email: email });
             } else {
                 // Fallback: Navigate to Login or show success message
                 Alert.alert('Account Created', 'Your account has been created successfully.');
                 navigation.replace('Login'); // Or go back if appropriate
             }
        }, 1500);
    }, [validateInput, navigation, email]); // Include navigation and email if used in success logic

    const navigateToLogin = useCallback(() => {
        if (navigation.canGoBack()) {
             navigation.goBack();
        } else {
             navigation.replace('Login'); // Use replace if Signup is the root
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
                {/* Use ScrollView to handle smaller screens or landscape */}
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled" // Allows taps on buttons while keyboard is up
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.innerContainer}>
                            {/* Header */}
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Create Your Account</Text>
                                <Text style={styles.subtitle}>Fill in the details below to join us.</Text>
                            </View>

                            {/* Form Fields */}
                            <View style={styles.form}>
                                {/* Full Name Input */}
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
                                        />
                                    </View>
                                </View>

                                {/* Age Input */}
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
                                            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))} // Allow only numbers
                                            keyboardType="number-pad"
                                            maxLength={3}
                                            returnKeyType="next" // Changed to next for gender selection conceptual flow
                                            onSubmitEditing={() => emailInputRef.current?.focus()} // Focus email next
                                            blurOnSubmit={false}
                                        />
                                    </View>
                                </View>

                                {/* Gender Selection */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderSegmentContainer}>
                                        {GENDER_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={[
                                                    styles.genderSegment,
                                                    gender === option && styles.genderSegmentSelected,
                                                    // Add border radius adjustments for first/last items
                                                    option === GENDER_OPTIONS[0] && styles.genderSegment,
                                                    option === GENDER_OPTIONS[GENDER_OPTIONS.length - 1] && styles.genderSegmentLast,
                                                ]}
                                                onPress={() => {
                                                    setGender(option);
                                                    Keyboard.dismiss(); // Dismiss keyboard on selection
                                                    // Optionally focus next input after short delay
                                                    // setTimeout(() => emailInputRef.current?.focus(), 100);
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[
                                                    styles.genderSegmentText,
                                                    gender === option && styles.genderSegmentTextSelected
                                                ]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>


                                {/* Email Input */}
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
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
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
                                            returnKeyType="go" // 'go' suggests final action
                                            onSubmitEditing={handleCreateAccount} // Trigger signup on submit
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Error Message Display */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Actions */}
                            <View style={styles.actionsContainer}>
                                {/* Create Account Button */}
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

                                {/* Login Link */}
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

// --- Styles --- (Professional Redesign)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: backgroundColor, // Use the light background for the whole screen
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1, // Ensure content can grow to fill space
        justifyContent: 'center', // Center content vertically if it's short
    },
    innerContainer: {
        paddingHorizontal: 25,
        paddingVertical: 30, // Add vertical padding
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40, // More space after header
    },
    title: {
        fontSize: 26, // Slightly smaller but still prominent
        fontWeight: 'bold', // Explicitly bold
        color: textColor, // Use the main text color
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: darkGrey, // Use a darker grey for subtitle
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        marginBottom: 20, // Space between form and error/actions
    },
    inputGroup: {
        marginBottom: 22, // Consistent spacing between form groups
    },
    label: {
        fontSize: 14,
        fontWeight: '500', // Medium weight for labels
        color: darkGrey,
        marginBottom: 8, // Space between label and input
        marginLeft: 2, // Slight indent for alignment
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: whiteColor, // White background for inputs
        borderWidth: 1,
        borderColor: mediumGrey, // Standard border color
        borderRadius: 8, // Slightly reduced border radius
        height: 52, // Standard height
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
        paddingVertical: 0, // Reset default padding
    },
    // --- Gender Segmented Control Styles ---
    genderSegmentContainer: {
        flexDirection: 'row',
        borderRadius: 8, // Match input border radius
        borderWidth: 1.5,
        borderColor: primaryColor, // Use primary color for the outer border
        overflow: 'hidden', // Clip children to rounded corners
        height: 48, // Slightly shorter than inputs maybe? Or match height 52? Let's try 48.
    },
    genderSegment: {
        flex: 1, // Each segment takes equal width
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1.5, // Separator line
        borderRightColor: primaryColor,
        backgroundColor: whiteColor, // Default background
    },
    genderSegmentLast: {
        borderRightWidth: 0, // No border on the last item
    },
    genderSegmentSelected: {
        backgroundColor: primaryColor, // Selected background is primary color
    },
    genderSegmentText: {
        fontSize: 15,
        fontWeight: '500',
        color: primaryColor, // Default text color matches primary
    },
    genderSegmentTextSelected: {
        color: whiteColor, // Selected text is white
        fontWeight: 'bold',
    },
    // Remove border radius adjustments for first/last if the container handles overflow: 'hidden'
    // genderSegmentFirst: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
    // genderSegmentLast: { borderTopRightRadius: 8, borderBottomRightRadius: 8, borderRightWidth: 0 },
    // --- End Gender Styles ---

    errorContainer: {
        marginVertical: 15, // Space around error message
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f8d7da', // Light red background for error
        borderColor: '#f5c6cb', // Red border
        borderWidth: 1,
        borderRadius: 6,
        alignItems: 'center',
    },
    errorText: {
        color: '#721c24', // Darker red text for error
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    actionsContainer: {
        marginTop: 10, // Space above the button
    },
    createButton: {
        backgroundColor: primaryColor,
        paddingVertical: 15, // Button padding
        borderRadius: 8, // Match input radius
        alignItems: 'center',
        justifyContent: 'center', // Center content (for ActivityIndicator)
        minHeight: 52, // Ensure consistent height
        shadowColor: '#000', // Subtle shadow
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
        backgroundColor: mediumGrey, // Grey out disabled button
        shadowOpacity: 0,
        elevation: 0,
    },
    footerContainer: {
        marginTop: 25, // Space above footer link
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: darkGrey, // Use darker grey for footer text
        fontSize: 14,
    },
    linkText: {
        color: primaryColor,
        fontWeight: 'bold', // Bold link
        fontSize: 14,
        marginLeft: 5,
    },
});

export default SignupScreen;