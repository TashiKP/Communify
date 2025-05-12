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
    ParentalSettingsUpdatePayload,
    ParentalSettingsValueUpdate,
    AppearanceSettingsUpdatePayload
} from '../services/apiService';

import * as appColors from '../../app/constants/colors';
import * as appDimensions from '../../app/constants/dimensions';

// Types
type GridLayoutType = 'simple' | 'standard' | 'dense';
export type AsdLevelType = 'low' | 'medium' | 'high' | 'noAsd';

type SigninTwoScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SigninTwo'>;
type SigninTwoScreenRouteProp = RouteProp<AuthStackParamList, 'SigninTwo'>;

const SigninTwo: React.FC = () => {
    const navigation = useNavigation<SigninTwoScreenNavigationProp>();
    const route = useRoute<SigninTwoScreenRouteProp>();
    const { setUser } = useAuth();
    const { signupData } = route.params;

    // State
    // Keep userName state to hold the name passed from the previous screen for registration payload
    const [userName] = useState(signupData.fullName || '');
    const [asdLevel, setAsdLevel] = useState<AsdLevelType | null>(null);
    const [gridLayout, setGridLayout] = useState<GridLayoutType>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI Options
    const asdLevelOptions: { type: AsdLevelType; label: string; description: string; icon: any }[] = [
        { type: 'noAsd', label: 'No Specific ASD Needs', description: 'General app experience, no ASD-specific aids.', icon: faLeaf },
        { type: 'low', label: 'Low Support Needs', description: 'Minor adjustments, more independence (Level 1).', icon: faLightbulb },
        { type: 'medium', label: 'Medium Support Needs', description: 'Structured support, visual aids helpful (Level 2).', icon: faPuzzlePiece },
        { type: 'high', label: 'High Support Needs', description: 'Significant support, simplified interface (Level 3).', icon: faStar },
    ];

    const gridLayoutOptions: { type: GridLayoutType; label: string; icon: any }[] = [
        { type: 'simple', label: 'Simple', icon: faGripVertical },
        { type: 'standard', label: 'Standard', icon: faTh },
        { type: 'dense', label: 'Dense', icon: faThLarge },
    ];

    // Validate remaining fields
    const validateSetup = useCallback((): boolean => {
        setError(null);
        if (!userName.trim()) { setError("User name is missing from previous step."); return false; }
        if (!asdLevel) { setError("Please select the ASD support level."); return false; }
        return true;
    }, [userName, asdLevel, setError]); // userName is still a dependency

    const handleCompleteSetup = useCallback(async () => {
        Keyboard.dismiss();
        setError(null);

        if (!validateSetup()) return;

        setIsLoading(true);

        // Use the userName state (passed from previous screen) for registration
        const registrationPayload: UserRegisterPayload = {
            name: userName.trim(), // Use the stored userName
            email: signupData.email,
            password: signupData.password,
            ...(signupData.age && { age: Number(signupData.age) }),
            ...(signupData.gender && { gender: signupData.gender.toLowerCase() as Gender }),
        };

        let registeredUser: UserRead | null = null;
        let authToken: string | null = null;

        try {
            registeredUser = await apiService.register(registrationPayload);
            const userId = registeredUser.id;

            const tokenResponse = await apiService.login(signupData.email, signupData.password);
            authToken = tokenResponse.access_token;

            const parentalSettingsToUpdateValue: Partial<ParentalSettingsValueUpdate> = {};
            if (asdLevel) {
                parentalSettingsToUpdateValue.asd_level = asdLevel;
            }
            console.log('[SigninTwo] Before sending Parental Settings Update:');
            console.log('[SigninTwo] Selected asdLevel state:', asdLevel);
            console.log('[SigninTwo] parentalSettingsToUpdateValue object:', parentalSettingsToUpdateValue);

            if (Object.keys(parentalSettingsToUpdateValue).length > 0) {
                const parentalPayload: ParentalSettingsUpdatePayload = {
                    value: parentalSettingsToUpdateValue
                };
                console.log('[SigninTwo] Sending parentalPayload:', JSON.stringify(parentalPayload, null, 2)); // Log the actual payload
                await apiService.updateParentalSettings(parentalPayload);
                console.log('[SigninTwo] Parental settings API call made.');
            } else {
                console.log('[SigninTwo] No parental settings to update, skipping API call.');
            }
            const appearanceSettingsToUpdate: Partial<AppearanceSettingsUpdatePayload> = {};
            if (gridLayout) {
                appearanceSettingsToUpdate.symbol_grid_layout = gridLayout;
            }

            if (Object.keys(appearanceSettingsToUpdate).length > 0) {
                await apiService.updateAppearanceSettings(appearanceSettingsToUpdate);
            }

            if (setUser && authToken && registeredUser) {
                const userForContext: Omit<AuthUser, "localAvatarPath"> = {
                    id: registeredUser.id,
                    email: registeredUser.email,
                    name: registeredUser.name, // Use name from registeredUser response
                    age: registeredUser.age,
                    gender: registeredUser.gender,
                    user_type: registeredUser.user_type,
                    is_active: registeredUser.is_active,
                };
                 setUser(prev => ({
                     ...prev,
                     ...(userForContext as AuthUser),
                     localAvatarPath: signupData.avatarUri,
                     isAuthenticated: true,
                 }));
            }

            if (signupData.avatarUri && userId) {
                try {
                    const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${userId}`;
                    await AsyncStorage.setItem(avatarStorageKey, signupData.avatarUri);
                } catch (storageError) {
                    console.error('[SigninTwo] Error saving avatar URI to AsyncStorage:', storageError);
                    Alert.alert("Avatar Note", "Your account was created, but there was an issue saving your avatar preference locally.");
                }
            }

            Alert.alert(
                "Setup Complete!",
                "Your account and preferences have been configured.",
                [{ text: "Let's Go!", onPress: () => navigation.replace('Login') }]
            );

        } catch (apiError: any) {
            const errorInfo = handleApiError(apiError);
            setError(errorInfo.message || 'Failed to complete setup. Please try again.');
            if (errorInfo.details) {
                console.warn('[SigninTwo] Validation Details from API:', errorInfo.details);
            }
            if (registeredUser && !authToken) {
                Alert.alert("Registration Succeeded", "Your account was created, but setting preferences failed. Please try logging in.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        validateSetup,
        userName, // Still needed for registration payload
        signupData,
        asdLevel,
        gridLayout,
        navigation,
        setUser,
        setError,
    ]);

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Signup');
        }
    }, [navigation]);

    // Update validation check for button state
    const isFormCurrentlyValid = !!userName.trim() && !!asdLevel;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={appColors.BACKGROUND_COLOR} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <FontAwesomeIcon icon={faArrowLeft} size={appDimensions.ICON_SIZE_MEDIUM} color={appColors.PRIMARY_COLOR} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Personalize Your Experience</Text>
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
                                Almost there! Just a few more details to tailor the app for you.
                                These can be changed later in settings.
                            </Text>
                            <View style={styles.formSection}>
                                <Text style={styles.label}>ASD Support Level:</Text>
                                <View style={styles.optionsList}>
                                    {asdLevelOptions.map((option) => {
                                        const isSelected = asdLevel === option.type;
                                        return (
                                            <TouchableOpacity
                                                key={option.type}
                                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                                onPress={() => setAsdLevel(option.type)}
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
// Styles remain the same
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: appColors.BACKGROUND_COLOR },
    keyboardAvoidingView: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: appDimensions.PADDING_HEADER_HORIZONTAL,
        paddingVertical: appDimensions.PADDING_HEADER_VERTICAL,
        backgroundColor: appColors.WHITE_COLOR,
        borderBottomWidth: appDimensions.BORDER_WIDTH_INPUT,
        borderBottomColor: appColors.BORDER_COLOR_LIGHT,
    },
    backButton: { padding: appDimensions.PADDING_ICON_BUTTON },
    headerTitle: {
        flex: 1,
        fontSize: appDimensions.FONT_SIZE_PAGE_HEADER,
        fontWeight: '600',
        color: appColors.TEXT_COLOR_PRIMARY,
        textAlign: 'center',
        marginHorizontal: appDimensions.ICON_MARGIN_RIGHT,
    },
    headerSpacer: { width: appDimensions.ICON_SIZE_MEDIUM + (appDimensions.PADDING_ICON_BUTTON * 2) },
    scrollContainer: { flexGrow: 1, paddingBottom: appDimensions.MARGIN_LARGE },
    innerContainer: {
        paddingHorizontal: appDimensions.MARGIN_MEDIUM,
        paddingTop: appDimensions.MARGIN_MEDIUM,
    },
    introText: {
        fontSize: appDimensions.FONT_SIZE_INPUT,
        color: appColors.TEXT_COLOR_SECONDARY,
        textAlign: 'center',
        marginBottom: appDimensions.MARGIN_LARGE,
        lineHeight: appDimensions.LINE_HEIGHT_INTRO,
    },
    formSection: { marginBottom: appDimensions.MARGIN_LARGE },
    label: {
        fontSize: appDimensions.FONT_SIZE_SUBTITLE,
        fontWeight: '500',
        color: appColors.TEXT_COLOR_SECONDARY,
        marginBottom: appDimensions.MARGIN_SMALL,
    },
    input: { // Style is kept in case you need other inputs later, but not used now
        backgroundColor: appColors.WHITE_COLOR,
        borderWidth: appDimensions.BORDER_WIDTH_INPUT,
        borderColor: appColors.BORDER_COLOR_MEDIUM,
        borderRadius: appDimensions.BORDER_RADIUS_INPUT,
        paddingHorizontal: appDimensions.PADDING_INPUT_HORIZONTAL_PROFILE,
        height: appDimensions.INPUT_HEIGHT_PROFILE,
        fontSize: appDimensions.FONT_SIZE_INPUT,
        color: appColors.TEXT_COLOR_PRIMARY,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: appDimensions.MARGIN_SMALL,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: appDimensions.PADDING_MEDIUM,
        paddingHorizontal: appDimensions.PADDING_SMALL,
        borderRadius: appDimensions.BORDER_RADIUS_BUTTON,
        borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT,
        borderColor: appColors.BORDER_COLOR_MEDIUM,
        backgroundColor: appColors.WHITE_COLOR,
        flex: 1,
        minHeight: appDimensions.BUTTON_MIN_HEIGHT_PROFILE,
    },
    gridButton: {},
    selectButtonSelected: {
        backgroundColor: appColors.PRIMARY_COLOR,
        borderColor: appColors.PRIMARY_COLOR,
    },
    buttonIcon: { marginRight: appDimensions.MARGIN_SMALL },
    selectButtonText: {
        fontSize: appDimensions.FONT_SIZE_LABEL,
        fontWeight: '600',
        color: appColors.PRIMARY_COLOR,
        textAlign: 'center',
    },
    gridButtonText: {
        fontSize: appDimensions.FONT_SIZE_LABEL,
    },
    selectButtonTextSelected: { color: appColors.WHITE_COLOR },
    optionsList: {},
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.WHITE_COLOR,
        padding: appDimensions.PADDING_MEDIUM,
        borderRadius: appDimensions.BORDER_RADIUS_CARD,
        borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT,
        borderColor: appColors.BORDER_COLOR_MEDIUM,
        marginBottom: appDimensions.MARGIN_MEDIUM,
        minHeight: appDimensions.OPTION_CARD_MIN_HEIGHT,
    },
    optionCardSelected: {
        borderColor: appColors.PRIMARY_COLOR,
        backgroundColor: appColors.BACKGROUND_SELECTED_LIGHT,
    },
    optionIcon: {
        marginRight: appDimensions.PADDING_MEDIUM,
        width: appDimensions.ICON_SIZE_OPTION_CARD + 5,
        textAlign: 'center',
    },
    optionTextWrapper: {
        flex: 1,
        marginRight: appDimensions.MARGIN_SMALL,
    },
    optionLabel: {
        fontSize: appDimensions.FONT_SIZE_INPUT,
        fontWeight: 'bold',
        color: appColors.TEXT_COLOR_PRIMARY,
        marginBottom: appDimensions.MARGIN_XXSMALL,
    },
    optionLabelSelected: { color: appColors.PRIMARY_COLOR },
    optionDescription: {
        fontSize: appDimensions.FONT_SIZE_DESCRIPTION,
        color: appColors.TEXT_COLOR_SECONDARY,
        lineHeight: appDimensions.LINE_HEIGHT_DESCRIPTION,
    },
    optionDescriptionSelected: { color: appColors.TEXT_COLOR_SECONDARY },
    checkIndicatorBase: {
        width: appDimensions.CHECK_INDICATOR_SIZE,
        height: appDimensions.CHECK_INDICATOR_SIZE,
        borderRadius: appDimensions.CHECK_INDICATOR_SIZE / 2,
        borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT,
        borderColor: appColors.BORDER_COLOR_MEDIUM,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: appColors.WHITE_COLOR,
    },
    checkIndicatorSelected: {
        borderColor: appColors.PRIMARY_COLOR,
        backgroundColor: appColors.PRIMARY_COLOR,
    },
    errorContainer: {
        marginVertical: appDimensions.MARGIN_MEDIUM,
        paddingHorizontal: appDimensions.PADDING_MEDIUM,
        paddingVertical: appDimensions.PADDING_SMALL,
        backgroundColor: appColors.ERROR_COLOR_BACKGROUND,
        borderColor: appColors.ERROR_COLOR_BORDER,
        borderWidth: appDimensions.BORDER_WIDTH_ERROR,
        borderRadius: appDimensions.BORDER_RADIUS_BUTTON,
    },
    errorText: {
        color: appColors.ERROR_COLOR_TEXT,
        fontSize: appDimensions.FONT_SIZE_ERROR,
        fontWeight: '500',
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: appColors.BUTTON_PRIMARY_BACKGROUND,
        paddingVertical: appDimensions.PADDING_LARGE,
        borderRadius: appDimensions.BORDER_RADIUS_BUTTON,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: appDimensions.BUTTON_MIN_HEIGHT,
        marginTop: appDimensions.MARGIN_MEDIUM,
    },
    submitButtonText: {
        color: appColors.BUTTON_PRIMARY_TEXT,
        fontWeight: 'bold',
        fontSize: appDimensions.FONT_SIZE_BUTTON,
    },
    buttonDisabled: {
        backgroundColor: appColors.BUTTON_DISABLED_BACKGROUND,
        opacity: appDimensions.OPACITY_DISABLED,
    },
});

export default SigninTwo;