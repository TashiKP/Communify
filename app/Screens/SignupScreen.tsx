// src/Screens/SignupScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
    KeyboardAvoidingView, Platform, StatusBar, TouchableWithoutFeedback, Keyboard,
    ActivityIndicator, Alert, ScrollView // Remove Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Remove Image Picker, RNFS, UUID imports from here
// import { launchImageLibrary, ImageLibraryOptions, ImagePickerResponse } from 'react-native-image-picker';
// import RNFS from 'react-native-fs';
// import { v4 as uuidv4 } from 'uuid';

// --- Import the new component ---
import AvatarPicker from '../components/AvatarPicker';
// -----------------------------

import { AuthStackParamList, UserSignupData } from '../navigation/AuthNavigator';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faUser, faCakeCandles, faEnvelope, faLock,
    // Remove faUserCircle, faCamera from here if only used by AvatarPicker
} from '@fortawesome/free-solid-svg-icons';

import * as Colors from '../constants/colors';
import * as Dimens from '../constants/dimensions';
import * as Strings from '../constants/strings';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
type GenderOption = typeof Strings.GENDER_MALE | typeof Strings.GENDER_FEMALE | typeof Strings.GENDER_OTHER;

const SignupScreen: React.FC = () => {
    // Keep state for form fields and the *permanent* avatar URI
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<GenderOption | ''>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined); // Stores the permanent URI
    const [isLoading, setIsLoading] = useState(false); // Loading state for form submission
    const [error, setError] = useState<string | null>(null); // Error state for form validation/submission

    const navigation = useNavigation<SignupScreenNavigationProp>();

    const ageInputRef = useRef<TextInput>(null);
    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    // --- Remove pickImage and deletePreviousAvatar logic ---

    // --- Validation (remains the same) ---
    const validateInput = useCallback(() => {
       setError(null); // Clear previous form errors
        if (!fullName.trim()) return Strings.VALIDATION_FULL_NAME_REQUIRED;
        if (!age.trim()) return Strings.VALIDATION_AGE_REQUIRED;
        const numericAge = Number(age);
        if (isNaN(numericAge) || numericAge <= 0 || numericAge > 120) return Strings.VALIDATION_AGE_INVALID;
        if (!gender) return Strings.VALIDATION_GENDER_REQUIRED;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) return Strings.VALIDATION_EMAIL_INVALID;
        if (!password || password.length < 6) return Strings.VALIDATION_PASSWORD_MIN_LENGTH;
        return null;
    }, [fullName, age, gender, email, password]);

    // --- Proceed to Next Step (Simpler) ---
    const handleProceedToNextStep = useCallback(async () => {
        Keyboard.dismiss();
        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }
        setIsLoading(true);
        setError(null);

        // Data includes the permanent avatar URI from state
        const collectedSignupData: UserSignupData = {
            fullName: fullName.trim(),
            age: age.trim(),
            gender: gender,
            email: email.trim(),
            password: password,
            avatarUri: avatarUri, // Pass the permanent URI from state
        };

        console.log('Proceeding to SigninTwo with data:', collectedSignupData);
        navigation.navigate('SigninTwo', { signupData: collectedSignupData });
        setIsLoading(false);

    }, [validateInput, navigation, fullName, age, gender, email, password, avatarUri]); // Include avatarUri dependency

    // --- Navigate to Login (remains the same) ---
    const navigateToLogin = useCallback(() => {
         if (navigation.canGoBack()) {
             navigation.goBack();
        } else {
             navigation.replace('Login');
        }
    }, [navigation]);

    const GENDER_OPTIONS: Array<GenderOption> = [Strings.GENDER_MALE, Strings.GENDER_FEMALE, Strings.GENDER_OTHER];

    return (
        <SafeAreaView style={styles.safeArea}>
             <StatusBar barStyle="dark-content" backgroundColor={Colors.STATUS_BAR_BACKGROUND_LIGHT} />
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
                             {/* ... Header ... */}
                             <View style={styles.headerContainer}>
                                <Text style={styles.title}>{Strings.SIGNUP_TITLE}</Text>
                                <Text style={styles.subtitle}>{Strings.SIGNUP_SUBTITLE}</Text>
                            </View>

                            <View style={styles.form}>
                                {/* --- Use the AvatarPicker Component --- */}
                                <AvatarPicker
                                    initialUri={avatarUri}
                                    onAvatarChange={setAvatarUri} // Directly pass the state setter
                                    size={Dimens.AVATAR_SIZE_SIGNUP || 100} // Use defined dimension or default
                                    disabled={isLoading} // Disable while form is submitting
                                    style={styles.avatarPickerStyle} // Add specific margin if needed
                                />
                                <Text style={styles.avatarHelperText}>Tap to add a profile picture (Optional)</Text>
                                {/* ------------------------------------ */}

                                {/* ... Rest of the form inputs (Full Name, Age, Gender, Email, Password) ... */}
                                {/* Full Name */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{Strings.SIGNUP_FULL_NAME_LABEL}</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faUser} size={Dimens.ICON_SIZE_SMALL} color={Colors.PLACEHOLDER_COLOR} style={styles.inputIcon} />
                                        <TextInput
                                             style={styles.input}
                                            placeholder={Strings.SIGNUP_FULL_NAME_PLACEHOLDER}
                                            placeholderTextColor={Colors.PLACEHOLDER_COLOR}
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
                                {/* Age */}
                                 <View style={styles.inputGroup}>
                                     <Text style={styles.label}>{Strings.SIGNUP_AGE_LABEL}</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faCakeCandles} size={Dimens.ICON_SIZE_SMALL} color={Colors.PLACEHOLDER_COLOR} style={styles.inputIcon} />
                                        <TextInput
                                            ref={ageInputRef}
                                            style={styles.input}
                                            placeholder={Strings.SIGNUP_AGE_PLACEHOLDER}
                                            placeholderTextColor={Colors.PLACEHOLDER_COLOR}
                                            value={age}
                                            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="number-pad"
                                            maxLength={3}
                                            returnKeyType="next"
                                            onSubmitEditing={() => Keyboard.dismiss()}
                                            blurOnSubmit={false}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>
                                 {/* Gender */}
                                 <View style={styles.inputGroup}>
                                     <Text style={styles.label}>{Strings.SIGNUP_GENDER_LABEL}</Text>
                                    <View style={styles.genderSegmentContainer}>
                                        {GENDER_OPTIONS.map((option, index) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={[
                                                    styles.genderSegment,
                                                    gender === option && styles.genderSegmentSelected,
                                                    index === GENDER_OPTIONS.length - 1 && { borderRightWidth: 0 }
                                                ]}
                                                onPress={() => {
                                                    setGender(option);
                                                    Keyboard.dismiss();
                                                    setTimeout(() => emailInputRef.current?.focus(), 100);
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
                                 {/* Email */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>{Strings.SIGNUP_EMAIL_LABEL}</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faEnvelope} size={Dimens.ICON_SIZE_SMALL} color={Colors.PLACEHOLDER_COLOR} style={styles.inputIcon} />
                                        <TextInput
                                            ref={emailInputRef}
                                            style={styles.input}
                                            placeholder={Strings.SIGNUP_EMAIL_PLACEHOLDER}
                                            placeholderTextColor={Colors.PLACEHOLDER_COLOR}
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
                                {/* Password */}
                                 <View style={styles.inputGroup}>
                                      <Text style={styles.label}>{Strings.SIGNUP_PASSWORD_LABEL}</Text>
                                    <View style={styles.inputWrapper}>
                                        <FontAwesomeIcon icon={faLock} size={Dimens.ICON_SIZE_SMALL} color={Colors.PLACEHOLDER_COLOR} style={styles.inputIcon} />
                                        <TextInput
                                            ref={passwordInputRef}
                                            style={styles.input}
                                            placeholder={Strings.SIGNUP_PASSWORD_PLACEHOLDER}
                                            placeholderTextColor={Colors.PLACEHOLDER_COLOR}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            returnKeyType="go"
                                            onSubmitEditing={handleProceedToNextStep}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>

                            </View>

                             {/* Display form validation errors */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                             {/* ... Actions (Submit Button, Login Link) ... */}
                              <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={[styles.createButton, isLoading && styles.buttonDisabled]}
                                    onPress={handleProceedToNextStep}
                                    disabled={isLoading}
                                    activeOpacity={0.75}
                                >
                                    {isLoading
                                        ? <ActivityIndicator size="small" color={Colors.LOADER_COLOR_PRIMARY} />
                                        : <Text style={styles.createButtonText}>{Strings.SIGNUP_PROCEED_BUTTON || 'Next Step'}</Text>
                                    }
                                </TouchableOpacity>

                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>{Strings.SIGNUP_ALREADY_HAVE_ACCOUNT}</Text>
                                    <TouchableOpacity onPress={navigateToLogin} disabled={isLoading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={styles.linkText}>{Strings.SIGNUP_LOGIN_LINK}</Text>
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

// --- Styles ---
const styles = StyleSheet.create({
     // ... Keep existing styles ...
    safeArea: { flex: 1, backgroundColor: Colors.BACKGROUND_COLOR, },
    keyboardAvoidingView: { flex: 1, },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', },
    innerContainer: { paddingHorizontal: Dimens.SCREEN_PADDING_HORIZONTAL, paddingVertical: Dimens.SCREEN_PADDING_VERTICAL, },
    headerContainer: { alignItems: 'center', marginBottom: Dimens.HEADER_CONTAINER_MARGIN_BOTTOM, },
    title: { fontSize: Dimens.FONT_SIZE_TITLE, fontWeight: 'bold', color: Colors.TEXT_COLOR_PRIMARY, textAlign: 'center', marginBottom: Dimens.LABEL_MARGIN_BOTTOM, },
    subtitle: { fontSize: Dimens.FONT_SIZE_SUBTITLE, color: Colors.TEXT_COLOR_SECONDARY, textAlign: 'center', lineHeight: 22, },
    form: { },

    // --- Remove specific avatar styles from here ---
    // avatarOuterContainer, avatarTouchable, avatarImage, avatarPlaceholder, cameraIconOverlay, avatarLoadingOverlay are now handled within AvatarPicker

    // --- Add style for positioning the AvatarPicker ---
    avatarPickerStyle: {
        marginBottom: Dimens.MARGIN_MEDIUM, // Add margin below the picker
        // Add other positioning styles if needed
    },
    // Style for the helper text below AvatarPicker
     avatarHelperText: {
        fontSize: Dimens.FONT_SIZE_HELPER, // e.g., 12
        color: Colors.TEXT_COLOR_SECONDARY,
        marginTop: -Dimens.MARGIN_SMALL, // Pull up slightly if spacing is too much
        marginBottom: Dimens.INPUT_GROUP_MARGIN_BOTTOM, // Add margin below text
        textAlign: 'center',
    },
    // --- Keep input group styles ---
     inputGroup: { marginBottom: Dimens.INPUT_GROUP_MARGIN_BOTTOM, },
    label: { fontSize: Dimens.FONT_SIZE_LABEL, fontWeight: '500', color: Colors.TEXT_COLOR_SECONDARY, marginBottom: Dimens.LABEL_MARGIN_BOTTOM, marginLeft: 2, },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.INPUT_BACKGROUND_COLOR, borderWidth: Dimens.BORDER_WIDTH_INPUT, borderColor: Colors.BORDER_COLOR_MEDIUM, borderRadius: Dimens.BORDER_RADIUS_INPUT, height: Dimens.INPUT_HEIGHT, paddingHorizontal: 12, },
    inputIcon: { marginRight: Dimens.ICON_MARGIN_RIGHT, },
    input: { flex: 1, height: '100%', fontSize: Dimens.FONT_SIZE_INPUT, color: Colors.TEXT_COLOR_PRIMARY, paddingVertical: 0, },
    genderSegmentContainer: { flexDirection: 'row', borderRadius: Dimens.BORDER_RADIUS_GENDER_SEGMENT, borderWidth: Dimens.BORDER_WIDTH_GENDER_SEGMENT, borderColor: Colors.PRIMARY_COLOR, overflow: 'hidden', height: Dimens.GENDER_SEGMENT_HEIGHT, },
    genderSegment: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: Dimens.BORDER_WIDTH_GENDER_SEGMENT, borderRightColor: Colors.PRIMARY_COLOR, backgroundColor: Colors.WHITE_COLOR, },
    genderSegmentSelected: { backgroundColor: Colors.PRIMARY_COLOR, },
    genderSegmentText: { fontSize: Dimens.FONT_SIZE_GENDER_SEGMENT, fontWeight: '500', color: Colors.PRIMARY_COLOR, },
    genderSegmentTextSelected: { color: Colors.WHITE_COLOR, fontWeight: 'bold', },
    errorContainer: { marginVertical: Dimens.ERROR_CONTAINER_MARGIN_VERTICAL, paddingHorizontal: Dimens.ERROR_CONTAINER_PADDING_HORIZONTAL, paddingVertical: Dimens.ERROR_CONTAINER_PADDING_VERTICAL, backgroundColor: Colors.ERROR_COLOR_BACKGROUND, borderColor: Colors.ERROR_COLOR_BORDER, borderWidth: Dimens.BORDER_WIDTH_ERROR, borderRadius: Dimens.BORDER_RADIUS_ERROR, alignItems: 'center', },
    errorText: { color: Colors.ERROR_COLOR_TEXT, fontSize: Dimens.FONT_SIZE_ERROR, fontWeight: '500', textAlign: 'center', },
    actionsContainer: { marginTop: Dimens.ACTIONS_CONTAINER_MARGIN_TOP, },
    createButton: { backgroundColor: Colors.BUTTON_PRIMARY_BACKGROUND, paddingVertical: 15, borderRadius: Dimens.BORDER_RADIUS_BUTTON, alignItems: 'center', justifyContent: 'center', minHeight: Dimens.BUTTON_MIN_HEIGHT, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: Dimens.SHADOW_OPACITY_BUTTON, shadowRadius: Dimens.SHADOW_RADIUS_BUTTON, elevation: Dimens.ELEVATION_BUTTON, },
    createButtonText: { color: Colors.BUTTON_PRIMARY_TEXT, fontWeight: 'bold', fontSize: Dimens.FONT_SIZE_BUTTON, },
    buttonDisabled: { backgroundColor: Colors.BUTTON_DISABLED_BACKGROUND, shadowOpacity: 0, elevation: 0, },
    footerContainer: { marginTop: Dimens.FOOTER_CONTAINER_MARGIN_TOP, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', },
    footerText: { color: Colors.TEXT_COLOR_SECONDARY, fontSize: Dimens.FONT_SIZE_FOOTER, },
    linkText: { color: Colors.LINK_TEXT_COLOR, fontWeight: 'bold', fontSize: Dimens.FONT_SIZE_LINK, marginLeft: 5, },
});

export default SignupScreen;