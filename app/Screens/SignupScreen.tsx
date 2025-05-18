import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AvatarPicker from '../components/AvatarPicker';

import {AuthStackParamList, UserSignupData} from '../navigation/AuthNavigator';

import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faUser,
  faCakeCandles,
  faEnvelope,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

import * as Colors from '../constants/colors';
import * as Dimens from '../constants/dimensions';
import * as Strings from '../constants/strings';
import GenderSelector, {GenderOption} from '../components/Auth/GenderSelector';
import AuthTextInput from '../components/Auth/AuthTextInput';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;
// GenderOption is now imported from GenderSelector

const SignupScreen: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<SignupScreenNavigationProp>();

  // Refs for focusing next input
  const ageInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validateInput = useCallback(() => {
    setError(null);
    if (!fullName.trim()) return Strings.VALIDATION_FULL_NAME_REQUIRED;
    if (!age.trim()) return Strings.VALIDATION_AGE_REQUIRED;
    const numericAge = Number(age);
    if (isNaN(numericAge) || numericAge <= 0 || numericAge > 120)
      return Strings.VALIDATION_AGE_INVALID;
    if (!gender) return Strings.VALIDATION_GENDER_REQUIRED;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email))
      return Strings.VALIDATION_EMAIL_INVALID;
    if (!password || password.length < 6)
      return Strings.VALIDATION_PASSWORD_MIN_LENGTH;
    return null;
  }, [fullName, age, gender, email, password]);

  const handleProceedToNextStep = useCallback(async () => {
    Keyboard.dismiss();
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError(null);

    const collectedSignupData: UserSignupData = {
      fullName: fullName.trim(),
      age: age.trim(),
      gender: gender as GenderOption, // Assert gender is selected
      email: email.trim(),
      password: password,
      avatarUri: avatarUri,
    };

    console.log('Proceeding to SigninTwo with data:', collectedSignupData);
    navigation.navigate('SigninTwo', {signupData: collectedSignupData});
    setIsLoading(false);
  }, [
    validateInput,
    navigation,
    fullName,
    age,
    gender,
    email,
    password,
    avatarUri,
  ]);

  const navigateToLogin = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  }, [navigation]);

  const GENDER_OPTIONS: Array<GenderOption> = [
    Strings.GENDER_MALE,
    Strings.GENDER_FEMALE,
    Strings.GENDER_OTHER,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.STATUS_BAR_BACKGROUND_LIGHT}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>
            <View style={styles.innerContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{Strings.SIGNUP_TITLE}</Text>
                <Text style={styles.subtitle}>{Strings.SIGNUP_SUBTITLE}</Text>
              </View>

              <View style={styles.form}>
                <AvatarPicker
                  initialUri={avatarUri}
                  onAvatarChange={setAvatarUri}
                  size={Dimens.AVATAR_SIZE_SIGNUP || 100}
                  disabled={isLoading}
                  style={styles.avatarPickerStyle}
                />
                <Text style={styles.avatarHelperText}>
                  Tap to add a profile picture (Optional)
                </Text>

                <AuthTextInput
                  label={Strings.SIGNUP_FULL_NAME_LABEL}
                  icon={faUser}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={Strings.SIGNUP_FULL_NAME_PLACEHOLDER}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => ageInputRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isLoading}
                />

                <AuthTextInput
                  label={Strings.SIGNUP_AGE_LABEL}
                  icon={faCakeCandles}
                  inputRef={ageInputRef}
                  value={age}
                  onChangeText={text => setAge(text.replace(/[^0-9]/g, ''))}
                  placeholder={Strings.SIGNUP_AGE_PLACEHOLDER}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="next"
                  // For age, we might want to dismiss keyboard or focus gender if it were an input
                  onSubmitEditing={() => Keyboard.dismiss()} // Or focus gender if applicable
                  blurOnSubmit={false}
                  editable={!isLoading}
                />

                <GenderSelector
                  label={Strings.SIGNUP_GENDER_LABEL}
                  options={GENDER_OPTIONS}
                  selectedValue={gender}
                  onSelect={setGender}
                  disabled={isLoading}
                  onSelectionComplete={() => emailInputRef.current?.focus()}
                />

                <AuthTextInput
                  label={Strings.SIGNUP_EMAIL_LABEL}
                  icon={faEnvelope}
                  inputRef={emailInputRef}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={Strings.SIGNUP_EMAIL_PLACEHOLDER}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isLoading}
                />

                <AuthTextInput
                  label={Strings.SIGNUP_PASSWORD_LABEL}
                  icon={faLock}
                  inputRef={passwordInputRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={Strings.SIGNUP_PASSWORD_PLACEHOLDER}
                  secureTextEntry
                  returnKeyType="go"
                  onSubmitEditing={handleProceedToNextStep}
                  editable={!isLoading}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleProceedToNextStep}
                  disabled={isLoading}
                  activeOpacity={0.75}>
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.LOADER_COLOR_PRIMARY}
                    />
                  ) : (
                    <Text style={styles.createButtonText}>
                      {Strings.SIGNUP_PROCEED_BUTTON || 'Next Step'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>
                    {Strings.SIGNUP_ALREADY_HAVE_ACCOUNT}
                  </Text>
                  <TouchableOpacity
                    onPress={navigateToLogin}
                    disabled={isLoading}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.linkText}>
                      {Strings.SIGNUP_LOGIN_LINK}
                    </Text>
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
  safeArea: {flex: 1, backgroundColor: Colors.BACKGROUND_COLOR},
  keyboardAvoidingView: {flex: 1},
  scrollContainer: {flexGrow: 1, justifyContent: 'center'},
  innerContainer: {
    paddingHorizontal: Dimens.SCREEN_PADDING_HORIZONTAL,
    paddingVertical: Dimens.SCREEN_PADDING_VERTICAL,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Dimens.HEADER_CONTAINER_MARGIN_BOTTOM,
  },
  title: {
    fontSize: Dimens.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: Colors.TEXT_COLOR_PRIMARY,
    textAlign: 'center',
    marginBottom: Dimens.LABEL_MARGIN_BOTTOM,
  },
  subtitle: {
    fontSize: Dimens.FONT_SIZE_SUBTITLE,
    color: Colors.TEXT_COLOR_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {},
  avatarPickerStyle: {
    marginBottom: Dimens.MARGIN_MEDIUM,
  },
  avatarHelperText: {
    fontSize: Dimens.FONT_SIZE_HELPER,
    color: Colors.TEXT_COLOR_SECONDARY,
    marginTop: -(Dimens.MARGIN_SMALL || 5), // Adjust to pull up slightly
    marginBottom: Dimens.INPUT_GROUP_MARGIN_BOTTOM,
    textAlign: 'center',
  },
  errorContainer: {
    marginVertical: Dimens.ERROR_CONTAINER_MARGIN_VERTICAL,
    paddingHorizontal: Dimens.ERROR_CONTAINER_PADDING_HORIZONTAL,
    paddingVertical: Dimens.ERROR_CONTAINER_PADDING_VERTICAL,
    backgroundColor: Colors.ERROR_COLOR_BACKGROUND,
    borderColor: Colors.ERROR_COLOR_BORDER,
    borderWidth: Dimens.BORDER_WIDTH_ERROR,
    borderRadius: Dimens.BORDER_RADIUS_ERROR,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.ERROR_COLOR_TEXT,
    fontSize: Dimens.FONT_SIZE_ERROR,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {marginTop: Dimens.ACTIONS_CONTAINER_MARGIN_TOP},
  createButton: {
    backgroundColor: Colors.BUTTON_PRIMARY_BACKGROUND,
    paddingVertical: 15,
    borderRadius: Dimens.BORDER_RADIUS_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Dimens.BUTTON_MIN_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: Dimens.SHADOW_OPACITY_BUTTON,
    shadowRadius: Dimens.SHADOW_RADIUS_BUTTON,
    elevation: Dimens.ELEVATION_BUTTON,
  },
  createButtonText: {
    color: Colors.BUTTON_PRIMARY_TEXT,
    fontWeight: 'bold',
    fontSize: Dimens.FONT_SIZE_BUTTON,
  },
  buttonDisabled: {
    backgroundColor: Colors.BUTTON_DISABLED_BACKGROUND,
    shadowOpacity: 0,
    elevation: 0,
  },
  footerContainer: {
    marginTop: Dimens.FOOTER_CONTAINER_MARGIN_TOP,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.TEXT_COLOR_SECONDARY,
    fontSize: Dimens.FONT_SIZE_FOOTER,
  },
  linkText: {
    color: Colors.LINK_TEXT_COLOR,
    fontWeight: 'bold',
    fontSize: Dimens.FONT_SIZE_LINK,
    marginLeft: 5,
  },
});

export default SignupScreen;
