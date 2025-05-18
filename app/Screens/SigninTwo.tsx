import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  faThLarge,
  faTh,
  faGripVertical,
  faLeaf,
  faLightbulb,
  faPuzzlePiece,
  faStar,
} from '@fortawesome/free-solid-svg-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {ASYNC_STORAGE_KEYS} from '../constants/storageKeys';

import {AuthStackParamList} from '../navigation/AuthNavigator';
import {AuthUser, useAuth} from '../context/AuthContext';
import apiService, {
  handleApiError,
  UserRegisterPayload,
  Gender,
  UserRead,
  ParentalSettingsData,
  AsdLevel as ApiAsdLevel,
  GridLayoutType as ApiGridLayoutType,
  AppearanceSettingsUpdatePayload,
} from '../services/apiService';

import * as appColors from '../../app/constants/colors';
import * as appDimensions from '../../app/constants/dimensions';
import GridLayoutSelector from '../components/Auth/GridLayoutSelector';
import AsdLevelSelector from '../components/Auth/AsdLevelSelector';
import AuthScreenHeader from '../components/Auth/AuthScreenHeader';
import {AsdOptionCardData} from '../components/Auth/AsdOptionCard';
import {GridLayoutButtonData} from '../components/Auth/GridLayoutButton';

// Types (can be moved to a types file if preferred)
type LocalGridLayoutType = ApiGridLayoutType;
type AsdLevelOptionType = ApiAsdLevel | 'noAsd';
type LocalAsdStateType = AsdLevelOptionType | null;

type SigninTwoScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SigninTwo'
>;
type SigninTwoScreenRouteProp = RouteProp<AuthStackParamList, 'SigninTwo'>;

