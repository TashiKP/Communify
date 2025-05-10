// src/components/ParentalControls.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TextInput,
  Switch,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faSave,
  faUndo,
  faLock,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as KeychainService from '../services/keychainService'; // Adjust path
import { useTranslation } from 'react-i18next'; // Import i18next hook

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path
// --- Import Typography Utility ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path

// --- Import Local Types & Components ---
import { ParentalSettingsData, AsdLevel, DayOfWeek } from './parental/types'; // Ensure this path is correct
// Ensure these paths are correct and components are ready to accept 't' prop
import ContentFilteringSection from './parental/ContentFilteringSection';
import ScreenTimeSection from './parental/ScreenTimeSection';
import ChildProfileSection from './parental/ChildProfileSection';
import SecuritySection from './parental/SecuritySection';
import UsageReportingSection from './parental/UsageReportingSection';

// --- Props Interface ---
interface ParentalControlsProps {
  onClose: () => void;
  initialSettings: ParentalSettingsData;
  onSave: (settings: ParentalSettingsData) => Promise<void>;
}

// --- Default Settings ---
const defaultSettings: ParentalSettingsData = {
  blockViolence: false,
  blockInappropriate: false,
  dailyLimitHours: '',
  asdLevel: null,
  downtimeEnabled: false,
  downtimeDays: [],
  downtimeStart: '21:00',
  downtimeEnd: '07:00',
  requirePasscode: false,
  notifyEmails: [],
};

