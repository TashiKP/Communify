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
    ParentalSettingsData,
    AsdLevel as ApiAsdLevel,
    GridLayoutType as ApiGridLayoutType,
    AppearanceSettingsUpdatePayload
} from '../services/apiService';

import * as appColors from '../../app/constants/colors';
import * as appDimensions from '../../app/constants/dimensions';

type LocalGridLayoutType = ApiGridLayoutType;
type LocalAsdStateType = ApiAsdLevel | 'noAsd' | null;
type AsdLevelOptionType = ApiAsdLevel | 'noAsd';


type SigninTwoScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SigninTwo'>;
type SigninTwoScreenRouteProp = RouteProp<AuthStackParamList, 'SigninTwo'>;

const SigninTwo: React.FC = () => {
    const navigation = useNavigation<SigninTwoScreenNavigationProp>();
    const route = useRoute<SigninTwoScreenRouteProp>();
    const { setUser } = useAuth(); // Using direct setUser from context
    const { signupData } = route.params;

    const [userName] = useState(signupData.fullName || '');
    const [asdLevel, setAsdLevel] = useState<LocalAsdStateType>(null);
    const [gridLayout, setGridLayout] = useState<LocalGridLayoutType>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const asdLevelOptions: { type: AsdLevelOptionType; label: string; description: string; icon: any }[] = [
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
        if (asdLevel === null) {
            setError("Please select the ASD support level."); return false;
        }
        if (!gridLayout) { setError("Please select a grid layout."); return false;}
        return true;
    }, [userName, asdLevel, gridLayout]);

    const handleCompleteSetup = useCallback(async () => {
        Keyboard.dismiss();
        setError(null);

        if (!validateSetup()) return;

        setIsLoading(true);

        const registrationPayload: UserRegisterPayload = {
            name: userName.trim(),
            email: signupData.email,
            password: signupData.password,
            age: signupData.age ? Number(signupData.age) : undefined,
            gender: signupData.gender ? signupData.gender.toLowerCase() as Gender : undefined,
        };

        let registeredUser: UserRead | null = null;
        let authToken: string | null = null;

        try {
            registeredUser = await apiService.register(registrationPayload);
            console.log('[SigninTwo] User registered:', JSON.stringify(registeredUser, null, 2));

            const tokenResponse = await apiService.login(signupData.email, signupData.password);
            authToken = tokenResponse.access_token;
            console.log('[SigninTwo] Logged in, token obtained and stored by apiService.');

            const parentalSettingsToUpdate: Partial<ParentalSettingsData> = {};
            if (asdLevel !== null) {
                parentalSettingsToUpdate.asdLevel = asdLevel === 'noAsd' ? null : asdLevel;
            }
            console.log('[SigninTwo] parentalSettingsToUpdate (to send to API):', JSON.stringify(parentalSettingsToUpdate, null, 2));
            if (Object.keys(parentalSettingsToUpdate).length > 0) {
                await apiService.saveParentalSettings(parentalSettingsToUpdate);
                console.log('[SigninTwo] Parental settings saved.');
            }

            const appearanceSettingsToUpdate: Partial<AppearanceSettingsUpdatePayload> = {};
            if (gridLayout) {
                appearanceSettingsToUpdate.symbolGridLayout = gridLayout;
            }
            console.log('[SigninTwo] appearanceSettingsToUpdate (to send to API):', JSON.stringify(appearanceSettingsToUpdate, null, 2));
            if (Object.keys(appearanceSettingsToUpdate).length > 0) {
                await apiService.saveAppearanceSettings(appearanceSettingsToUpdate);
                console.log('[SigninTwo] Appearance settings saved.');
            }
            const { signIn: authContextSignIn } = useAuth();
            if (setUser && authToken && registeredUser && registeredUser.id) { // Ensure registeredUser.id exists
                const userForAuthContext: AuthUser = {
                    id: registeredUser.id,
                    email: registeredUser.email,
                    name: registeredUser.name,
                    age: registeredUser.age,
                    gender: registeredUser.gender,
                    userType: registeredUser.userType,
                    isActive: registeredUser.isActive,
                    localAvatarPath: signupData.avatarUri || null,
                };
                // await authContextSignIn(authToken, backendUserDataForContext, signupData.avatarUri || null);
                setUser(userForAuthContext);
                console.log('[SigninTwo] AuthContext user set:', JSON.stringify(userForAuthContext, null, 2));

                const basicUserDataForStorage: Omit<AuthUser, 'localAvatarPath'> = {
                    id: userForAuthContext.id,
                    email: userForAuthContext.email,
                    name: userForAuthContext.name,
                    age: userForAuthContext.age,
                    gender: userForAuthContext.gender,
                    userType: userForAuthContext.userType,
                    isActive: userForAuthContext.isActive,
                };
                await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.USER_DATA, JSON.stringify(basicUserDataForStorage));
                console.log('[SigninTwo] Basic user data saved to AsyncStorage for bootstrap.');
            } else {
                console.warn('[SigninTwo] Could not set user in AuthContext or save basic data due to missing token, user, or user ID.');
            }

            if (signupData.avatarUri && registeredUser?.id) {
                try {
                    const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${registeredUser.id}`;
                    console.log(`[SigninTwo] SAVING avatar URI to AsyncStorage. Key: ${avatarStorageKey}, URI: ${signupData.avatarUri}`);
                    await AsyncStorage.setItem(avatarStorageKey, signupData.avatarUri);
                    console.log(`[SigninTwo] Successfully saved avatar URI to AsyncStorage for user ${registeredUser.id}.`);
                } catch (storageError) {
                    console.error('[SigninTwo] CRITICAL: Error saving avatar URI to AsyncStorage:', storageError);
                }
            } else if (signupData.avatarUri && !registeredUser?.id) {
                console.warn('[SigninTwo] Avatar URI present, but registeredUser.id is missing. Cannot save avatar path to AsyncStorage.');
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
                Alert.alert("Registration Succeeded, Login Failed", "Your account was created, but an issue occurred during auto-login. Please try logging in manually. Initial preferences might not have been saved.", [{text: 'Login', onPress: () => navigation.replace('Login')}]);
            } else if (!registeredUser) {
                Alert.alert("Registration Failed", errorInfo.message || "Could not create your account.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        validateSetup, userName, signupData, asdLevel, gridLayout, navigation, setUser, setError,
    ]);

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Signup');
        }
    }, [navigation]);

    const isAsdLevelSelected = asdLevel !== null;
    const isFormCurrentlyValid = !!userName.trim() && isAsdLevelSelected && !!gridLayout;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"} backgroundColor={appColors.WHITE_COLOR} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <FontAwesomeIcon icon={faArrowLeft} size={appDimensions.ICON_SIZE_MEDIUM || 20} color={appColors.PRIMARY_COLOR} />
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
                                        const isSelected = asdLevel === option.type;
                                        return (
                                            <TouchableOpacity
                                                key={option.type} // Ensured option.type is string
                                                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                                                onPress={() => setAsdLevel(option.type)}
                                                activeOpacity={0.8}
                                                disabled={isLoading}
                                            >
                                                <FontAwesomeIcon icon={option.icon} size={appDimensions.ICON_SIZE_OPTION_CARD || 20} color={isSelected ? appColors.PRIMARY_COLOR : appColors.TEXT_COLOR_SECONDARY} style={styles.optionIcon} />
                                                <View style={styles.optionTextWrapper}>
                                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
                                                    <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
                                                </View>
                                                <View style={[styles.checkIndicatorBase, isSelected && styles.checkIndicatorSelected]}>
                                                    {isSelected && <FontAwesomeIcon icon={faCheckCircle} size={appDimensions.ICON_SIZE_MEDIUM || 20} color={appColors.WHITE_COLOR} />}
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
                                                <FontAwesomeIcon icon={opt.icon} size={appDimensions.ICON_SIZE_MEDIUM || 20} style={styles.buttonIcon} color={isSelected ? appColors.WHITE_COLOR : appColors.PRIMARY_COLOR} />
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

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: appColors.WHITE_COLOR },
    keyboardAvoidingView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: appDimensions.PADDING_HEADER_HORIZONTAL || 15, paddingVertical: appDimensions.PADDING_HEADER_VERTICAL || 10, backgroundColor: appColors.WHITE_COLOR, borderBottomWidth: appDimensions.BORDER_WIDTH_INPUT || 1, borderBottomColor: appColors.BORDER_COLOR_LIGHT || '#eee', },
    backButton: { padding: appDimensions.PADDING_ICON_BUTTON || 8 },
    headerTitle: { flex: 1, fontSize: appDimensions.FONT_SIZE_PAGE_HEADER || 18, fontWeight: '600', color: appColors.TEXT_COLOR_PRIMARY, textAlign: 'center', marginHorizontal: appDimensions.ICON_MARGIN_RIGHT || 8, },
    headerSpacer: { width: (appDimensions.ICON_SIZE_MEDIUM || 20) + ((appDimensions.PADDING_ICON_BUTTON || 8) * 2) },
    scrollContainer: { flexGrow: 1, paddingBottom: appDimensions.MARGIN_LARGE || 20, backgroundColor: appColors.BACKGROUND_COLOR || '#f7f7f7' },
    innerContainer: { paddingHorizontal: appDimensions.MARGIN_MEDIUM || 15, paddingTop: appDimensions.MARGIN_MEDIUM || 15, },
    introText: { fontSize: appDimensions.FONT_SIZE_INPUT || 16, color: appColors.TEXT_COLOR_SECONDARY, textAlign: 'center', marginBottom: appDimensions.MARGIN_LARGE || 20, lineHeight: appDimensions.LINE_HEIGHT_INTRO || 22, },
    formSection: { marginBottom: appDimensions.MARGIN_LARGE || 20 },
    label: { fontSize: appDimensions.FONT_SIZE_SUBTITLE || 16, fontWeight: '500', color: appColors.TEXT_COLOR_SECONDARY, marginBottom: appDimensions.MARGIN_SMALL || 8, },
    buttonGroup: { flexDirection: 'row', gap: appDimensions.MARGIN_SMALL || 8, },
    selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: appDimensions.PADDING_MEDIUM || 12, paddingHorizontal: appDimensions.PADDING_SMALL || 8, borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1, borderColor: appColors.BORDER_COLOR_MEDIUM, backgroundColor: appColors.WHITE_COLOR, flex: 1, minHeight: appDimensions.BUTTON_MIN_HEIGHT_PROFILE || 48, },
    gridButton: {},
    selectButtonSelected: { backgroundColor: appColors.PRIMARY_COLOR, borderColor: appColors.PRIMARY_COLOR, },
    buttonIcon: { marginRight: appDimensions.MARGIN_SMALL || 8 },
    selectButtonText: { fontSize: appDimensions.FONT_SIZE_LABEL || 14, fontWeight: '600', color: appColors.PRIMARY_COLOR, textAlign: 'center', },
    gridButtonText: { fontSize: appDimensions.FONT_SIZE_LABEL || 14, },
    selectButtonTextSelected: { color: appColors.WHITE_COLOR },
    optionsList: {},
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.WHITE_COLOR, padding: appDimensions.PADDING_MEDIUM || 12, borderRadius: appDimensions.BORDER_RADIUS_CARD || 10, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1, borderColor: appColors.BORDER_COLOR_MEDIUM, marginBottom: appDimensions.MARGIN_MEDIUM || 12, minHeight: appDimensions.OPTION_CARD_MIN_HEIGHT || 60, },
    optionCardSelected: { borderColor: appColors.PRIMARY_COLOR, backgroundColor: appColors.BACKGROUND_SELECTED_LIGHT || '#e0f7ff', },
    optionIcon: { marginRight: appDimensions.PADDING_MEDIUM || 12, width: (appDimensions.ICON_SIZE_OPTION_CARD || 22) + 5, textAlign: 'center', },
    optionTextWrapper: { flex: 1, marginRight: appDimensions.MARGIN_SMALL || 8, },
    optionLabel: { fontSize: appDimensions.FONT_SIZE_INPUT || 16, fontWeight: 'bold', color: appColors.TEXT_COLOR_PRIMARY, marginBottom: appDimensions.MARGIN_XXSMALL || 4, },
    optionLabelSelected: { color: appColors.PRIMARY_COLOR },
    optionDescription: { fontSize: appDimensions.FONT_SIZE_DESCRIPTION || 13, color: appColors.TEXT_COLOR_SECONDARY, lineHeight: appDimensions.LINE_HEIGHT_DESCRIPTION || 18, },
    optionDescriptionSelected: { color: appColors.TEXT_COLOR_SECONDARY },
    checkIndicatorBase: { width: appDimensions.CHECK_INDICATOR_SIZE || 24, height: appDimensions.CHECK_INDICATOR_SIZE || 24, borderRadius: (appDimensions.CHECK_INDICATOR_SIZE || 24) / 2, borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1, borderColor: appColors.BORDER_COLOR_MEDIUM, justifyContent: 'center', alignItems: 'center', backgroundColor: appColors.WHITE_COLOR, },
    checkIndicatorSelected: { borderColor: appColors.PRIMARY_COLOR, backgroundColor: appColors.PRIMARY_COLOR, },
    errorContainer: { marginVertical: appDimensions.MARGIN_MEDIUM || 12, paddingHorizontal: appDimensions.PADDING_MEDIUM || 12, paddingVertical: appDimensions.PADDING_SMALL || 8, backgroundColor: appColors.ERROR_COLOR_BACKGROUND, borderColor: appColors.ERROR_COLOR_BORDER, borderWidth: appDimensions.BORDER_WIDTH_ERROR || 1, borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8, },
    errorText: { color: appColors.ERROR_COLOR_TEXT, fontSize: appDimensions.FONT_SIZE_ERROR || 14, fontWeight: '500', textAlign: 'center', },
    submitButton: { backgroundColor: appColors.BUTTON_PRIMARY_BACKGROUND, paddingVertical: appDimensions.PADDING_LARGE || 15, borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8, alignItems: 'center', justifyContent: 'center', minHeight: appDimensions.BUTTON_MIN_HEIGHT || 50, marginTop: appDimensions.MARGIN_MEDIUM || 12, },
    submitButtonText: { color: appColors.BUTTON_PRIMARY_TEXT, fontWeight: 'bold', fontSize: appDimensions.FONT_SIZE_BUTTON || 16, },
    buttonDisabled: { backgroundColor: appColors.BUTTON_DISABLED_BACKGROUND, opacity: appDimensions.OPACITY_DISABLED || 0.6, },
});

export default SigninTwo;