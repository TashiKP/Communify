import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
  ScrollView,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPaperPlane, faTimes} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';

// --- Import Appearance Context ---
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext';

// --- Import Typography Utility ---
import {getLanguageSpecificTextStyle} from '../styles/typography';

// --- Props ---
interface KeyboardInputProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  placeholder?: string;
}

// --- Component ---
const KeyboardInputComponent: React.FC<KeyboardInputProps> = ({
  visible,
  onClose,
  onSubmit,
  placeholder,
}) => {
  // --- Hooks ---
  const {theme, fonts} = useAppearance();
  const {t, i18n} = useTranslation();

  // --- Dynamic Styles ---
  const styles = useMemo(
    () => createThemedStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language],
  );

  // --- State ---
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textInputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) textInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      if (isMountedRef.current) {
        setInputText('');
        setSuggestions([]);
      }
    }
  }, [visible]);

  // --- Placeholder Suggestion Logic ---
  useEffect(() => {
    if (!inputText.trim()) {
      setSuggestions([]);
      return;
    }
    const words = inputText.trimEnd().split(' ');
    const currentWord = words[words.length - 1].toLowerCase();

    if (currentWord.length > 0) {
      const dummySuggestions = [
        'hello',
        'world',
        'react',
        'native',
        'keyboard',
        'component',
        'awesome',
        'test',
        'suggestion',
      ]
        .filter(s => s.startsWith(currentWord))
        .slice(0, 7);
      setSuggestions(dummySuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputText]);

  const handleSubmit = () => {
    const trimmedText = inputText.trim();
    if (trimmedText) {
      onSubmit(trimmedText);
      if (isMountedRef.current) {
        setInputText('');
        setSuggestions([]);
      }
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    const words = inputText.trimRight().split(' ');
    words[words.length - 1] = suggestion;
    const newText = words.join(' ') + ' ';
    setInputText(newText);
    textInputRef.current?.focus();
    setSuggestions([]);
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isSendActive = inputText.trim().length > 0;
  const inputPlaceholder = placeholder || t('keyboardInput.defaultPlaceholder');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress} accessible={false}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingContainer}
            keyboardVerticalOffset={0}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={styles.container}>
                {suggestions.length > 0 && (
                  <View style={styles.recommendationBar}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyboardShouldPersistTaps="always">
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={`${suggestion}-${index}`}
                          style={styles.suggestionButton}
                          onPress={() => handleSuggestionPress(suggestion)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'keyboardInput.suggestionAccessibilityLabel',
                            {suggestion},
                          )}>
                          <Text
                            style={[
                              styles.suggestionText,
                              {color: theme.textSecondary},
                            ]}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TextInput
                    ref={textInputRef}
                    style={[
                      styles.inputField,
                      {color: theme.text, borderColor: theme.border},
                    ]}
                    placeholder={inputPlaceholder}
                    placeholderTextColor={theme.disabled}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    blurOnSubmit={false}
                    selectionColor={theme.primary}
                    underlineColorAndroid="transparent"
                    accessibilityLabel={t(
                      'keyboardInput.inputAccessibilityLabel',
                    )}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !isSendActive && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isSendActive}
                    activeOpacity={0.7}
                    accessibilityLabel={t(
                      'keyboardInput.sendAccessibilityLabel',
                    )}
                    accessibilityRole="button"
                    accessibilityState={{disabled: !isSendActive}}>
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      size={fonts.body * 1.1}
                      color={theme.white}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  const bodyStyles = getLanguageSpecificTextStyle(
    'body',
    fonts,
    currentLanguage,
  );

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.15)',
      justifyContent: 'flex-end',
    },
    keyboardAvoidingContainer: {
      width: '100%',
    },
    container: {
      backgroundColor: theme.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      padding: 18,
    },
    recommendationBar: {
      height: 40,
      paddingHorizontal: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    suggestionButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      marginRight: 10,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 32,
    },
    suggestionText: {
      ...bodyStyles,
      fontWeight: '400',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    inputField: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      backgroundColor: theme.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      ...bodyStyles,
      fontWeight: '400',
      marginRight: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    sendButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 3,
    },
    sendButtonDisabled: {
      backgroundColor: theme.disabled,
      opacity: 0.6,
    },
  });
};

export default KeyboardInputComponent;
