// src/components/PasscodePromptModal.tsx
import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faLock, faTimes} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';

// --- API Service ---
import apiService, {handleApiError} from '../services/apiService'; // Adjust path

// --- Import Appearance Context ---
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext'; // Adjust path
// --- Import Typography Utility ---
import {getLanguageSpecificTextStyle} from '../styles/typography'; // Adjust path

// --- Local Constant for Error Color ---
const DEDICATED_ERROR_COLOR = '#dc3545';

// --- Component Props ---
interface PasscodePromptModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
}

// --- Component ---
const PasscodePromptModal: React.FC<PasscodePromptModalProps> = ({
  visible,
  onClose,
  onVerified,
}) => {
  const {theme, fonts} = useAppearance();
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage],
  );

  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleVerify = async () => {
    if (!enteredPasscode.trim() || isLoading) return;
    if (isMountedRef.current) setError(null);
    if (isMountedRef.current) setIsLoading(true);
    Keyboard.dismiss();

    try {
      const verificationResult = await apiService.verifyParentalPasscode(
        enteredPasscode,
      );

      if (isMountedRef.current) {
        if (verificationResult.isCorrect) {
          setEnteredPasscode('');
          onVerified();
        } else {
          setError(
            verificationResult.message ||
              t('passcodePrompt.errors.incorrectApi', 'Incorrect passcode.'),
          );
          setEnteredPasscode('');
          inputRef.current?.focus();
        }
      }
    } catch (apiError) {
      console.error('Passcode verification unexpected error:', apiError);
      if (isMountedRef.current) {
        const extractedError = handleApiError(apiError);
        setError(
          extractedError.message ||
            t(
              'passcodePrompt.errors.verificationFailedApi',
              'Verification failed. Please try again.',
            ),
        );
        setEnteredPasscode('');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    setEnteredPasscode('');
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      // Reset state when modal becomes visible, then focus
      if (isMountedRef.current) {
        setEnteredPasscode('');
        setError(null); // This clears any previous error message
        setIsLoading(false);
      }
      const timer = setTimeout(
        () => {
          if (isMountedRef.current) inputRef.current?.focus();
        },
        Platform.OS === 'ios' ? 200 : 300,
      );
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('passcodePrompt.title')}
                </Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.closeButton}
                  accessibilityLabel={t(
                    'passcodePrompt.closeAccessibilityLabel',
                  )}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <FontAwesomeIcon
                    icon={faTimes}
                    size={(fonts.h2 || 20) * 0.9}
                    color={theme.textSecondary || '#555'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.promptText}>
                  {t('passcodePrompt.prompt')}
                </Text>
                <View style={styles.inputWrapper}>
                  <FontAwesomeIcon
                    icon={faLock}
                    size={fonts.body || 16}
                    color={theme.disabled || '#aaa'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={enteredPasscode}
                    onChangeText={setEnteredPasscode}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={10}
                    placeholder={t('passcodePrompt.placeholder')}
                    placeholderTextColor={theme.disabled || '#aaa'}
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                    autoFocus={false}
                    selectionColor={theme.primary || '#007aff'}
                    keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                    blurOnSubmit={false}
                  />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (isLoading || !enteredPasscode.trim()) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleVerify}
                  disabled={isLoading || !enteredPasscode.trim()}
                  accessibilityLabel={t(
                    'passcodePrompt.verifyAccessibilityLabel',
                  )}
                  accessibilityState={{
                    disabled: isLoading || !enteredPasscode.trim(),
                  }}>
                  {isLoading ? (
                    <ActivityIndicator
                      color={theme.white || '#fff'}
                      size="small"
                    />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      {t('passcodePrompt.verifyButton')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) => {
  const h2FontSize = fonts.h2 || 20;
  const bodyFontSize = fonts.body || 16;
  const captionFontSize = fonts.caption || 12;

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.isDark
        ? 'rgba(0, 0, 0, 0.7)'
        : 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 350,
      backgroundColor: theme.card || '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: theme.border || '#444',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border || '#ddd',
      position: 'relative',
      backgroundColor: theme.background || '#f8f8f8',
    },
    modalTitle: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage),
      fontSize: h2FontSize,
      fontWeight: '600',
      color: theme.text || '#000',
      textAlign: 'center',
      flex: 1,
      marginHorizontal: 40,
    },
    closeButton: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 15,
      zIndex: 1,
    },
    modalBody: {
      padding: 25,
    },
    promptText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: bodyFontSize,
      color: theme.textSecondary || '#555',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: bodyFontSize * 1.4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background || '#f0f0f0',
      borderWidth: 1,
      borderColor: theme.border || '#ccc',
      borderRadius: 8,
      height: 50,
      paddingHorizontal: 12,
      marginBottom: 15,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: '100%',
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: bodyFontSize,
      color: theme.text || '#000',
    },
    errorText: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      fontSize: captionFontSize,
      color: DEDICATED_ERROR_COLOR,
      textAlign: 'center',
      marginBottom: 15,
      fontWeight: '500',
    },
    verifyButton: {
      backgroundColor: theme.primary || '#007aff',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    verifyButtonText: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: theme.white || '#fff',
      fontWeight: 'bold',
    },
    buttonDisabled: {
      backgroundColor: theme.disabled || '#ccc',
      opacity: 0.7,
    },
  });
};
export default PasscodePromptModal;
