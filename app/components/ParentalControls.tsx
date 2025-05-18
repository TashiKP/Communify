// src/components/ParentalControls.tsx
import React, {useEffect, useCallback, useMemo, useRef} from 'react';
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
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faUndo} from '@fortawesome/free-solid-svg-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTranslation} from 'react-i18next';
import apiService, {
  handleApiError,
  ParentalSettingsData,
  DayOfWeek,
} from '../services/apiService';
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext'; // Ensure currentLanguage is not expected here
import {getLanguageSpecificTextStyle} from '../styles/typography';

// Child Section Components
import ContentFilteringSection from './ParentalControls/ContentFilteringSection';
import ScreenTimeSection, {
  ReportEventType,
} from './ParentalControls/ScreenTimeSection';
import ChildProfileSection from './ParentalControls/ChildProfileSection';
import SecuritySection from './ParentalControls/SecuritySection';
import UsageReportingSection from './ParentalControls/UsageReportingSection';

// Modular Components & Hooks
import ParentalControlsHeader from './ParentalControls/ParentalControlsHeader';
import PasscodeSetupForm from './ParentalControls/PasscodeSetupForm';
import {useParentalSettings} from '../hooks/useParentalSettings';
import {useParentalPasscode} from '../hooks/useParentalPasscode';
import {useTimePicker} from '../hooks/useTimePicker';
import {useNotifyEmailForm} from '../hooks/useNotifyEmailForm';

interface ParentalControlsProps {
  onClose: () => void;
  initialSettings?: ParentalSettingsData;
  onSaveSuccess?: (savedSettings: ParentalSettingsData) => void;
}

const daysOfWeek: DayOfWeek[] = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];
const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};

