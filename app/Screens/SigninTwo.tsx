// src/Screens/SigninTwo.tsx
import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    KeyboardAvoidingView, Platform, StatusBar, TouchableWithoutFeedback, Keyboard,
    ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faCheckCircle, faArrowLeft, faThLarge, faTh, faGripVertical,
    faLeaf, faLightbulb, faPuzzlePiece, faStar,
} from '@fortawesome/free-solid-svg-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_KEYS } from '../constants/storageKeys';

import { AuthStackParamList } from '../navigation/AuthNavigator';
import { AuthUser, useAuth } from '../context/AuthContext';
import apiService, {
    handleApiError,
    UserRegisterPayload,
    Gender,
    UserRead,
    ParentalSettingsData, // This is what saveParentalSettings expects as Partial input
    AsdLevel as ApiAsdLevel, // Import AsdLevel from apiService to ensure type consistency
    GridLayoutType as ApiGridLayoutType, // Import GridLayoutType from apiService
    AppearanceSettingsUpdatePayload // This is for the *value* part of appearance settings PATCH
} from '../services/apiService'; // Correct path

import * as appColors from '../../app/constants/colors'; // Assuming path is correct
import * as appDimensions from '../../app/constants/dimensions'; // Assuming path is correct

// Types for local state should align with API service types if possible
type LocalGridLayoutType = ApiGridLayoutType; // Use the type from apiService
export type LocalAsdLevelType = ApiAsdLevel; // Use the type from apiService

type SigninTwoScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SigninTwo'>;
type SigninTwoScreenRouteProp = RouteProp<AuthStackParamList, 'SigninTwo'>;

