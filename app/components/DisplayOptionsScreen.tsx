import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import apiService, {
  handleApiError,
  AppearanceSettingsRead,
  AppearanceSettingsUpdatePayload,
} from '../services/apiService';
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance } from '../context/AppearanceContext';
import Header from './DisplayOptions/Header';
import LayoutSection from './DisplayOptions/LayoutSection';
import AppearanceSection from './DisplayOptions/AppearanceSection';
import TextSizeSection from './DisplayOptions/TextSizeSection';
import ActionsSection from './DisplayOptions/ActionsSection';


export interface DisplayScreenSettings {
  brightness: number;
  textSize: 'small' | 'medium' | 'large';
  darkModeEnabled: boolean;
  contrastMode: 'default' | 'high-contrast-light' | 'high-contrast-dark';
}

interface DisplayOptionsScreenProps {
  onClose: () => void;
}

const defaultScreenSettings: DisplayScreenSettings = {
  brightness: 50,
  textSize: 'medium',
  darkModeEnabled: false,
  contrastMode: 'default',
};

const DisplayOptionsScreen: React.FC<DisplayOptionsScreenProps> = ({ onClose }) => {
  const { gridLayout, setGridLayout, isLoadingLayout } = useGrid();
  const {
    settings: contextAppearanceSettings,
    theme,
    fonts,
    isLoadingAppearance,
    updateAppearanceSetting,
  } = useAppearance();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const [localSettings, setLocalSettings] = useState<DisplayScreenSettings>(defaultScreenSettings);
  const [originalSettingsFromApi, setOriginalSettingsFromApi] = useState<DisplayScreenSettings>(
    defaultScreenSettings
  );
  const [isBrightnessLocked, setIsBrightnessLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!isMountedRef.current || typeof t !== 'function') return;
      setIsLoadingApi(true);
      try {
        const apiSettings: AppearanceSettingsRead = await apiService.fetchAppearanceSettings();
        if (isMountedRef.current) {
          const fetchedDisplaySettings: DisplayScreenSettings = {
            brightness: apiSettings.brightness ?? defaultScreenSettings.brightness,
            textSize: (apiSettings.fontSize as DisplayScreenSettings['textSize']) ?? defaultScreenSettings.textSize,
            darkModeEnabled: apiSettings.darkModeEnabled ?? defaultScreenSettings.darkModeEnabled,
            contrastMode: (apiSettings.contrastMode as DisplayScreenSettings['contrastMode']) ?? defaultScreenSettings.contrastMode,
          };
          setLocalSettings(fetchedDisplaySettings);
          setOriginalSettingsFromApi(fetchedDisplaySettings);
        }
      } catch (error) {
        const errorInfo = handleApiError(error);
        console.error('DisplayOptionsScreen: Failed to fetch appearance settings:', errorInfo.message);
        if (isMountedRef.current)
          Alert.alert(
            t('common.error', 'Error'),
            t('displayOptions.errors.fetchFailApi', { message: errorInfo.message })
          );
        const fallbackSettings = {
          brightness: contextAppearanceSettings.brightness,
          textSize: contextAppearanceSettings.textSize,
          darkModeEnabled: contextAppearanceSettings.darkModeEnabled,
          contrastMode: contextAppearanceSettings.contrastMode,
        };
        setLocalSettings(fallbackSettings);
        setOriginalSettingsFromApi(fallbackSettings);
      } finally {
        if (isMountedRef.current) setIsLoadingApi(false);
      }
    };
    if (typeof t === 'function' && i18n.isInitialized) fetchSettings();
  }, [t, i18n.isInitialized]);

  const hasChanged = useMemo(
    () => {
      if (isLoadingApi || isLoadingAppearance) return false;
      return (
        localSettings.brightness !== originalSettingsFromApi.brightness ||
        localSettings.textSize !== originalSettingsFromApi.textSize ||
        localSettings.darkModeEnabled !== originalSettingsFromApi.darkModeEnabled ||
        localSettings.contrastMode !== originalSettingsFromApi.contrastMode
      );
    },
    [localSettings, originalSettingsFromApi, isLoadingApi, isLoadingAppearance]
  );

  const handleLocalSettingChange = useCallback(
    <K extends keyof DisplayScreenSettings>(key: K, value: DisplayScreenSettings[K]) => {
      setLocalSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleBrightnessLockToggle = useCallback(() => setIsBrightnessLocked((prev) => !prev), []);

  const handleLayoutSelect = useCallback(
    async (layout: GridLayoutType) => {
      if (layout === gridLayout || isLoadingLayout || isSaving) return;
      setIsSaving(true);
      try {
        await setGridLayout(layout);
        Alert.alert(
          t('displayOptions.saveSuccessTitle', 'Success'),
          t('displayOptions.layout.layoutUpdateSuccess', 'Grid layout updated.')
        );
      } catch (error) {
        const errorInfo = handleApiError(error);
        console.error('DisplayOptionsScreen: Error saving gridLayout via context/API:', errorInfo.message);
        Alert.alert(
          t('common.error', 'Error'),
          t('displayOptions.errors.gridLayoutSaveFailApi', { message: errorInfo.message })
        );
      } finally {
        if (isMountedRef.current) setIsSaving(false);
      }
    },
    [setGridLayout, gridLayout, isLoadingLayout, isSaving, t]
  );

  const handleReset = () => {
    if (!hasChanged || isLoadingApi || isLoadingAppearance || isSaving) return;
    Alert.alert(t('displayOptions.resetConfirmTitle'), t('displayOptions.resetConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.reset'),
        style: 'destructive',
        onPress: () => {
          if (isMountedRef.current) setLocalSettings(originalSettingsFromApi);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!hasChanged || isSaving || isLoadingApi || isLoadingAppearance) return;
    if (isMountedRef.current) setIsSaving(true);

    const settingsToSaveToApi: Partial<AppearanceSettingsUpdatePayload> = {};
    if (localSettings.brightness !== originalSettingsFromApi.brightness)
      settingsToSaveToApi.brightness = localSettings.brightness;
    if (localSettings.textSize !== originalSettingsFromApi.textSize)
      settingsToSaveToApi.fontSize = localSettings.textSize;
    if (localSettings.darkModeEnabled !== originalSettingsFromApi.darkModeEnabled)
      settingsToSaveToApi.darkModeEnabled = localSettings.darkModeEnabled;
    if (localSettings.contrastMode !== originalSettingsFromApi.contrastMode)
      settingsToSaveToApi.contrastMode = localSettings.contrastMode;

    try {
      if (Object.keys(settingsToSaveToApi).length > 0) {
        const updatedApiSettings = await apiService.saveAppearanceSettings(settingsToSaveToApi);
        if (isMountedRef.current) {
          const newOriginals: DisplayScreenSettings = {
            brightness: updatedApiSettings.brightness ?? localSettings.brightness,
            textSize: (updatedApiSettings.fontSize as DisplayScreenSettings['textSize']) ?? localSettings.textSize,
            darkModeEnabled: updatedApiSettings.darkModeEnabled ?? localSettings.darkModeEnabled,
            contrastMode: (updatedApiSettings.contrastMode as DisplayScreenSettings['contrastMode']) ?? localSettings.contrastMode,
          };
          setOriginalSettingsFromApi(newOriginals);
          setLocalSettings(newOriginals);
        }
      }

      if (localSettings.brightness !== contextAppearanceSettings.brightness)
        updateAppearanceSetting('brightness', localSettings.brightness);
      if (localSettings.textSize !== contextAppearanceSettings.textSize)
        updateAppearanceSetting('textSize', localSettings.textSize);
      if (localSettings.darkModeEnabled !== contextAppearanceSettings.darkModeEnabled)
        updateAppearanceSetting('darkModeEnabled', localSettings.darkModeEnabled);
      if (localSettings.contrastMode !== contextAppearanceSettings.contrastMode)
        updateAppearanceSetting('contrastMode', localSettings.contrastMode);

      if (isMountedRef.current) setIsSaving(false);
      Alert.alert(
        t('displayOptions.saveSuccessTitle', 'Success'),
        t('displayOptions.saveSuccessMessage', 'Settings saved successfully.')
      );
      onClose();
    } catch (error) {
      const errorInfo = handleApiError(error);
      console.error('DisplayOptionsScreen: Failed to save settings to API', errorInfo.message);
      if (isMountedRef.current) setIsSaving(false);
      Alert.alert(
        t('common.error', 'Error'),
        t('displayOptions.errors.saveFailApi', { message: errorInfo.message })
      );
    }
  };

  const handleAttemptClose = useCallback(() => {
    if (hasChanged) {
      Alert.alert(t('displayOptions.unsavedChangesTitle'), t('displayOptions.unsavedChangesMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.discard'), style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  }, [hasChanged, onClose, t]);

  const styles = StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.primary,
    },
    scrollContentContainer: {
      flexGrow: 1,
      backgroundColor: theme.background,
      padding: 18,
      paddingBottom: 40,
    },
    loadingText: {
      fontSize: fonts.body || 16,
      fontWeight: '500',
      marginTop: 15,
      textAlign: 'center',
      color: theme.text,
    },
  });

  if (!i18n.isInitialized || typeof t !== 'function') {
    return (
      <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading Interface...</Text>
      </SafeAreaView>
    );
  }

  const isLoadingInitialScreenData = isLoadingApi || isLoadingAppearance;
  if (isLoadingInitialScreenData) {
    return (
      <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>
          {t('displayOptions.loadingApi', 'Loading settings...')}
        </Text>
      </SafeAreaView>
    );
  }

  const isSaveDisabled = !hasChanged || isSaving || isLoadingInitialScreenData;
  const isResetDisabled = !hasChanged || isSaving || isLoadingInitialScreenData;

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Header
        onClose={handleAttemptClose}
        onSave={handleSave}
        isSaving={isSaving}
        isSaveDisabled={isSaveDisabled}
        theme={theme}
        fonts={fonts}
        currentLanguage={currentLanguage}
      />
      <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <LayoutSection
          gridLayout={gridLayout}
          isLoadingLayout={isLoadingLayout}
          isSaving={isSaving}
          onLayoutSelect={handleLayoutSelect}
          theme={theme}
          fonts={fonts}
          currentLanguage={currentLanguage}
        />
        <AppearanceSection
          localSettings={localSettings}
          isBrightnessLocked={isBrightnessLocked}
          onSettingChange={handleLocalSettingChange}
          onBrightnessLockToggle={handleBrightnessLockToggle}
          theme={theme}
          fonts={fonts}
          currentLanguage={currentLanguage}
        />
        <TextSizeSection
          localSettings={localSettings}
          onSettingChange={handleLocalSettingChange}
          theme={theme}
          fonts={fonts}
          currentLanguage={currentLanguage}
        />
        <ActionsSection
          onReset={handleReset}
          isResetDisabled={isResetDisabled}
          theme={theme}
          fonts={fonts}
          currentLanguage={currentLanguage}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DisplayOptionsScreen;