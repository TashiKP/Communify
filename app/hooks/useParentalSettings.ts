// src/hooks/useParentalSettings.ts
import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {Alert} from 'react-native';
import apiService, {
  handleApiError,
  ParentalSettingsData,
  DayOfWeek,
} from '../services/apiService'; // Adjust path
import {TFunction} from 'i18next';

const defaultSettings: ParentalSettingsData = {
  asdLevel: null,
  blockInappropriate: false,
  blockViolence: false,
  dailyLimitHours: '',
  dataSharingPreference: false,
  downtimeDays: [],
  downtimeEnabled: false,
  downtimeEnd: '07:00',
  downtimeStart: '21:00',
  notifyEmails: [],
  requirePasscode: false,
};

interface UseParentalSettingsProps {
  initialSettings?: ParentalSettingsData; // From component props, if any
  onSaveSuccess?: (savedSettings: ParentalSettingsData) => void;
  onCloseAfterSave?: () => void;
  t: TFunction;
  isPasscodeSet: boolean; // Derived from useParentalPasscode hook
  onPromptPasscodeSetup: () => void; // Callback to trigger passcode UI
}

export const useParentalSettings = ({
  initialSettings: propInitialSettings,
  onSaveSuccess,
  onCloseAfterSave,
  t,
  isPasscodeSet,
  onPromptPasscodeSetup,
}: UseParentalSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(
    () => ({
      ...defaultSettings,
      ...(propInitialSettings || {}), // Prioritize prop initial settings if provided
    }),
  );
  const [originalSettings, setOriginalSettings] =
    useState<ParentalSettingsData>(() => ({
      ...defaultSettings,
      ...(propInitialSettings || {}),
    }));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingApiSettings, setIsLoadingApiSettings] = useState(true); // True initially
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Runs once on mount and cleanup on unmount

  const fetchSettings = useCallback(async () => {
    if (!isMountedRef.current) return;
    console.log('useParentalSettings: Fetching API settings...');
    setIsLoadingApiSettings(true);
    try {
      const fetchedSettings = await apiService.fetchParentalSettings();
      if (isMountedRef.current) {
        const merged = {...defaultSettings, ...fetchedSettings};
        setLocalSettings(merged);
        setOriginalSettings(merged);
        console.log('useParentalSettings: API settings fetched successfully.');
      }
    } catch (error) {
      console.error('useParentalSettings: Failed to fetch settings:', error);
      if (isMountedRef.current) {
        Alert.alert(t('common.error'), t('parentalControls.errors.fetchFail'));
        // Fallback to prop initial settings or defaults if API fails
        const fallback = {...defaultSettings, ...(propInitialSettings || {})};
        setLocalSettings(fallback);
        setOriginalSettings(fallback);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingApiSettings(false);
      }
    }
  }, [t, propInitialSettings]); // `propInitialSettings` should be stable. `t` from useTranslation is stable.

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(localSettings) !== JSON.stringify(originalSettings),
    [localSettings, originalSettings],
  );

  const handleSettingChange = useCallback(
    <K extends keyof ParentalSettingsData>(
      key: K,
      value: ParentalSettingsData[K],
    ) => {
      if (key === 'requirePasscode' && value === true && !isPasscodeSet) {
        Alert.alert(
          t('parentalControls.passcodeRequiredTitle'),
          t('parentalControls.passcodeRequiredMessageToEnable'),
          [{text: t('common.ok'), onPress: onPromptPasscodeSetup}],
        );
        // Do not update localSettings.requirePasscode here, let the passcode setup flow handle it
        // or if it's just a toggle, ensure passcode setup is forced.
        return;
      }
      setLocalSettings(prev => {
        if (key === 'dailyLimitHours') {
          const numericValue = String(value);
          const filteredValue = numericValue.replace(/[^0-9.]/g, ''); // Allow dot for decimal
          // Further validation for float might be needed if you allow e.g. "2.5"
          const num = parseFloat(filteredValue); // Use parseFloat if decimals are allowed
          let finalValue: string;

          if (filteredValue === '' || filteredValue === '.') {
            finalValue = filteredValue; // Allow empty or just a dot temporarily
          } else if (!isNaN(num)) {
            if (num >= 0 && num <= 24) {
              // Allow up to one decimal place, for example
              const parts = filteredValue.split('.');
              if (parts.length > 1 && parts[1].length > 1) {
                finalValue = prev.dailyLimitHours; // Or trim to one decimal
              } else {
                finalValue = filteredValue;
              }
            } else {
              finalValue = num > 24 ? '24' : prev.dailyLimitHours;
            }
          } else {
            finalValue = prev.dailyLimitHours;
          }
          return {...prev, dailyLimitHours: finalValue};
        }
        return {...prev, [key]: value};
      });
    },
    [isPasscodeSet, onPromptPasscodeSetup, t], // These dependencies should be stable or handled by the parent.
  );

  const handleDowntimeDayToggle = useCallback((day: DayOfWeek) => {
    setLocalSettings(prev => ({
      ...prev,
      downtimeDays: prev.downtimeDays.includes(day)
        ? prev.downtimeDays.filter(d => d !== day)
        : [...prev.downtimeDays, day],
    }));
  }, []); // No external dependencies, stable.

  const saveSettings = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) {
      console.log('useParentalSettings: Save skipped.', {
        hasUnsavedChanges,
        isSaving,
      });
      return false;
    }

    if (localSettings.requirePasscode && !isPasscodeSet) {
      Alert.alert(
        t('parentalControls.errors.saveFailTitle'),
        t('parentalControls.errors.passcodeNotSet'),
      );
      onPromptPasscodeSetup(); // Ensure this callback is stable from the parent
      return false;
    }
    if (
      localSettings.downtimeEnabled &&
      localSettings.downtimeDays.length === 0
    ) {
      Alert.alert(
        t('parentalControls.errors.incompleteDowntimeTitle'),
        t('parentalControls.errors.incompleteDowntimeMessage'),
      );
      return false;
    }

    console.log('useParentalSettings: Attempting to save settings...');
    setIsSaving(true);
    try {
      const savedFromApi = await apiService.saveParentalSettings(localSettings);
      if (isMountedRef.current) {
        const merged = {...defaultSettings, ...savedFromApi};
        setOriginalSettings(merged);
        setLocalSettings(merged);
        onSaveSuccess?.(merged);
        Alert.alert(
          t('parentalControls.saveSuccessTitle'),
          t('parentalControls.saveSuccessMessage'),
        );
        onCloseAfterSave?.();
        console.log('useParentalSettings: Settings saved successfully.');
        return true;
      }
    } catch (error) {
      console.error('useParentalSettings: Error saving settings:', error);
      if (isMountedRef.current) {
        const extracted = handleApiError(error);
        Alert.alert(
          t('common.error'),
          t('parentalControls.errors.saveApiFailWithMessage', {
            message: extracted.message,
          }),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
    return false;
  }, [
    hasUnsavedChanges,
    isSaving,
    localSettings, // This changes, making saveSettings regenerate, which is fine.
    isPasscodeSet,
    onPromptPasscodeSetup, // Should be stable
    t, // Stable
    onSaveSuccess, // Should be stable
    onCloseAfterSave, // Should be stable
  ]);

  const resetSettings = useCallback(() => {
    console.log('useParentalSettings: Resetting settings to original.');
    setLocalSettings(originalSettings);
  }, [originalSettings]); // `originalSettings` changes only after a successful fetch/save.

  return {
    localSettings,
    // setLocalSettings, // Typically not exposed; prefer dedicated handlers.
    originalSettings,
    isLoadingApiSettings,
    isSaving,
    hasUnsavedChanges,
    fetchSettings, // Stable
    handleSettingChange, // Stable
    handleDowntimeDayToggle, // Stable
    saveSettings, // Regenerates if localSettings changes, which is expected for a save action.
    resetSettings, // Stable (depends on originalSettings which is state)
  };
};