const SigninTwo: React.FC = () => {
    const navigation = useNavigation<SigninTwoScreenNavigationProp>();
    const route = useRoute<SigninTwoScreenRouteProp>();
    const { setUser } = useAuth();
    const { signupData } = route.params;

    const [userName] = useState(signupData.fullName || '');
    const [asdLevel, setAsdLevel] = useState<LocalAsdLevelType | null>(null); // Use LocalAsdLevelType
    const [gridLayout, setGridLayout] = useState<LocalGridLayoutType>('standard'); // Use LocalGridLayoutType
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const asdLevelOptions: { type: LocalAsdLevelType | 'noAsd'; label: string; description: string; icon: any }[] = [
        { type: 'noAsd', label: 'No Specific ASD Needs', description: 'General app experience, no ASD-specific aids.', icon: faLeaf },
        { type: 'low', label: 'Low Support Needs', description: 'Minor adjustments, more independence (Level 1).', icon: faLightbulb },
        { type: 'medium', label: 'Medium Support Needs', description: 'Structured support, visual aids helpful (Level 2).', icon: faPuzzlePiece },
        { type: 'high', label: 'High Support Needs', description: 'Significant support, simplified interface (Level 3).', icon: faStar },
    ];

    const gridLayoutOptions: { type: LocalGridLayoutType; label: string; icon: any }[] = [
        { type: 'simple', label: 'Simple', icon: faGripVertical },
        { type: 'standard', label: 'Standard', icon: faTh },
        { type: 'dense', label: 'Dense', icon: faThLarge },
    ];

    const validateSetup = useCallback((): boolean => {
        setError(null);
        if (!userName.trim()) { setError("User name is missing from previous step."); return false; }
        if (asdLevel === undefined || asdLevel === null) { // Check against null explicitly if 'noAsd' maps to null
             const noAsdOptionSelected = asdLevelOptions.find(opt => opt.type === 'noAsd');
             if (asdLevel === null && noAsdOptionSelected) { /* This is fine */ }
             else { setError("Please select the ASD support level."); return false; }
        }
        return true;
    }, [userName, asdLevel, asdLevelOptions]);

    const handleCompleteSetup = useCallback(async () => {
        Keyboard.dismiss();
        setError(null);

        if (!validateSetup()) return;

        setIsLoading(true);

        const registrationPayload: UserRegisterPayload = {
            name: userName.trim(),
            email: signupData.email,
            password: signupData.password,
            ...(signupData.age && { age: Number(signupData.age) }),
            ...(signupData.gender && { gender: signupData.gender.toLowerCase() as Gender }),
        };

        let registeredUser: UserRead | null = null;
        let authToken: string | null = null;

        try {
            registeredUser = await apiService.register(registrationPayload);
            // const userId = registeredUser.id; // userId available if needed

            // Login immediately after registration to get a token for subsequent settings updates
            const tokenResponse = await apiService.login(signupData.email, signupData.password);
            authToken = tokenResponse.access_token;
            // Note: apiService automatically stores the token, so subsequent calls will be authenticated

            // Prepare an object with only the parental settings that need to be updated (camelCase)
            const parentalSettingsToUpdate: Partial<ParentalSettingsData> = {};
            if (asdLevel) { // asdLevel from state can be 'low', 'medium', 'high', or 'noAsd' (string)
                // apiService.saveParentalSettings expects camelCase, and its mapping function
                // mapFrontendToApiParentalValues will convert 'noAsd' string to the API expected value or null
                parentalSettingsToUpdate.asdLevel = asdLevel === 'noAsd' ? null : asdLevel;
            }
            // Add other parental settings if collected in this screen

            console.log('[SigninTwo] parentalSettingsToUpdate (camelCase):', JSON.stringify(parentalSettingsToUpdate, null, 2));

            if (Object.keys(parentalSettingsToUpdate).length > 0) {
                // Pass the camelCase settings object directly.
                // apiService.saveParentalSettings will handle wrapping it in "value" and converting to snake_case.
                await apiService.saveParentalSettings(parentalSettingsToUpdate);
                console.log('[SigninTwo] Parental settings API call made.');
            } else {
                console.log('[SigninTwo] No parental settings to update, skipping API call.');
            }

            // Prepare appearance settings update (camelCase)
            const appearanceSettingsToUpdate: Partial<AppearanceSettingsUpdatePayload> = {};
            if (gridLayout) {
                // Use camelCase for the payload to saveAppearanceSettings
                appearanceSettingsToUpdate.symbolGridLayout = gridLayout;
            }
            // Add other appearance settings if collected

            console.log('[SigninTwo] appearanceSettingsToUpdate (camelCase):', JSON.stringify(appearanceSettingsToUpdate, null, 2));

            if (Object.keys(appearanceSettingsToUpdate).length > 0) {
                // Call the correct function for appearance settings
                await apiService.saveAppearanceSettings(appearanceSettingsToUpdate);
                console.log('[SigninTwo] Appearance settings API call made.');
            } else {
                console.log('[SigninTwo] No appearance settings to update, skipping API call.');
            }


            if (setUser && authToken && registeredUser) {
                const userForContext: Omit<AuthUser, "localAvatarPath"> = {
                    id: registeredUser.id,
                    email: registeredUser.email,
                    name: registeredUser.name,
                    age: registeredUser.age,
                    gender: registeredUser.gender,
                    user_type: registeredUser.userType,
                    is_active: registeredUser.isActive,
                };
                 setUser(prev => ({
                     ...prev,
                     ...(userForContext as AuthUser), // Type assertion if confident
                     localAvatarPath: signupData.avatarUri,
                     isAuthenticated: true,
                 }));
            }

            if (signupData.avatarUri && registeredUser?.id) { // Check registeredUser.id
                try {
                    const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${registeredUser.id}`;
                    await AsyncStorage.setItem(avatarStorageKey, signupData.avatarUri);
                } catch (storageError) {
                    console.error('[SigninTwo] Error saving avatar URI to AsyncStorage:', storageError);
                    // Non-critical error, proceed
                }
            }

            Alert.alert(
                "Setup Complete!",
                "Your account and preferences have been configured.",
                [{ text: "Let's Go!", onPress: () => navigation.navigate('Login') }] // Example navigation
            );

        } catch (apiError: any) {
            const errorInfo = handleApiError(apiError);
            setError(errorInfo.message || 'Failed to complete setup. Please try again.');
            if (errorInfo.details) {
                console.warn('[SigninTwo] Validation Details from API:', errorInfo.details);
            }
            // If registration succeeded but settings failed, user might still want to login
            if (registeredUser && !authToken) { // This condition might be tricky if token was fetched but settings failed
                Alert.alert("Registration Succeeded", "Your account was created, but applying initial preferences failed. You can adjust them in settings after logging in.");
                // Navigate to Login so they can try logging in
                navigation.replace('Login');
            } else if (!registeredUser) {
                // Registration itself failed
                Alert.alert("Registration Failed", errorInfo.message || "Could not create your account. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        validateSetup,
        userName,
        signupData,
        asdLevel,
        gridLayout,
        navigation,
        setUser,
        setError, // setError should be stable from useState
    ]);

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Fallback if there's no screen to go back to in this stack
            navigation.replace('Signup');
        }
    }, [navigation]);

    const isFormCurrentlyValid = !!userName.trim() && (asdLevel !== null && asdLevel !== undefined) && !!gridLayout;


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"} backgroundColor={appColors.WHITE_COLOR} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 'height' can be problematic
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <FontAwesomeIcon icon={faArrowLeft} size={appDimensions.ICON_SIZE_MEDIUM} color={appColors.PRIMARY_COLOR} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Personalize Experience</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.innerContainer}>
                            <Text style={styles.introText}>
                                Almost there! Just a few more details to tailor the app. These can be changed later.
                            </Text>
                            <View style={styles.formSection}>
                                <Text style={styles.label}>ASD Support Level:</Text>
                                <View style={styles.optionsList}>
                                    {asdLevelOptions.map((option) => {
                                        const isSelected = asdLevel === option.type || (option.type === 'noAsd' && asdLevel === null);
                                        return (
                                            <TouchableOpacity
                                                key={option.type}
                                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                                onPress={() => setAsdLevel(option.type)} // Store 'noAsd' string in state
                                                activeOpacity={0.8}
                                                disabled={isLoading}
                                            >
                                                <FontAwesomeIcon icon={option.icon} size={appDimensions.ICON_SIZE_OPTION_CARD} color={isSelected ? appColors.PRIMARY_COLOR : appColors.TEXT_COLOR_SECONDARY} style={styles.optionIcon} />
                                                <View style={styles.optionTextWrapper}>
                                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                                    <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
                                                </View>
                                                <View style={[styles.checkIndicatorBase, isSelected && styles.checkIndicatorSelected]}>
                                                    {isSelected && <FontAwesomeIcon icon={faCheckCircle} size={appDimensions.ICON_SIZE_MEDIUM} color={appColors.WHITE_COLOR} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Preferred Symbol Grid Layout:</Text>
                                <View style={styles.buttonGroup}>
                                    {gridLayoutOptions.map(opt => {
                                        const isSelected = gridLayout === opt.type;
                                        return (
                                            <TouchableOpacity
                                                key={opt.type}
                                                style={[styles.selectButton, styles.gridButton, isSelected && styles.selectButtonSelected]}
                                                onPress={() => setGridLayout(opt.type)}
                                                activeOpacity={0.7}
                                                disabled={isLoading}
                                            >
                                                <FontAwesomeIcon icon={opt.icon} size={appDimensions.ICON_SIZE_MEDIUM} style={styles.buttonIcon} color={isSelected ? appColors.WHITE_COLOR : appColors.PRIMARY_COLOR} />
                                                <Text style={[styles.selectButtonText, styles.gridButtonText, isSelected && styles.selectButtonTextSelected]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, (isLoading || !isFormCurrentlyValid) && styles.buttonDisabled]}
                                onPress={handleCompleteSetup}
                                disabled={isLoading || !isFormCurrentlyValid}
                                activeOpacity={0.75}
                            >
                                {isLoading
                                    ? <ActivityIndicator size="small" color={appColors.WHITE_COLOR} />
                                    : <Text style={styles.submitButtonText}>Complete Setup & Register</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: appColors.WHITE_COLOR }, // Changed for consistency with header
    keyboardAvoidingView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: appDimensions.PADDING_HEADER_HORIZONTAL, paddingVertical: appDimensions.PADDING_HEADER_VERTICAL, backgroundColor: appColors.WHITE_COLOR, borderBottomWidth: appDimensions.BORDER_WIDTH_INPUT, borderBottomColor: appColors.BORDER_COLOR_LIGHT, },
    backButton: { padding: appDimensions.PADDING_ICON_BUTTON },
    headerTitle: { flex: 1, fontSize: appDimensions.FONT_SIZE_PAGE_HEADER, fontWeight: '600', color: appColors.TEXT_COLOR_PRIMARY, textAlign: 'center', marginHorizontal: appDimensions.ICON_MARGIN_RIGHT, },
    headerSpacer: { width: (appDimensions.ICON_SIZE_MEDIUM || 20) + ((appDimensions.PADDING_ICON_BUTTON || 5) * 2) }, // Added fallbacks
    scrollContainer: { flexGrow: 1, paddingBottom: appDimensions.MARGIN_LARGE, backgroundColor: appColors.BACKGROUND_COLOR }, // Added BG color
    innerContainer: { paddingHorizontal: appDimensions.MARGIN_MEDIUM, paddingTop: appDimensions.MARGIN_MEDIUM, },
    introText: { fontSize: appDimensions.FONT_SIZE_INPUT, color: appColors.TEXT_COLOR_SECONDARY, textAlign: 'center', marginBottom: appDimensions.MARGIN_LARGE, lineHeight: appDimensions.LINE_HEIGHT_INTRO, },
    formSection: { marginBottom: appDimensions.MARGIN_LARGE },
    label: { fontSize: appDimensions.FONT_SIZE_SUBTITLE, fontWeight: '500', color: appColors.TEXT_COLOR_SECONDARY, marginBottom: appDimensions.MARGIN_SMALL, },
    buttonGroup: { flexDirection: 'row', gap: appDimensions.MARGIN_SMALL, },
    selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: appDimensions.PADDING_MEDIUM, paddingHorizontal: appDimensions.PADDING_SMALL, borderRadius: appDimensions.BORDER_RADIUS_BUTTON, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT, borderColor: appColors.BORDER_COLOR_MEDIUM, backgroundColor: appColors.WHITE_COLOR, flex: 1, minHeight: appDimensions.BUTTON_MIN_HEIGHT_PROFILE, },
    gridButton: {},
    selectButtonSelected: { backgroundColor: appColors.PRIMARY_COLOR, borderColor: appColors.PRIMARY_COLOR, },
    buttonIcon: { marginRight: appDimensions.MARGIN_SMALL },
    selectButtonText: { fontSize: appDimensions.FONT_SIZE_LABEL, fontWeight: '600', color: appColors.PRIMARY_COLOR, textAlign: 'center', },
    gridButtonText: { fontSize: appDimensions.FONT_SIZE_LABEL, },
    selectButtonTextSelected: { color: appColors.WHITE_COLOR },
    optionsList: {},
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.WHITE_COLOR, padding: appDimensions.PADDING_MEDIUM, borderRadius: appDimensions.BORDER_RADIUS_CARD, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT, borderColor: appColors.BORDER_COLOR_MEDIUM, marginBottom: appDimensions.MARGIN_MEDIUM, minHeight: appDimensions.OPTION_CARD_MIN_HEIGHT, },
    optionCardSelected: { borderColor: appColors.PRIMARY_COLOR, backgroundColor: appColors.BACKGROUND_SELECTED_LIGHT, },
    optionIcon: { marginRight: appDimensions.PADDING_MEDIUM, width: (appDimensions.ICON_SIZE_OPTION_CARD || 20) + 5, textAlign: 'center', }, // Added fallback
    optionTextWrapper: { flex: 1, marginRight: appDimensions.MARGIN_SMALL, },
    optionLabel: { fontSize: appDimensions.FONT_SIZE_INPUT, fontWeight: 'bold', color: appColors.TEXT_COLOR_PRIMARY, marginBottom: appDimensions.MARGIN_XXSMALL, },
    optionLabelSelected: { color: appColors.PRIMARY_COLOR },
    optionDescription: { fontSize: appDimensions.FONT_SIZE_DESCRIPTION, color: appColors.TEXT_COLOR_SECONDARY, lineHeight: appDimensions.LINE_HEIGHT_DESCRIPTION, },
    optionDescriptionSelected: { color: appColors.TEXT_COLOR_SECONDARY }, // Usually doesn't change color much
    checkIndicatorBase: { width: appDimensions.CHECK_INDICATOR_SIZE, height: appDimensions.CHECK_INDICATOR_SIZE, borderRadius: appDimensions.CHECK_INDICATOR_SIZE / 2, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT, borderColor: appColors.BORDER_COLOR_MEDIUM, justifyContent: 'center', alignItems: 'center', backgroundColor: appColors.WHITE_COLOR, },
    checkIndicatorSelected: { borderColor: appColors.PRIMARY_COLOR, backgroundColor: appColors.PRIMARY_COLOR, },
    errorContainer: { marginVertical: appDimensions.MARGIN_MEDIUM, paddingHorizontal: appDimensions.PADDING_MEDIUM, paddingVertical: appDimensions.PADDING_SMALL, backgroundColor: appColors.ERROR_COLOR_BACKGROUND, borderColor: appColors.ERROR_COLOR_BORDER, borderWidth: appDimensions.BORDER_WIDTH_ERROR, borderRadius: appDimensions.BORDER_RADIUS_BUTTON, },
    errorText: { color: appColors.ERROR_COLOR_TEXT, fontSize: appDimensions.FONT_SIZE_ERROR, fontWeight: '500', textAlign: 'center', },
    submitButton: { backgroundColor: appColors.BUTTON_PRIMARY_BACKGROUND, paddingVertical: appDimensions.PADDING_LARGE, borderRadius: appDimensions.BORDER_RADIUS_BUTTON, alignItems: 'center', justifyContent: 'center', minHeight: appDimensions.BUTTON_MIN_HEIGHT, marginTop: appDimensions.MARGIN_MEDIUM, },
    submitButtonText: { color: appColors.BUTTON_PRIMARY_TEXT, fontWeight: 'bold', fontSize: appDimensions.FONT_SIZE_BUTTON, },
    buttonDisabled: { backgroundColor: appColors.BUTTON_DISABLED_BACKGROUND, opacity: appDimensions.OPACITY_DISABLED, },
});

export default SigninTwo;