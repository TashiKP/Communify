// src/components/ParentalControls/PasscodeSetupForm.tsx
import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { FontSizes, ThemeColors, useAppearance } from '../../context/AppearanceContext'; // Adjust path
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next'; // <--- CORRECTED IMPORT

const ERROR_COLOR_HEX = '#dc3545';
const SUCCESS_COLOR_HEX = '#198754';

interface PasscodeSetupFormProps {
  // ... props remain the same
  passcodeExists: boolean;
  currentPasscode: string;
  setCurrentPasscode: (value: string) => void;
  newPasscode: string;
  setNewPasscode: (value: string) => void;
  confirmPasscode: string;
  setConfirmPasscode: (value: string) => void;
  passcodeError: string | null;
  passcodeSuccess: string | null;
  isSettingPasscode: boolean;
  onSetOrUpdate: () => void;
  onRemove?: () => void;
  onCancel: () => void;
  t: TFunction;
}

const PasscodeSetupForm: React.FC<PasscodeSetupFormProps> = ({
  passcodeExists,
  currentPasscode,
  setCurrentPasscode,
  newPasscode,
  setNewPasscode,
  confirmPasscode,
  setConfirmPasscode,
  passcodeError,
  passcodeSuccess,
  isSettingPasscode,
  onSetOrUpdate,
  onRemove,
  onCancel,
  t,
}) => {
  const { theme, fonts } = useAppearance();
  const { i18n } = useTranslation(); // This hook is now correctly imported
  const currentLanguage = i18n.language;

  const styles = React.useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [
    theme,
    fonts,
    currentLanguage,
  ]);

  const currentPasscodeRef = useRef<TextInput>(null);
  const newPasscodeRef = useRef<TextInput>(null);
  const confirmPasscodeRef = useRef<TextInput>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (passcodeExists) currentPasscodeRef.current?.focus();
        else newPasscodeRef.current?.focus();
    }, 150)
    return () => clearTimeout(timer);
  }, [passcodeExists]);

  const isSaveOrUpdateButtonDisabled =
    isSettingPasscode ||
    !newPasscode ||
    newPasscode.length < 4 ||
    newPasscode !== confirmPasscode ||
    (passcodeExists && !currentPasscode);
  // ... rest of the component remains the same
  return (
    <View style={styles.passcodeSetupCard}>
      <Text style={styles.passcodeSetupTitle}>
        {passcodeExists ? t('parentalControls.passcode.changeTitle') : t('parentalControls.passcode.setTitle')}
      </Text>
      {passcodeExists && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('parentalControls.passcode.currentLabel')}</Text>
          <TextInput
            ref={currentPasscodeRef}
            style={styles.textInput}
            value={currentPasscode}
            onChangeText={setCurrentPasscode}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={10}
            returnKeyType="next"
            onSubmitEditing={() => newPasscodeRef.current?.focus()}
            blurOnSubmit={false}
            placeholderTextColor={theme.disabled}
            selectionColor={theme.primary}
          />
        </View>
      )}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('parentalControls.passcode.newLabel')}</Text>
        <TextInput
          ref={newPasscodeRef}
          style={styles.textInput}
          value={newPasscode}
          onChangeText={setNewPasscode}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={10}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasscodeRef.current?.focus()}
          blurOnSubmit={false}
          placeholderTextColor={theme.disabled}
          selectionColor={theme.primary}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('parentalControls.passcode.confirmLabel')}</Text>
        <TextInput
          ref={confirmPasscodeRef}
          style={styles.textInput}
          value={confirmPasscode}
          onChangeText={setConfirmPasscode}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={10}
          returnKeyType="done"
          onSubmitEditing={onSetOrUpdate}
          placeholderTextColor={theme.disabled}
          selectionColor={theme.primary}
        />
      </View>
      {passcodeError && <Text style={styles.passcodeFeedbackError}>{passcodeError}</Text>}
      {passcodeSuccess && <Text style={styles.passcodeFeedbackSuccess}>{passcodeSuccess}</Text>}
      <View style={styles.passcodeActionsRow}>
        {passcodeExists && onRemove && (
          <TouchableOpacity
            style={[styles.passcodeActionButton, styles.removeButton]}
            onPress={onRemove}
            disabled={isSettingPasscode}
            accessibilityLabel={t('common.remove')}
          >
            {isSettingPasscode && currentPasscode ? (
              <ActivityIndicator size="small" color={ERROR_COLOR_HEX} />
            ) : (
              <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.passcodeActionButton, styles.cancelButton]}
          onPress={() => { Keyboard.dismiss(); onCancel(); }}
          disabled={isSettingPasscode}
          accessibilityLabel={t('common.cancel')}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.passcodeActionButton,
            styles.saveButton,
            isSaveOrUpdateButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={onSetOrUpdate}
          disabled={isSaveOrUpdateButtonDisabled}
          accessibilityLabel={passcodeExists ? t('common.update') : t('common.set')}
        >
          {isSettingPasscode && (newPasscode && confirmPasscode) ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {passcodeExists ? t('common.update') : t('common.set')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
  const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);
  const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
  const buttonTextStyles = getLanguageSpecificTextStyle('button', fonts, currentLanguage);
  const labelFontSize = fonts.label || 16;

  return StyleSheet.create({
    passcodeSetupCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.35 : 0.15,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: theme.border,
    },
    passcodeSetupTitle: {
      ...labelStyles,
      fontSize: labelFontSize,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 25,
      textAlign: 'center',
    },
    inputGroup: { marginBottom: 18 },
    inputLabel: { ...captionStyles, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 },
    textInput: {
      ...bodyStyles,
      backgroundColor:  theme.background,
      height: 48,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      color: theme.text,
    },
    passcodeFeedbackError: {
      ...captionStyles,
      color: ERROR_COLOR_HEX,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 12,
      fontWeight: '500',
    },
    passcodeFeedbackSuccess: {
      ...captionStyles,
      color: SUCCESS_COLOR_HEX,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 12,
      fontWeight: '500',
    },
    passcodeActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10, alignItems: 'center' },
    passcodeActionButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      flexShrink: 1,
    },
    saveButton: { backgroundColor: theme.primary, paddingHorizontal: 20 },
    saveButtonText: { ...buttonTextStyles, color: theme.white, fontWeight: 'bold' },
    removeButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: ERROR_COLOR_HEX, marginRight: 'auto' },
    removeButtonText: { ...buttonTextStyles, color: ERROR_COLOR_HEX, fontWeight: 'bold' },
    cancelButton: { backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.border },
    cancelButtonText: { ...buttonTextStyles, color: theme.textSecondary, fontWeight: '600' },
    buttonDisabled: { opacity: 0.5 },
  });
};


export default PasscodeSetupForm;