const SigninTwo: React.FC = () => {
  const navigation = useNavigation<SigninTwoScreenNavigationProp>();
  const route = useRoute<SigninTwoScreenRouteProp>();
  const {setUser} = useAuth();
  const {signupData} = route.params;

  const [userName] = useState(signupData.fullName || '');
  const [asdLevel, setAsdLevel] = useState<LocalAsdStateType>(null);
  const [gridLayout, setGridLayout] = useState<LocalGridLayoutType>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for child components
  const asdLevelOptions: AsdOptionCardData[] = [
    {
      type: 'noAsd',
      label: 'No Specific ASD Needs',
      description: 'General app experience, no ASD-specific aids.',
      icon: faLeaf,
    },
    {
      type: 'low',
      label: 'Low Support Needs',
      description: 'Minor adjustments, more independence (Level 1).',
      icon: faLightbulb,
    },
    {
      type: 'medium',
      label: 'Medium Support Needs',
      description: 'Structured support, visual aids helpful (Level 2).',
      icon: faPuzzlePiece,
    },
    {
      type: 'high',
      label: 'High Support Needs',
      description: 'Significant support, simplified interface (Level 3).',
      icon: faStar,
    },
  ];

  const gridLayoutOptions: GridLayoutButtonData[] = [
    {type: 'simple', label: 'Simple', icon: faGripVertical},
    {type: 'standard', label: 'Standard', icon: faTh},
    {type: 'dense', label: 'Dense', icon: faThLarge},
  ];

  const validateSetup = useCallback((): boolean => {
    setError(null);
    if (!userName.trim()) {
      setError('User name is missing from previous step.');
      return false;
    }
    if (asdLevel === null) {
      setError('Please select the ASD support level.');
      return false;
    }
    if (!gridLayout) {
      setError('Please select a grid layout.');
      return false;
    }
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
      gender: signupData.gender
        ? (signupData.gender.toLowerCase() as Gender)
        : undefined,
    };

    let registeredUser: UserRead | null = null;
    let authToken: string | null = null;

    try {
      registeredUser = await apiService.register(registrationPayload);
      console.log(
        '[SigninTwo] User registered:',
        JSON.stringify(registeredUser, null, 2),
      );

      const tokenResponse = await apiService.login(
        signupData.email,
        signupData.password,
      );
      authToken = tokenResponse.access_token;
      console.log(
        '[SigninTwo] Logged in, token obtained and stored by apiService.',
      );

      const parentalSettingsToUpdate: Partial<ParentalSettingsData> = {};
      if (asdLevel !== null) {
        parentalSettingsToUpdate.asdLevel =
          asdLevel === 'noAsd' ? null : asdLevel;
      }
      if (Object.keys(parentalSettingsToUpdate).length > 0) {
        await apiService.saveParentalSettings(parentalSettingsToUpdate);
        console.log('[SigninTwo] Parental settings saved.');
      }

      const appearanceSettingsToUpdate: Partial<AppearanceSettingsUpdatePayload> =
        {};
      if (gridLayout) {
        appearanceSettingsToUpdate.symbolGridLayout = gridLayout;
      }
      if (Object.keys(appearanceSettingsToUpdate).length > 0) {
        await apiService.saveAppearanceSettings(appearanceSettingsToUpdate);
        console.log('[SigninTwo] Appearance settings saved.');
      }

      if (setUser && authToken && registeredUser && registeredUser.id) {
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
        setUser(userForAuthContext); // This now directly sets the user in AuthContext
        console.log(
          '[SigninTwo] AuthContext user set:',
          JSON.stringify(userForAuthContext, null, 2),
        );

        const basicUserDataForStorage: Omit<AuthUser, 'localAvatarPath'> = {
          id: userForAuthContext.id,
          email: userForAuthContext.email,
          name: userForAuthContext.name,
          age: userForAuthContext.age,
          gender: userForAuthContext.gender,
          userType: userForAuthContext.userType,
          isActive: userForAuthContext.isActive,
        };
        await AsyncStorage.setItem(
          ASYNC_STORAGE_KEYS.USER_DATA,
          JSON.stringify(basicUserDataForStorage),
        );
        console.log(
          '[SigninTwo] Basic user data saved to AsyncStorage for bootstrap.',
        );
      } else {
        console.warn(
          '[SigninTwo] Could not set user in AuthContext or save basic data due to missing token, user, or user ID.',
        );
      }

      if (signupData.avatarUri && registeredUser?.id) {
        try {
          const avatarStorageKey = `${ASYNC_STORAGE_KEYS.USER_AVATAR_URI_PREFIX}${registeredUser.id}`;
          await AsyncStorage.setItem(avatarStorageKey, signupData.avatarUri);
          console.log(
            `[SigninTwo] Successfully saved avatar URI to AsyncStorage for user ${registeredUser.id}.`,
          );
        } catch (storageError) {
          console.error(
            '[SigninTwo] CRITICAL: Error saving avatar URI to AsyncStorage:',
            storageError,
          );
        }
      } else if (signupData.avatarUri && !registeredUser?.id) {
        console.warn(
          '[SigninTwo] Avatar URI present, but registeredUser.id is missing. Cannot save avatar path to AsyncStorage.',
        );
      }

      Alert.alert(
        'Setup Complete!',
        'Your account and preferences have been configured.',
        [{text: "Let's Go!", onPress: () => navigation.replace('Login')}], // Consider navigating to main app stack if auto-login worked.
      );
    } catch (apiError: any) {
      const errorInfo = handleApiError(apiError);
      setError(
        errorInfo.message || 'Failed to complete setup. Please try again.',
      );
      if (errorInfo.details)
        console.warn(
          '[SigninTwo] Validation Details from API:',
          errorInfo.details,
        );

      if (registeredUser && !authToken) {
        Alert.alert(
          'Registration Succeeded, Login Failed',
          'Your account was created, but auto-login failed. Please log in manually. Initial preferences might not have saved.',
          [{text: 'Login', onPress: () => navigation.replace('Login')}],
        );
      } else if (!registeredUser) {
        Alert.alert(
          'Registration Failed',
          errorInfo.message || 'Could not create your account.',
        );
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
    setError,
  ]);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Signup');
    }
  }, [navigation]);

  const isAsdLevelSelected = asdLevel !== null;
  const isFormCurrentlyValid =
    !!userName.trim() && isAsdLevelSelected && !!gridLayout;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={appColors.WHITE_COLOR}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 'height' might be better for some layouts
        style={styles.keyboardAvoidingView}>
        <AuthScreenHeader
          title="Personalize Experience"
          onBackPress={handleGoBack}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>
            <View style={styles.innerContainer}>
              <Text style={styles.introText}>
                Almost there! Just a few more details to tailor the app. These
                can be changed later.
              </Text>

              <AsdLevelSelector
                options={asdLevelOptions}
                selectedValue={asdLevel}
                onSelect={value => setAsdLevel(value as LocalAsdStateType)} // Cast if necessary
                isLoading={isLoading}
              />

              <GridLayoutSelector
                options={gridLayoutOptions}
                selectedValue={gridLayout}
                onSelect={value => setGridLayout(value as LocalGridLayoutType)} // Cast if necessary
                isLoading={isLoading}
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isLoading || !isFormCurrentlyValid) && styles.buttonDisabled,
                ]}
                onPress={handleCompleteSetup}
                disabled={isLoading || !isFormCurrentlyValid}
                activeOpacity={0.75}>
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={appColors.WHITE_COLOR}
                  />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Complete Setup & Register
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: appColors.WHITE_COLOR},
  keyboardAvoidingView: {flex: 1},
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: appDimensions.MARGIN_LARGE || 20,
    backgroundColor: appColors.BACKGROUND_COLOR || '#f7f7f7',
  },
  innerContainer: {
    paddingHorizontal: appDimensions.MARGIN_MEDIUM || 15,
    paddingTop: appDimensions.MARGIN_MEDIUM || 15,
  },
  introText: {
    fontSize: appDimensions.FONT_SIZE_INPUT || 16,
    color: appColors.TEXT_COLOR_SECONDARY,
    textAlign: 'center',
    marginBottom: appDimensions.MARGIN_LARGE || 20,
    lineHeight: appDimensions.LINE_HEIGHT_INTRO || 22,
  },
  errorContainer: {
    marginVertical: appDimensions.MARGIN_MEDIUM || 12,
    paddingHorizontal: appDimensions.PADDING_MEDIUM || 12,
    paddingVertical: appDimensions.PADDING_SMALL || 8,
    backgroundColor: appColors.ERROR_COLOR_BACKGROUND,
    borderColor: appColors.ERROR_COLOR_BORDER,
    borderWidth: appDimensions.BORDER_WIDTH_ERROR || 1,
    borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8,
  },
  errorText: {
    color: appColors.ERROR_COLOR_TEXT,
    fontSize: appDimensions.FONT_SIZE_ERROR || 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: appColors.BUTTON_PRIMARY_BACKGROUND,
    paddingVertical: appDimensions.PADDING_LARGE || 15,
    borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: appDimensions.BUTTON_MIN_HEIGHT || 50,
    marginTop: appDimensions.MARGIN_MEDIUM || 12,
  },
  submitButtonText: {
    color: appColors.BUTTON_PRIMARY_TEXT,
    fontWeight: 'bold',
    fontSize: appDimensions.FONT_SIZE_BUTTON || 16,
  },
  buttonDisabled: {
    backgroundColor: appColors.BUTTON_DISABLED_BACKGROUND,
    opacity: appDimensions.OPACITY_DISABLED || 0.6,
  },
});

export default SigninTwo;