// --- Utility Functions ---
const formatTime = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};
const parseTime = (timeString: string): Date => {
  const p = timeString?.split(':');
  const h = parseInt(p?.[0] ?? '0', 10);
  const m = parseInt(p?.[1] ?? '0', 10);
  const d = new Date();
  if (!isNaN(h) && !isNaN(m)) d.setHours(h, m, 0, 0);
  else d.setHours(0, 0, 0, 0);
  return d;
};
const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const ParentalControls: React.FC<ParentalControlsProps> = ({ onClose, initialSettings, onSave }) => {
  // --- Hooks ---
  const { theme, fonts, isLoadingAppearance } = useAppearance();
  const { t, i18n } = useTranslation(); // Get t function and i18n instance

  // --- Dynamic Styles ---
  const styles = useMemo(
    () => createThemedStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language]
  );
  const switchStyles = useMemo(
    () => ({
      trackColor: { false: theme.disabled, true: theme.secondary },
      thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
      ios_backgroundColor: theme.disabled,
    }),
    [theme]
  );

  // --- State ---
  const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(() => ({
    ...defaultSettings,
    ...initialSettings,
  }));
  const [originalSettings, setOriginalSettings] = useState<ParentalSettingsData>(() => ({
    ...defaultSettings,
    ...initialSettings,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
  const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());
  const [showAddEmailInput, setShowAddEmailInput] = useState(false);
  const [newNotifyEmail, setNewNotifyEmail] = useState('');
  const [passcodeExists, setPasscodeExists] = useState(false);
  const [isLoadingPasscodeStatus, setIsLoadingPasscodeStatus] = useState(true);
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);

  // --- Refs ---
  const newPasscodeRef = useRef<TextInput>(null);
  const confirmPasscodeRef = useRef<TextInput>(null);
  const currentPasscodeRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  // --- Memoize ---
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(localSettings) !== JSON.stringify(originalSettings),
    [localSettings, originalSettings]
  );

  // --- Function to check passcode status ---
  const checkPasscodeStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoadingPasscodeStatus(true);
    console.log('ParentalControls: Checking keychain status...');
    try {
      const exists = await KeychainService.hasPasscode();
      if (isMountedRef.current) {
        setPasscodeExists(exists);
        console.log('ParentalControls: Keychain check complete. Passcode exists:', exists);
      }
    } catch (error) {
      console.error('ParentalControls: Failed to check passcode status:', error);
      if (isMountedRef.current) setPasscodeExists(false);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingPasscodeStatus(false);
        console.log('ParentalControls: Keychain check: Set loading false.');
      }
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    console.log('ParentalControls.tsx: Mounted. typeof t =', typeof t, 'i18n initialized:', i18n.isInitialized);
    return () => {
      isMountedRef.current = false;
    };
  }, [t, i18n.isInitialized]);

  useEffect(() => {
    console.log('ParentalControls: Initializing state from props.');
    const mergedInitial = { ...defaultSettings, ...initialSettings };
    setLocalSettings(mergedInitial);
    setOriginalSettings(mergedInitial);
    setShowTimePicker(false);
    setShowAddEmailInput(false);
    setNewNotifyEmail('');
    setIsSaving(false);
    setShowPasscodeSetup(false);
    setCurrentPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');
    setPasscodeError(null);
    setPasscodeSuccess(null);
  }, [initialSettings]);

  useEffect(() => {
    console.log('ParentalControls: Performing initial passcode status check (ON MOUNT or checkPasscodeStatus change).');
    checkPasscodeStatus();
  }, [checkPasscodeStatus]);

  useEffect(() => {
    if (!isLoadingPasscodeStatus && typeof t === 'function') {
      if (localSettings.requirePasscode && !passcodeExists) {
        console.warn('ParentalControls: requirePasscode ON but no passcode exists. Forcing OFF locally.');
        if (localSettings.requirePasscode) {
          setLocalSettings((prev) => ({ ...prev, requirePasscode: false }));
        }
        if (!showPasscodeSetup) {
          Alert.alert(t('parentalControls.passcodeAlertTitle'), t('parentalControls.passcodeAlertMessage'));
        }
      }
    }
  }, [isLoadingPasscodeStatus, localSettings.requirePasscode, passcodeExists, showPasscodeSetup, t]);

  // --- Handlers ---
  const togglePasscodeSetup = useCallback(() => {
    setShowPasscodeSetup((prev) => {
      const nextState = !prev;
      if (nextState) {
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
        setPasscodeError(null);
        setPasscodeSuccess(null);
        setTimeout(() => {
          if (isMountedRef.current) {
            if (passcodeExists) currentPasscodeRef.current?.focus();
            else newPasscodeRef.current?.focus();
          }
        }, 150);
      } else {
        Keyboard.dismiss();
      }
      return nextState;
    });
  }, [passcodeExists]);

  const handleSettingChange = useCallback(
    <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => {
      if (key === 'requirePasscode' && value === true) {
        if (!passcodeExists) {
          Alert.alert(
            t('parentalControls.passcodeRequiredTitle'),
            t('parentalControls.passcodeRequiredMessage'),
            [{ text: t('common.ok'), onPress: togglePasscodeSetup }]
          );
          return;
        }
      }
      setLocalSettings((prev) => {
        if (key === 'dailyLimitHours') {
          const numericValue = value as string;
          const filteredValue = numericValue.replace(/[^0-9]/g, '');
          const num = parseInt(filteredValue, 10);
          let finalValue: string;
          if (filteredValue === '') finalValue = '';
          else if (!isNaN(num)) {
            if (num === 0) finalValue = '0';
            else if (num > 0 && num <= 24) finalValue = num.toString();
            else if (num > 24) finalValue = '24';
            else finalValue = prev.dailyLimitHours;
          } else finalValue = prev.dailyLimitHours;
          return { ...prev, dailyLimitHours: finalValue };
        }
        return { ...prev, [key]: value };
      });
    },
    [passcodeExists, togglePasscodeSetup, t]
  );

  const handleDowntimeDayToggle = useCallback((day: DayOfWeek) => {
    setLocalSettings((prev) => {
      const days = new Set(prev.downtimeDays);
      if (days.has(day)) days.delete(day);
      else days.add(day);
      return { ...prev, downtimeDays: Array.from(days) };
    });
  }, []);

  const handleReset = () => {
    if (hasUnsavedChanges) {
      Alert.alert(t('parentalControls.resetConfirmTitle'), t('parentalControls.resetConfirmMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => {
            setLocalSettings(originalSettings);
            if (showPasscodeSetup) togglePasscodeSetup();
          },
        },
      ]);
    }
  };

  const handleAttemptClose = useCallback(() => {
    if (hasUnsavedChanges) {
      Alert.alert(t('parentalControls.unsavedChangesTitle'), t('parentalControls.unsavedChangesMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.discard'), style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose, t]);

  const handleSaveChanges = async () => {
    if (
      !hasUnsavedChanges ||
      isSaving ||
      isLoadingPasscodeStatus ||
      isLoadingAppearance
    )
      return;
    if (localSettings.requirePasscode && !passcodeExists) {
      Alert.alert(
        t('parentalControls.errors.saveFailTitle'),
        t('parentalControls.errors.passcodeNotSet')
      );
      if (!showPasscodeSetup) togglePasscodeSetup();
      return;
    }
    if (localSettings.downtimeEnabled && localSettings.downtimeDays.length === 0) {
      Alert.alert(
        t('parentalControls.errors.incompleteDowntimeTitle'),
        t('parentalControls.errors.incompleteDowntimeMessage')
      );
      return;
    }
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setOriginalSettings(localSettings);
      onClose();
    } catch (error) {
      console.error('Error saving parental controls:', error);
      Alert.alert(t('common.error'), t('parentalControls.errors.saveFail'));
      if (isMountedRef.current) setIsSaving(false);
    } finally {
      if (isMountedRef.current && isSaving) setIsSaving(false);
    }
  };

  const showTimePickerModal = useCallback((target: 'start' | 'end') => {
    setTimePickerTarget(target);
    setTimePickerValue(
      parseTime(target === 'start' ? localSettings.downtimeStart : localSettings.downtimeEnd)
    );
    setShowTimePicker(true);
  }, [localSettings.downtimeStart, localSettings.downtimeEnd]);

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || timePickerValue;
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && timePickerTarget) {
      const formattedTime = formatTime(currentDate);
      handleSettingChange(
        timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd',
        formattedTime
      );
      if (Platform.OS === 'ios') setShowTimePicker(false);
      setTimePickerTarget(null);
    } else if (event.type === 'dismissed' || event.type === 'neutralButtonPressed') {
      setShowTimePicker(false);
      setTimePickerTarget(null);
    }
  };

  const handleConfigureApps = useCallback(() =>
    Alert.alert(t('parentalControls.appLimitsTitle'), t('parentalControls.comingSoon')),
    [t]
  );
  const handleConfigureWeb = useCallback(() =>
    Alert.alert(t('parentalControls.webFilteringTitle'), t('parentalControls.comingSoon')),
    [t]
  );

  const handleSetOrUpdatePasscode = useCallback(async () => {
    Keyboard.dismiss();
    setPasscodeError(null);
    setPasscodeSuccess(null);
    if (passcodeExists && !currentPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorEnterCurrent'));
      return;
    }
    if (!newPasscode || newPasscode.length < 4) {
      setPasscodeError(t('parentalControls.passcode.errorNewMinLength'));
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorMismatch'));
      return;
    }
    setIsSettingPasscode(true);
    try {
      if (passcodeExists) {
        const verified = await KeychainService.verifyPasscode(currentPasscode);
        if (!verified) {
          setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent'));
          setIsSettingPasscode(false);
          return;
        }
      }
      const success = await KeychainService.setPasscode(newPasscode);
      if (success) {
        const wasFirstPasscode = !passcodeExists;
        setPasscodeSuccess(t('parentalControls.passcode.successSetUpdate'));
        setPasscodeExists(true);
        setLocalSettings((prev) => ({ ...prev, requirePasscode: true }));
        setTimeout(() => {
          if (isMountedRef.current) {
            togglePasscodeSetup();
            if (wasFirstPasscode) {
              Alert.alert(
                t('parentalControls.passcode.successTitle'),
                t('parentalControls.passcode.successRequireEnabledMessage')
              );
            }
          }
        }, 1500);
      } else {
        setPasscodeError(t('parentalControls.passcode.errorSaveFailed'));
      }
    } catch (error) {
      console.error('Error setting/updating passcode:', error);
      setPasscodeError(t('parentalControls.passcode.errorUnexpected'));
    } finally {
      if (isMountedRef.current) setIsSettingPasscode(false);
    }
  }, [passcodeExists, currentPasscode, newPasscode, confirmPasscode, togglePasscodeSetup, t]);

  const handleRemovePasscodeClick = useCallback(async () => {
    Keyboard.dismiss();
    setPasscodeError(null);
    setPasscodeSuccess(null);
    if (!currentPasscode) {
      setPasscodeError(t('parentalControls.passcode.errorEnterCurrentToRemove'));
      return;
    }
    Alert.alert(
      t('parentalControls.passcode.removeConfirmTitle'),
      t('parentalControls.passcode.removeConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            setIsSettingPasscode(true);
            try {
              const verified = await KeychainService.verifyPasscode(currentPasscode);
              if (!verified) {
                setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent'));
                setIsSettingPasscode(false);
                return;
              }
              const success = await KeychainService.resetPasscode();
              if (success) {
                setPasscodeSuccess(t('parentalControls.passcode.successRemoved'));
                setPasscodeExists(false);
                setLocalSettings((prev) => ({ ...prev, requirePasscode: false }));
                setTimeout(() => {
                  if (isMountedRef.current) {
                    togglePasscodeSetup();
                    Alert.alert(
                      t('parentalControls.passcode.successRemovedTitle'),
                      t('parentalControls.passcode.successRequireDisabledMessage')
                    );
                  }
                }, 1500);
              } else {
                setPasscodeError(t('parentalControls.passcode.errorRemoveFailed'));
              }
            } catch (error) {
              console.error('Error removing passcode:', error);
              setPasscodeError(t('parentalControls.passcode.errorUnexpected'));
            } finally {
              if (isMountedRef.current) setIsSettingPasscode(false);
            }
          },
        },
      ]
    );
  }, [currentPasscode, togglePasscodeSetup, t]);

  const toggleAddEmailInput = useCallback(() => {
    setShowAddEmailInput((prev) => !prev);
    setNewNotifyEmail('');
    if (showAddEmailInput) Keyboard.dismiss();
  }, [showAddEmailInput]);

  const handleAddNotifyEmail = useCallback(() => {
    const trimmedEmail = newNotifyEmail.trim();
    if (!trimmedEmail) return;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert(t('parentalControls.errors.invalidEmail'));
      return;
    }
    const lowerCaseEmail = trimmedEmail.toLowerCase();
    if (localSettings.notifyEmails.some((email) => email.toLowerCase() === lowerCaseEmail)) {
      Alert.alert(t('parentalControls.errors.duplicateEmail'));
      return;
    }
    handleSettingChange('notifyEmails', [...localSettings.notifyEmails, trimmedEmail]);
    setNewNotifyEmail('');
    setShowAddEmailInput(false);
    Keyboard.dismiss();
  }, [newNotifyEmail, localSettings.notifyEmails, handleSettingChange, t]);

  const handleDeleteNotifyEmail = useCallback(
    (emailToDelete: string) => {
      handleSettingChange('notifyEmails', localSettings.notifyEmails.filter((email) => email !== emailToDelete));
    },
    [localSettings.notifyEmails, handleSettingChange]
  );

  // --- Loading/Saving States ---
  const isLoading = isLoadingAppearance || isLoadingPasscodeStatus;
  const isSaveDisabled =
    isSaving ||
    !hasUnsavedChanges ||
    isLoading ||
    isSettingPasscode ||
    (localSettings.requirePasscode && !passcodeExists);
  const isResetDisabled = isSaving || !hasUnsavedChanges || isLoading || isSettingPasscode;

  // --- Render Guard for i18n ---
  if (!i18n.isInitialized || typeof t !== 'function') {
    console.log('ParentalControls: Rendering loading state because t is not ready or i18n not initialized.');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading Interface...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAttemptClose}
            hitSlop={hitSlop}
            accessibilityLabel={t('common.goBack')}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={getLanguageSpecificTextStyle('h2', fonts, i18n.language).fontSize * 0.9}
              color={theme.white}
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('parentalControls.title')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
            onPress={handleSaveChanges}
            disabled={isSaveDisabled}
            hitSlop={hitSlop}
            accessibilityLabel={t('common.saveSettings')}
            accessibilityState={{ disabled: isSaveDisabled }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <FontAwesomeIcon
                icon={faSave}
                size={getLanguageSpecificTextStyle('h2', fonts, i18n.language).fontSize * 0.9}
                color={!isSaveDisabled ? theme.white : theme.disabled}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isLoading && !showPasscodeSetup ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>{t('parentalControls.loading')}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Sections */}
            <ContentFilteringSection
              settings={localSettings}
              onSettingChange={handleSettingChange}
              onConfigureWeb={handleConfigureWeb}
              t={t}
            />
            <ScreenTimeSection
              settings={localSettings}
              onSettingChange={handleSettingChange}
              onDayToggle={handleDowntimeDayToggle}
              onShowTimePicker={showTimePickerModal}
              daysOfWeek={daysOfWeek}
              t={t}
            />
            <ChildProfileSection settings={localSettings} onSettingChange={handleSettingChange} t={t} />
            <UsageReportingSection
              settings={localSettings}
              showAddEmailInput={showAddEmailInput}
              newNotifyEmail={newNotifyEmail}
              onNewEmailChange={setNewNotifyEmail}
              onToggleAddEmail={toggleAddEmailInput}
              onAddEmail={handleAddNotifyEmail}
              onDeleteEmail={handleDeleteNotifyEmail}
              t={t}
            />
            <SecuritySection
              settings={localSettings}
              passcodeExists={passcodeExists}
              onSettingChange={handleSettingChange}
              onTogglePasscodeSetup={togglePasscodeSetup}
              isLoadingPasscodeStatus={isLoadingPasscodeStatus}
              t={t}
            />

            {/* Inline Passcode Setup UI */}
            {showPasscodeSetup && (
              <View style={styles.inlineSetupContainer}>
                <Text style={styles.inlineSetupTitle}>
                  {passcodeExists ? t('parentalControls.passcode.changeTitle') : t('parentalControls.passcode.setTitle')}
                </Text>
                {passcodeExists && (
                  <View style={styles.inputGroupInline}>
                    <Text style={styles.labelInline}>{t('parentalControls.passcode.currentLabel')}</Text>
                    <TextInput
                      ref={currentPasscodeRef}
                      style={styles.inputInline}
                      value={currentPasscode}
                      onChangeText={setCurrentPasscode}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={10}
                      returnKeyType="next"
                      onSubmitEditing={() => newPasscodeRef.current?.focus()}
                      blurOnSubmit={false}
                      autoFocus={true}
                      placeholderTextColor={theme.disabled}
                      selectionColor={theme.primary}
                    />
                  </View>
                )}
                <View style={styles.inputGroupInline}>
                  <Text style={styles.labelInline}>{t('parentalControls.passcode.newLabel')}</Text>
                  <TextInput
                    ref={newPasscodeRef}
                    style={styles.inputInline}
                    value={newPasscode}
                    onChangeText={setNewPasscode}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={10}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasscodeRef.current?.focus()}
                    blurOnSubmit={false}
                    autoFocus={!passcodeExists}
                    placeholderTextColor={theme.disabled}
                    selectionColor={theme.primary}
                  />
                </View>
                <View style={styles.inputGroupInline}>
                  <Text style={styles.labelInline}>{t('parentalControls.passcode.confirmLabel')}</Text>
                  <TextInput
                    ref={confirmPasscodeRef}
                    style={styles.inputInline}
                    value={confirmPasscode}
                    onChangeText={setConfirmPasscode}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={handleSetOrUpdatePasscode}
                    placeholderTextColor={theme.disabled}
                    selectionColor={theme.primary}
                  />
                </View>
                {passcodeError && <Text style={styles.errorTextInline}>{passcodeError}</Text>}
                {passcodeSuccess && <Text style={styles.successTextInline}>{passcodeSuccess}</Text>}
                <View style={styles.inlineButtonRow}>
                  {passcodeExists && (
                    <TouchableOpacity
                      style={[styles.inlineButton, styles.removeButtonInline]}
                      onPress={handleRemovePasscodeClick}
                      disabled={isSettingPasscode}
                      accessibilityLabel={t('common.remove')}
                    >
                      {isSettingPasscode ? (
                        <ActivityIndicator size="small" color={styles.errorTextInline.color} />
                      ) : (
                        <Text style={styles.removeButtonTextInline}>{t('common.remove')}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.inlineButton, styles.cancelButtonInline]}
                    onPress={togglePasscodeSetup}
                    disabled={isSettingPasscode}
                    accessibilityLabel={t('common.cancel')}
                  >
                    <Text style={styles.cancelButtonTextInline}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.inlineButton,
                      styles.saveButtonInline,
                      (isSettingPasscode ||
                        !newPasscode ||
                        newPasscode.length < 4 ||
                        newPasscode !== confirmPasscode ||
                        (passcodeExists && !currentPasscode)) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleSetOrUpdatePasscode}
                    disabled={
                      isSettingPasscode ||
                      !newPasscode ||
                      newPasscode.length < 4 ||
                      newPasscode !== confirmPasscode ||
                      (passcodeExists && !currentPasscode)
                    }
                    accessibilityLabel={passcodeExists ? t('common.update') : t('common.set')}
                  >
                    {isSettingPasscode ? (
                      <ActivityIndicator size="small" color={theme.white} />
                    ) : (
                      <Text style={styles.saveButtonTextInline}>
                        {passcodeExists ? t('common.update') : t('common.set')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={isResetDisabled}
              accessibilityLabel={t('common.resetChanges')}
            >
              <FontAwesomeIcon
                icon={faUndo}
                size={getLanguageSpecificTextStyle('caption', fonts, i18n.language).fontSize * 1.1}
                color={!isResetDisabled ? theme.textSecondary : theme.disabled}
                style={styles.buttonIcon}
              />
              <Text style={[styles.resetButtonText, isResetDisabled && styles.textDisabled]}>
                {t('common.resetChanges')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {showTimePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={timePickerValue}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            textColor={theme.text}
            accentColor={theme.primary}
            themeVariant={theme.isDark ? 'dark' : 'light'}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.primary },
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    scrollContainer: { padding: 15, paddingBottom: 40 },
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    loadingText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      marginTop: 15,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    header: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
    title: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage),
      fontWeight: '600',
      color: theme.white,
      textAlign: 'center',
    },
    headerButton: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    cardIcon: {
      marginRight: 12,
      width: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize,
      textAlign: 'center',
      color: theme.primary,
    },
    sectionTitle: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage, 0.9),
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    cardFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      minHeight: 44,
      paddingHorizontal: 18,
      marginBottom: 15,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      minHeight: 44,
      paddingHorizontal: 18,
      marginBottom: 15,
    },
    featureIcon: {
      marginRight: 18,
      width: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize * 1.1,
      textAlign: 'center',
      color: theme.textSecondary,
    },
    featureLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      color: theme.textSecondary,
      marginRight: 10,
    },
    settingIcon: {
      marginRight: 18,
      width: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize,
      textAlign: 'center',
      color: theme.textSecondary,
    },
    settingLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      color: theme.text,
      marginRight: 10,
    },
    infoText: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'left',
      paddingHorizontal: 5,
    },
    timeInputContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    timeInput: {
      height: 40,
      width: 55,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      backgroundColor: theme.background,
      fontSize: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize,
      color: theme.text,
      textAlign: 'center',
    },
    timeInputLabel: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      marginLeft: 8,
      color: theme.textSecondary,
    },
    fieldLabel: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage),
      color: theme.textSecondary,
      fontWeight: '500',
      marginBottom: 12,
    },
    optionsList: { marginTop: 10, marginBottom: 5, paddingHorizontal: 18, paddingBottom: 10, gap: 10 },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      marginBottom: 10,
    },
    optionCardSelected: { borderColor: theme.primary, backgroundColor: theme.primaryMuted },
    optionIcon: {
      marginRight: 15,
      width: getLanguageSpecificTextStyle('h2', fonts, currentLanguage).fontSize,
      textAlign: 'center',
      color: theme.primary,
    },
    optionLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontWeight: '500',
      color: theme.text,
    },
    optionLabelSelected: { color: theme.primary, fontWeight: 'bold' },
    radioOuter: {
      height: 22,
      width: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    radioOuterSelected: { borderColor: theme.primary },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: theme.primary },
    downtimeDetails: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    daySelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 10, marginBottom: 5, gap: 10 },
    dayButton: {
      minWidth: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1.5,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      backgroundColor: theme.card,
      paddingHorizontal: 5,
    },
    dayButtonSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    dayButtonText: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      fontWeight: '600',
      color: theme.primary,
    },
    dayButtonTextSelected: { color: theme.white },
    timeSelectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 10 },
    timeDisplayBox: {
      minWidth: 90,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    timeDisplayLabel: {
      ...getLanguageSpecificTextStyle('caption', fonts, currentLanguage),
      color: theme.textSecondary,
      marginBottom: 4,
    },
    timeDisplayText: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage),
      fontWeight: '600',
      color: theme.primary,
    },
    timeSeparator: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage),
      color: theme.textSecondary,
      marginHorizontal: 5,
    },
    emailListContainer: { paddingHorizontal: 18, paddingBottom: 10 },
    emailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    emailText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      color: theme.text,
      marginRight: 10,
    },
    deleteEmailButton: { padding: 5 },
    noEmailsText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontStyle: 'italic',
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: 15,
    },
    addEmailContainer: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 15,
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    addEmailInput: {
      flex: 1,
      height: 44,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginRight: 10,
      fontSize: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize,
      backgroundColor: theme.background,
      color: theme.text,
    },
    addEmailConfirmButton: {
      backgroundColor: theme.primary,
      padding: 10,
      height: 44,
      width: 44,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addEmailToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginTop: 15,
    },
    addEmailToggleText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      color: theme.primary,
      fontWeight: '500',
    },
    resetButton: {
      flexDirection: 'row',
      alignSelf: 'center',
      marginTop: 25,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    resetButtonText: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage),
      color: theme.textSecondary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    clearButton: {
      marginTop: 5,
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    clearButtonText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      color: theme.primary,
      fontWeight: '500',
    },
    buttonIcon: { marginRight: 8 },
    buttonDisabled: { opacity: 0.5 },
    textDisabled: { color: theme.disabled, textDecorationLine: 'none' },
    inlineSetupContainer: {
      marginTop: -1,
      paddingTop: 20,
      paddingHorizontal: 18,
      paddingBottom: 20,
      backgroundColor: theme.background,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: theme.border,
      marginBottom: 20,
    },
    inlineSetupTitle: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage),
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 18,
      textAlign: 'center',
    },
    inputGroupInline: { marginBottom: 15 },
    labelInline: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontWeight: '500',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    inputInline: {
      backgroundColor: theme.background,
      height: 46,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: getLanguageSpecificTextStyle('body', fonts, currentLanguage).fontSize,
      color: theme.text,
    },
    errorTextInline: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: '#dc3545',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 10,
      fontWeight: '500',
    },
    successTextInline: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: '#198754',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 10,
      fontWeight: '500',
    },
    inlineButtonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 15,
      gap: 10,
    },
    inlineButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      flexShrink: 1,
      flexGrow: 0,
    },
    saveButtonInline: { backgroundColor: theme.primary, paddingHorizontal: 20 },
    saveButtonTextInline: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: theme.white,
      fontWeight: 'bold',
    },
    removeButtonInline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#dc3545',
      marginRight: 'auto',
    },
    removeButtonTextInline: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: '#dc3545',
      fontWeight: 'bold',
    },
    cancelButtonInline: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    cancelButtonTextInline: {
      ...getLanguageSpecificTextStyle('button', fonts, currentLanguage),
      color: theme.textSecondary,
      fontWeight: '600',
    },
  });

export default ParentalControls;