const ParentalControls: React.FC<ParentalControlsProps> = ({
  onClose: propOnClose, // Renaming to avoid conflict if wrapped in useCallback
  initialSettings: propInitialSettings,
  onSaveSuccess: propOnSaveSuccess, // Renaming
}) => {
  const {theme, fonts, isLoadingAppearance} = useAppearance();
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage],
  );
  const stableOnClose = useCallback(() => propOnClose(), [propOnClose]);
  const stableOnSaveSuccess = useCallback(
    (settings: ParentalSettingsData) => propOnSaveSuccess?.(settings),
    [propOnSaveSuccess],
  );
  const settingsHookRef = useRef<ReturnType<typeof useParentalSettings> | null>(
    null,
  );
  const stableUpdateRequirePasscodeSetting = useCallback((value: boolean) => {
    settingsHookRef.current?.handleSettingChange('requirePasscode', value);
  }, []);
  const passcodeHook = useParentalPasscode({
    t,
    updateRequirePasscodeSetting: stableUpdateRequirePasscodeSetting,
  });

  const stableOnPromptPasscodeSetup = useCallback(() => {
    passcodeHook.togglePasscodeSetup();
  }, [passcodeHook.togglePasscodeSetup]); // togglePasscodeSetup from hook should be stable

  const settingsHook = useParentalSettings({
    initialSettings: propInitialSettings,
    onSaveSuccess: stableOnSaveSuccess,
    onCloseAfterSave: stableOnClose,
    t,
    isPasscodeSet: passcodeHook.passcodeExists,
    onPromptPasscodeSetup: stableOnPromptPasscodeSetup,
  });

  useEffect(() => {
    settingsHookRef.current = settingsHook;
  }, [settingsHook]);

  const timePickerHook = useTimePicker({
    getStartTime: () => settingsHook.localSettings.downtimeStart,
    getEndTime: () => settingsHook.localSettings.downtimeEnd,
    onTimeSelected: (target, time) =>
      settingsHook.handleSettingChange(
        target as keyof ParentalSettingsData,
        time,
      ),
  });

  const notifyEmailFormHook = useNotifyEmailForm({
    getNotifyEmails: () => settingsHook.localSettings.notifyEmails,
    onEmailsChange: emails =>
      settingsHook.handleSettingChange('notifyEmails', emails),
    t,
  });

  const {fetchSettings} = settingsHook;
  const {checkPasscodeStatus} = passcodeHook;

  // --- Effects ---
  useEffect(() => {
    if (i18n.isInitialized && typeof t === 'function') {
      console.log('ParentalControls: Initializing data fetch...');
      const loadInitialData = async () => {
        await Promise.all([
          fetchSettings(), // fetchSettings from useParentalSettings is now stable
          checkPasscodeStatus(), // checkPasscodeStatus from useParentalPasscode is now stable
        ]);
        console.log('ParentalControls: Initial data fetch complete.');
      };
      loadInitialData();
    }
  }, [i18n.isInitialized, t, fetchSettings, checkPasscodeStatus]); // Dependencies are stable

  useEffect(() => {
    if (
      !passcodeHook.isLoadingPasscodeStatus &&
      !settingsHook.isLoadingApiSettings &&
      i18n.isInitialized &&
      typeof t === 'function'
    ) {
      if (
        settingsHook.localSettings.requirePasscode &&
        !passcodeHook.passcodeExists &&
        !passcodeHook.showPasscodeSetup
      ) {
        Alert.alert(
          t('parentalControls.passcodeAlertTitle'),
          t('parentalControls.passcodeAlertMessage'),
          // [{ text: t('common.ok'), onPress: passcodeHook.togglePasscodeSetup }] // Optional
        );
      }
    }
  }, [
    passcodeHook.isLoadingPasscodeStatus,
    settingsHook.isLoadingApiSettings,
    settingsHook.localSettings.requirePasscode,
    passcodeHook.passcodeExists,
    passcodeHook.showPasscodeSetup,
    t,
    i18n.isInitialized, // Added i18n.isInitialized
  ]);

  // --- Event Handlers ---
  const handleAttemptClose = useCallback(() => {
    if (settingsHook.hasUnsavedChanges) {
      Alert.alert(
        t('parentalControls.unsavedChangesTitle'),
        t('parentalControls.unsavedChangesMessage'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: stableOnClose,
          }, // Use stable callback
        ],
      );
    } else {
      stableOnClose(); // Use stable callback
    }
  }, [settingsHook.hasUnsavedChanges, stableOnClose, t]);

  const handleResetWithConfirmation = useCallback(() => {
    if (settingsHook.hasUnsavedChanges) {
      Alert.alert(
        t('parentalControls.resetConfirmTitle'),
        t('parentalControls.resetConfirmMessage'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('common.reset'),
            style: 'destructive',
            onPress: () => {
              settingsHook.resetSettings();
              if (passcodeHook.showPasscodeSetup)
                passcodeHook.togglePasscodeSetup();
            },
          },
        ],
      );
    } else {
      settingsHook.resetSettings();
      if (passcodeHook.showPasscodeSetup) passcodeHook.togglePasscodeSetup();
    }
  }, [
    settingsHook.hasUnsavedChanges,
    settingsHook.resetSettings,
    passcodeHook.showPasscodeSetup,
    passcodeHook.togglePasscodeSetup,
    t,
  ]);

  const handleSendEmailReport = useCallback(
    async (
      subject: string,
      body: string,
      recipients: string[],
      eventType: ReportEventType,
    ) => {
      if (!recipients || recipients.length === 0) {
        console.log(
          `Email report for ${eventType} not sent: No recipients configured.`,
        );
        return;
      }
      try {
        const response = await apiService.sendParentalControlReportEmail(
          subject,
          body,
          recipients,
          eventType,
        );
        if (response.success)
          console.log(`Email report for ${eventType} sent successfully.`);
        else
          console.error(
            `Failed to send email report for ${eventType}: ${response.message}`,
          );
      } catch (error) {
        console.error(
          `Error in handleSendEmailReport for ${eventType}:`,
          handleApiError(error).message,
        );
      }
    },
    [],
  ); // Empty dependency array as it uses apiService directly

  const handleConfigureApps = useCallback(
    () =>
      Alert.alert(
        t('parentalControls.appLimitsTitle'),
        t('parentalControls.comingSoon'),
      ),
    [t],
  );
  const handleConfigureWeb = useCallback(
    () =>
      Alert.alert(
        t('parentalControls.webFilteringTitle'),
        t('parentalControls.comingSoon'),
      ),
    [t],
  );

  // --- Derived State for UI ---
  const isLoadingAnyInitialData =
    isLoadingAppearance ||
    settingsHook.isLoadingApiSettings ||
    passcodeHook.isLoadingPasscodeStatus;
  const isSaveDisabled =
    settingsHook.isSaving ||
    !settingsHook.hasUnsavedChanges ||
    isLoadingAnyInitialData ||
    passcodeHook.isSettingPasscode ||
    (settingsHook.localSettings.requirePasscode &&
      !passcodeHook.passcodeExists);
  const isResetDisabled =
    settingsHook.isSaving ||
    !settingsHook.hasUnsavedChanges ||
    isLoadingAnyInitialData ||
    passcodeHook.isSettingPasscode;

  // --- Render Logic ---
  if (!i18n.isInitialized || typeof t !== 'function' || isLoadingAppearance) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={[styles.contentArea, styles.centeredContent]}>
          <ActivityIndicator size="large" color={theme.primary || '#0077b6'} />
          <Text style={styles.loadingText}>Loading Interface...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    (settingsHook.isLoadingApiSettings ||
      passcodeHook.isLoadingPasscodeStatus) &&
    !passcodeHook.showPasscodeSetup
  ) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <ParentalControlsHeader
          title={t('parentalControls.title')}
          onClose={handleAttemptClose}
          onSave={() => {
            /* No save action possible while loading */
          }}
          isSaveDisabled={true}
          isSaving={false}
          t={t}
        />
        <View style={[styles.contentArea, styles.centeredContent]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {t('parentalControls.loadingAPI', 'Loading settings...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ParentalControlsHeader
        title={t('parentalControls.title')}
        onClose={handleAttemptClose}
        onSave={settingsHook.saveSettings}
        isSaveDisabled={isSaveDisabled}
        isSaving={settingsHook.isSaving}
        t={t}
      />

      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ContentFilteringSection
          settings={settingsHook.localSettings}
          onSettingChange={settingsHook.handleSettingChange}
          onConfigureWeb={handleConfigureWeb}
          t={t}
          sectionStyle={styles.sectionCard}
          headerStyle={styles.sectionHeader}
          titleStyle={styles.sectionTitle}
          iconStyle={styles.sectionIcon}
        />
        <ScreenTimeSection
          settings={settingsHook.localSettings}
          onSettingChange={settingsHook.handleSettingChange}
          onDayToggle={settingsHook.handleDowntimeDayToggle}
          onShowTimePicker={timePickerHook.showTimePickerModal}
          daysOfWeek={daysOfWeek}
          t={t}
          sendEmailReport={handleSendEmailReport}
          sectionStyle={styles.sectionCard}
          headerStyle={styles.sectionHeader}
          titleStyle={styles.sectionTitle}
          iconStyle={styles.sectionIcon}
        />
        <ChildProfileSection
          settings={settingsHook.localSettings}
          onSettingChange={settingsHook.handleSettingChange}
          t={t}
          sectionStyle={styles.sectionCard}
          headerStyle={styles.sectionHeader}
          titleStyle={styles.sectionTitle}
          iconStyle={styles.sectionIcon}
        />
        <UsageReportingSection
          settings={settingsHook.localSettings}
          showAddEmailInput={notifyEmailFormHook.showAddEmailInput}
          newNotifyEmail={notifyEmailFormHook.newNotifyEmail}
          onNewEmailChange={notifyEmailFormHook.setNewNotifyEmail}
          onToggleAddEmail={notifyEmailFormHook.toggleAddEmailInput}
          onAddEmail={notifyEmailFormHook.handleAddNotifyEmail}
          onDeleteEmail={notifyEmailFormHook.handleDeleteNotifyEmail}
          t={t}
          sectionStyle={styles.sectionCard}
          headerStyle={styles.sectionHeader}
          titleStyle={styles.sectionTitle}
          iconStyle={styles.sectionIcon}
        />
        <SecuritySection
          settings={settingsHook.localSettings}
          passcodeExists={passcodeHook.passcodeExists}
          onSettingChange={settingsHook.handleSettingChange}
          onTogglePasscodeSetup={passcodeHook.togglePasscodeSetup} // Directly use stable hook function
          isLoadingPasscodeStatus={passcodeHook.isLoadingPasscodeStatus}
          t={t}
          sectionStyle={styles.sectionCard}
          headerStyle={styles.sectionHeader}
          titleStyle={styles.sectionTitle}
          iconStyle={styles.sectionIcon}
        />

        {passcodeHook.showPasscodeSetup && (
          <PasscodeSetupForm
            passcodeExists={passcodeHook.passcodeExists}
            currentPasscode={passcodeHook.currentPasscode}
            setCurrentPasscode={passcodeHook.setCurrentPasscode}
            newPasscode={passcodeHook.newPasscode}
            setNewPasscode={passcodeHook.setNewPasscode}
            confirmPasscode={passcodeHook.confirmPasscode}
            setConfirmPasscode={passcodeHook.setConfirmPasscode}
            passcodeError={passcodeHook.passcodeError}
            passcodeSuccess={passcodeHook.passcodeSuccess}
            isSettingPasscode={passcodeHook.isSettingPasscode}
            onSetOrUpdate={passcodeHook.handleSetOrUpdatePasscode}
            onRemove={passcodeHook.handleRemovePasscodeClick}
            onCancel={passcodeHook.togglePasscodeSetup}
            t={t}
          />
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.resetButton,
              isResetDisabled && styles.buttonDisabled,
            ]}
            onPress={handleResetWithConfirmation}
            disabled={isResetDisabled}
            accessibilityLabel={t('common.resetChanges')}
            hitSlop={hitSlop}>
            <FontAwesomeIcon
              icon={faUndo}
              size={(fonts.label || 16) * 0.9}
              color={
                !isResetDisabled
                  ? theme.textSecondary || '#555'
                  : theme.disabled || '#ccc'
              }
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.resetButtonText,
                {
                  color: !isResetDisabled
                    ? theme.textSecondary || '#555'
                    : theme.disabled || '#ccc',
                },
                isResetDisabled && styles.textDisabled,
              ]}>
              {t('common.resetChanges')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {timePickerHook.showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={timePickerHook.timePickerValue}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={timePickerHook.onTimeChange}
          textColor={theme.text}
          accentColor={theme.primary}
          themeVariant={theme.isDark ? 'dark' : 'light'}
        />
      )}
    </SafeAreaView>
  );
};

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
  const labelFontSize = fonts.label || 16;
  const labelStyles = getLanguageSpecificTextStyle(
    'label',
    fonts,
    currentLanguage,
  );
  // const h2FontSize = fonts.h2 || 20; // Not directly used here, ParentalControlsHeader handles its title

  return StyleSheet.create({
    screenContainer: {flex: 1, backgroundColor: theme.primary},
    contentArea: {flex: 1, backgroundColor: theme.background},
    centeredContent: {
      // Added for loading states
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContentContainer: {flexGrow: 1, padding: 15, paddingBottom: 40},
    loadingText: {
      ...bodyStyles,
      color: theme.textSecondary,
      marginTop: 15,
      textAlign: 'center',
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border || '#ddd',
    },
    sectionTitle: {
      fontSize: fonts.label || 16,
      fontWeight: '600',
      color: theme.text || '#000',
      flex: 1,
    },
    sectionIcon: {
      marginRight: 12,
    },
    actionsContainer: {marginTop: 25, alignItems: 'center'},
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    resetButtonText: {
      ...labelStyles,
      fontSize: labelFontSize,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    buttonIcon: {marginRight: 8},
    buttonDisabled: {opacity: 0.5},
    textDisabled: {textDecorationLine: 'none'},
  });
};

export default ParentalControls;
