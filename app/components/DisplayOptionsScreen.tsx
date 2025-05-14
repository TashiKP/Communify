// src/components/DisplayOptionsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
  ScrollView, Alert, Switch, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft, faSave, faUndo, faColumns, faSun, faLock, faLockOpen,
  faTextHeight, faMoon, faFont, faThLarge, faTh, faGripVertical,
  faCheckCircle, faAdjust,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// --- API Service ---
import apiService, {
    handleApiError,
    AppearanceSettingsRead,
    AppearanceSettingsUpdatePayload, // For PATCH payload to apiService.saveAppearanceSettings
    GridLayoutType as ApiGridLayoutType, // Import from apiService or a shared types file
    // Assuming TextSizeType and ContrastModeType are also defined/exported in apiService or a shared types file
    // If not, define them locally or import from where they are defined.
    // For this example, we'll use the context versions and map them if API expects different strings.
} from '../services/apiService'; // Adjust path

// --- Import Context Hooks & Types ---
import { useGrid, GridLayoutType as ContextGridLayoutType } from '../context/GridContext';
import {
  useAppearance,
  TextSizeType as ContextTextSizeType,
  ContrastModeType as ContextContrastModeType,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext';

// --- Import Typography Utility ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path

// --- Align local types with Context/API types ---
// GridLayoutType is handled by useGrid context, which should align with ApiGridLayoutType internally.
type LocalTextSizeType = ContextTextSizeType;
type LocalContrastModeType = ContextContrastModeType;

// --- Define the settings managed by this screen's local state ---
interface DisplayScreenSettings {
  brightness: number;
  textSize: LocalTextSizeType;
  darkModeEnabled: boolean;
  contrastMode: LocalContrastModeType;
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

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const DisplayOptionsScreen: React.FC<DisplayOptionsScreenProps> = ({ onClose }) => {
  const { gridLayout: contextGridLayout, setGridLayout, isLoadingLayout: isLoadingContextLayout } = useGrid();
  const {
    settings: contextAppearanceSettings,
    theme, fonts, isLoadingAppearance: isLoadingContextAppearance,
    updateAppearanceSetting, // This updates the context and might persist locally (e.g., AsyncStorage)
  } = useAppearance();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // State for UI interaction, initialized with defaults, then API data
  const [localSettings, setLocalSettings] = useState<DisplayScreenSettings>(defaultScreenSettings);
  // State to store the last known good settings from the API (for 'hasChanged' logic)
  const [originalSettingsFromApi, setOriginalSettingsFromApi] = useState<DisplayScreenSettings>(defaultScreenSettings);
  
  const [isBrightnessLocked, setIsBrightnessLocked] = useState(false); // Purely UI state
  const [isSaving, setIsSaving] = useState(false); // For API save and context save operations
  const [isLoadingApi, setIsLoadingApi] = useState(true); // For initial API fetch
  const isMountedRef = useRef(true);

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  // Fetch initial settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isMountedRef.current || typeof t !== 'function') return;
      setIsLoadingApi(true);
      try {
        const apiSettings: AppearanceSettingsRead = await apiService.fetchAppearanceSettings();
        if (isMountedRef.current) {
          const fetchedDisplaySettings: DisplayScreenSettings = {
            brightness: apiSettings.brightness ?? defaultScreenSettings.brightness,
            // API uses fontSize, local state & context use textSize
            textSize: (apiSettings.fontSize as LocalTextSizeType) ?? defaultScreenSettings.textSize,
            darkModeEnabled: apiSettings.darkModeEnabled ?? defaultScreenSettings.darkModeEnabled,
            contrastMode: (apiSettings.contrastMode as LocalContrastModeType) ?? defaultScreenSettings.contrastMode,
          };
          setLocalSettings(fetchedDisplaySettings);
          setOriginalSettingsFromApi(fetchedDisplaySettings); // Set original from API
        }
      } catch (error) {
        const errorInfo = handleApiError(error);
        console.error('DisplayOptionsScreen: Failed to fetch appearance settings:', errorInfo.message);
        if(isMountedRef.current) Alert.alert(t('common.error', 'Error'), t('displayOptions.errors.fetchFailApi', {message: errorInfo.message}));
        // Fallback to context settings if API fails, then to defaults
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
  }, [t, i18n.isInitialized]); // Removed contextAppearanceSettings from deps to avoid loop if context updates from this screen's save

  const hasChanged = useMemo(() => {
    if (isLoadingApi || isLoadingContextAppearance) return false; // Don't allow save if still loading
    return (
      localSettings.brightness !== originalSettingsFromApi.brightness ||
      localSettings.textSize !== originalSettingsFromApi.textSize ||
      localSettings.darkModeEnabled !== originalSettingsFromApi.darkModeEnabled ||
      localSettings.contrastMode !== originalSettingsFromApi.contrastMode
    );
  }, [localSettings, originalSettingsFromApi, isLoadingApi, isLoadingContextAppearance]);

  const handleLocalSettingChange = useCallback(
    <K extends keyof DisplayScreenSettings>(key: K, value: DisplayScreenSettings[K]) => {
      setLocalSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

  const handleBrightnessLockToggle = useCallback(() => setIsBrightnessLocked((prev) => !prev), []);

  const handleLayoutSelect = useCallback(
    async (layout: ContextGridLayoutType) => { // Use ContextGridLayoutType here
      if (layout === contextGridLayout || isLoadingContextLayout || isSaving) return;
      setIsSaving(true);
      try {
        await setGridLayout(layout); // This function from useGrid should handle its own API call
        Alert.alert(t('displayOptions.saveSuccessTitle', 'Success'), t('displayOptions.layout.layoutUpdateSuccess', 'Grid layout updated.'));
      } catch (error) {
        const errorInfo = handleApiError(error);
        console.error('DisplayOptionsScreen: Error saving gridLayout via context/API:', errorInfo.message);
        Alert.alert(t('common.error', 'Error'), t('displayOptions.errors.gridLayoutSaveFailApi', {message: errorInfo.message}));
      } finally {
        if(isMountedRef.current) setIsSaving(false);
      }
    }, [setGridLayout, contextGridLayout, isLoadingContextLayout, isSaving, t]
  );

  const mapBrightnessValueToLabel = (value: number): string => { if (value < 34) return t('displayOptions.appearance.brightnessLow'); if (value < 67) return t('displayOptions.appearance.brightnessMedium'); return t('displayOptions.appearance.brightnessHigh'); };

  const handleReset = () => {
    if (!hasChanged || isLoadingApi || isLoadingContextAppearance || isSaving) return;
    Alert.alert(t('displayOptions.resetConfirmTitle'), t('displayOptions.resetConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.reset'), style: 'destructive', onPress: () => {
          if (isMountedRef.current) setLocalSettings(originalSettingsFromApi); // Reset to last fetched/saved API state
      }},
    ]);
  };

  const handleSave = async () => {
    if (!hasChanged || isSaving || isLoadingApi || isLoadingContextAppearance) return;
    if (isMountedRef.current) setIsSaving(true);

    const settingsToSaveToApi: Partial<AppearanceSettingsUpdatePayload> = {};
    if (localSettings.brightness !== originalSettingsFromApi.brightness) settingsToSaveToApi.brightness = localSettings.brightness;
    if (localSettings.textSize !== originalSettingsFromApi.textSize) settingsToSaveToApi.fontSize = localSettings.textSize; // API uses fontSize
    if (localSettings.darkModeEnabled !== originalSettingsFromApi.darkModeEnabled) settingsToSaveToApi.darkModeEnabled = localSettings.darkModeEnabled;
    if (localSettings.contrastMode !== originalSettingsFromApi.contrastMode) settingsToSaveToApi.contrastMode = localSettings.contrastMode;
    // symbolGridLayout is handled by handleLayoutSelect via useGrid context

    try {
      if (Object.keys(settingsToSaveToApi).length > 0) {
        const updatedApiSettings = await apiService.saveAppearanceSettings(settingsToSaveToApi);
        if (isMountedRef.current) {
          // Update originalSettingsFromApi with what was confirmed by the API
          const newOriginals: DisplayScreenSettings = {
            brightness: updatedApiSettings.brightness ?? localSettings.brightness,
            textSize: (updatedApiSettings.fontSize as LocalTextSizeType) ?? localSettings.textSize,
            darkModeEnabled: updatedApiSettings.darkModeEnabled ?? localSettings.darkModeEnabled,
            contrastMode: (updatedApiSettings.contrastMode as LocalContrastModeType) ?? localSettings.contrastMode,
          };
          setOriginalSettingsFromApi(newOriginals);
          // Also update localSettings to reflect exactly what's saved, avoiding hasChanged=true right after save
          setLocalSettings(newOriginals);
        }
      }

      // Update local AppearanceContext for immediate UI feedback AFTER successful API save
      // (or optimistically before, but then handle API failure rollback)
      if (localSettings.brightness !== contextAppearanceSettings.brightness) updateAppearanceSetting('brightness', localSettings.brightness);
      if (localSettings.textSize !== contextAppearanceSettings.textSize) updateAppearanceSetting('textSize', localSettings.textSize);
      if (localSettings.darkModeEnabled !== contextAppearanceSettings.darkModeEnabled) updateAppearanceSetting('darkModeEnabled', localSettings.darkModeEnabled);
      if (localSettings.contrastMode !== contextAppearanceSettings.contrastMode) updateAppearanceSetting('contrastMode', localSettings.contrastMode);

      if (isMountedRef.current) setIsSaving(false);
      Alert.alert(t('displayOptions.saveSuccessTitle', 'Success'), t('displayOptions.saveSuccessMessage', 'Settings saved successfully.'));
      onClose();
    } catch (error) {
      const errorInfo = handleApiError(error);
      console.error('DisplayOptionsScreen: Failed to save settings to API', errorInfo.message);
      if (isMountedRef.current) setIsSaving(false);
      Alert.alert(t('common.error', 'Error'), t('displayOptions.errors.saveFailApi', {message: errorInfo.message}));
    }
  };

  const handleAttemptClose = useCallback(() => { if (hasChanged) { Alert.alert(t('displayOptions.unsavedChangesTitle'), t('displayOptions.unsavedChangesMessage'), [ { text: t('common.cancel'), style: 'cancel' }, { text: t('common.discard'), style: 'destructive', onPress: onClose }, ]); } else { onClose(); } }, [hasChanged, onClose, t]);

  const layoutOptions: { type: ContextGridLayoutType; labelKey: string; icon: any }[] = useMemo(() => [ { type: 'simple', labelKey: 'displayOptions.layout.simple', icon: faGripVertical }, { type: 'standard', labelKey: 'displayOptions.layout.standard', icon: faTh }, { type: 'dense', labelKey: 'displayOptions.layout.dense', icon: faThLarge }, ], [] );
  const contrastOptions: { type: LocalContrastModeType; labelKey: string }[] = useMemo(() => [ { type: 'default', labelKey: 'displayOptions.contrast.default' }, { type: 'high-contrast-light', labelKey: 'displayOptions.contrast.highLight' }, { type: 'high-contrast-dark', labelKey: 'displayOptions.contrast.highDark' }, ], [] );
  const textSizeOptions: { type: LocalTextSizeType; labelKey: string }[] = useMemo(() => [ { type: 'small', labelKey: 'displayOptions.textSize.small' }, { type: 'medium', labelKey: 'displayOptions.textSize.medium' }, { type: 'large', labelKey: 'displayOptions.textSize.large' }, ], [] );

  const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

  if (!i18n.isInitialized || typeof t !== 'function') { return (<SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={theme.primary || '#0077b6'} /><Text style={[styles.loadingText, { color: theme.text || '#000000' }]}>Loading Interface...</Text></SafeAreaView>); }
  const isLoadingInitialScreenData = isLoadingApi || isLoadingContextAppearance;
  if (isLoadingInitialScreenData) {
    return ( <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={theme.primary || '#0077b6'} /><Text style={[styles.loadingText, { color: theme.text || '#000000' }]}>{t('displayOptions.loadingApi', 'Loading settings...')}</Text></SafeAreaView> );
  }

  const isSaveDisabled = !hasChanged || isSaving || isLoadingInitialScreenData;
  const isResetDisabled = !hasChanged || isSaving || isLoadingInitialScreenData;

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel={t('common.goBack')} accessibilityRole="button" >
          <FontAwesomeIcon icon={faArrowLeft} size={(fonts.h2 || 20) * 0.7} color={theme.white || '#fff'} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.white || '#fff' }]}>{t('displayOptions.title')}</Text>
        </View>
        <TouchableOpacity style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]} onPress={handleSave} disabled={isSaveDisabled} hitSlop={hitSlop} accessibilityLabel={t('common.saveSettings')} accessibilityRole="button" accessibilityState={{ disabled: isSaveDisabled }} >
          {isSaving ? (<ActivityIndicator size="small" color={theme.white || '#fff'} />) : (<FontAwesomeIcon icon={faSave} size={(fonts.h2 || 20) * 0.7} color={!isSaveDisabled ? (theme.white || '#fff') : (theme.disabled || '#ccc')} />)}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesomeIcon icon={faColumns} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('displayOptions.layout.sectionTitle')}</Text>
            {(isLoadingContextLayout || isSaving) && (<ActivityIndicator size="small" color={theme.primary || '#007aff'} style={{ marginLeft: 10 }} />)}
          </View>
          <View style={styles.layoutOptionsContainer}>
            {layoutOptions.map((option) => { const isSelected = contextGridLayout === option.type; const isDisabled = isLoadingContextLayout || isSaving; const label = t(option.labelKey);
              return (
                <TouchableOpacity key={option.type} style={[styles.layoutOptionButton, isSelected && styles.layoutOptionButtonActive, isDisabled && styles.buttonDisabled]} onPress={() => handleLayoutSelect(option.type)} activeOpacity={0.7} disabled={isDisabled} accessibilityLabel={t('displayOptions.layout.accessibilityLabel', { layout: label })} accessibilityRole="radio" accessibilityState={{ selected: isSelected, disabled: isDisabled }} >
                  <FontAwesomeIcon icon={option.icon} size={(fonts.body || 16) * 1.1} color={isSelected ? (theme.white || '#fff') : (theme.primary || '#007aff')} style={styles.layoutOptionIcon} />
                  <View style={styles.layoutOptionTextContainer}><Text style={[styles.layoutOptionLabel, isSelected && styles.layoutOptionLabelActive]}>{label}</Text></View>
                  {isSelected && !isDisabled && (<FontAwesomeIcon icon={faCheckCircle} size={(fonts.body || 16) * 1.1} color={theme.white || '#fff'} style={styles.layoutCheckIcon} /> )}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.infoTextSmall, { color: theme.textSecondary || '#555' }]}>{t('displayOptions.layout.infoText')}</Text>
        </View>

        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}><FontAwesomeIcon icon={faSun} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.sectionIcon} /><Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('displayOptions.appearance.sectionTitle')}</Text></View>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>{t('displayOptions.appearance.brightnessLabel')}</Text>
              <View style={styles.sliderControlRow}>
                <TouchableOpacity style={styles.lockButton} onPress={handleBrightnessLockToggle} hitSlop={hitSlop} accessibilityLabel={isBrightnessLocked ? t('displayOptions.appearance.unlockBrightness') : t('displayOptions.appearance.lockBrightness')} accessibilityRole="button">
                  <FontAwesomeIcon icon={isBrightnessLocked ? faLock : faLockOpen} size={(fonts.body || 16) * 1.1} color={isBrightnessLocked ? (theme.primary || '#007aff') : (theme.textSecondary || '#555')} />
                </TouchableOpacity>
                <Slider style={styles.slider} minimumValue={0} maximumValue={100} step={1} value={localSettings.brightness} onValueChange={(value) => handleLocalSettingChange('brightness', Math.round(value))} disabled={isBrightnessLocked} minimumTrackTintColor={theme.primary || '#007aff'} maximumTrackTintColor={theme.border || '#ccc'} thumbTintColor={Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined} accessibilityLabel={t('displayOptions.appearance.brightnessSliderAccessibilityLabel')} accessibilityValue={{ text: mapBrightnessValueToLabel(localSettings.brightness) }} accessibilityState={{ disabled: isBrightnessLocked }} />
                <Text style={[styles.valueText, { color: theme.primary || '#007aff' }]} accessibilityLabel={t('displayOptions.appearance.brightnessValueAccessibilityLabel', { value: mapBrightnessValueToLabel(localSettings.brightness) })} >{mapBrightnessValueToLabel(localSettings.brightness)}</Text>
              </View>
              <Text style={[styles.infoTextSmall, { color: theme.textSecondary || '#555' }]}>{t('displayOptions.appearance.brightnessInfo')}</Text>
            </View>
            <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}><FontAwesomeIcon icon={faMoon} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.switchIcon} /><Text style={[styles.switchLabel, { color: theme.text || '#000' }]}>{t('displayOptions.appearance.darkModeLabel')}</Text></View>
                <Switch value={localSettings.darkModeEnabled} onValueChange={(v) => handleLocalSettingChange('darkModeEnabled', v)} trackColor={{ false: theme.disabled || '#767577', true: theme.secondary || '#81c784' }} thumbColor={Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined} ios_backgroundColor={theme.disabled || '#767577'} accessibilityLabel={t('displayOptions.appearance.darkModeAccessibilityLabel')} accessibilityState={{ checked: localSettings.darkModeEnabled }} />
            </View>
            <View style={styles.contrastSection}>
                <View style={styles.contrastHeader}><FontAwesomeIcon icon={faAdjust} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.switchIcon} /><Text style={[styles.switchLabel, { color: theme.text || '#000' }]}>{t('displayOptions.appearance.contrastLabel')}</Text></View>
                <View style={styles.contrastOptionsContainer}>
                    {contrastOptions.map((option) => { const isSelected = localSettings.contrastMode === option.type; const label = t(option.labelKey);
                        return (<TouchableOpacity key={option.type} style={[styles.contrastOptionButton, isSelected && styles.contrastOptionButtonActive]} onPress={() => handleLocalSettingChange('contrastMode', option.type)} activeOpacity={0.7} accessibilityRole="radio" accessibilityState={{ checked: isSelected }} accessibilityLabel={t('displayOptions.appearance.contrastAccessibilityLabel', { contrast: label })} ><Text style={[styles.contrastOptionLabel, isSelected && styles.contrastOptionLabelActive]}>{label}</Text></TouchableOpacity>);
                    })}
                </View>
            </View>
        </View>

        <View style={styles.sectionCard}>
             <View style={styles.sectionHeader}><FontAwesomeIcon icon={faTextHeight} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.sectionIcon} /><Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('displayOptions.textSize.sectionTitle')}</Text></View>
            <View style={styles.textSizeOptionsContainer}>
                {textSizeOptions.map((option) => { const isSelected = localSettings.textSize === option.type; const label = t(option.labelKey);
                    return (<TouchableOpacity key={option.type} style={[styles.textSizeButton, isSelected && styles.textSizeButtonActive]} onPress={() => handleLocalSettingChange('textSize', option.type)} activeOpacity={0.7} accessibilityRole="radio" accessibilityState={{ checked: localSettings.textSize === option.type }} accessibilityLabel={t('displayOptions.textSize.accessibilityLabel', { size: label })} ><FontAwesomeIcon icon={faFont} size={(fonts.body || 16) * 1.1} color={isSelected ? (theme.white || '#fff') : (theme.primary || '#007aff')} /></TouchableOpacity>);
                })}
            </View>
            <Text style={[styles.infoTextSmall, { color: theme.textSecondary || '#555' }]}>{t('displayOptions.textSize.infoText')}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]} onPress={handleReset} disabled={isResetDisabled} accessibilityRole="button" accessibilityLabel={t('common.resetChanges')} accessibilityState={{ disabled: isResetDisabled }} >
            <FontAwesomeIcon icon={faUndo} size={(fonts.body || 16) * 1.1} color={!isResetDisabled ? (theme.textSecondary || '#555') : (theme.disabled || '#ccc')} style={styles.buttonIcon} />
            <Text style={[styles.resetButtonText, {color: !isResetDisabled ? (theme.textSecondary || '#555') : (theme.disabled || '#ccc')}, isResetDisabled && styles.textDisabled]}>{t('common.resetChanges')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
  const h2FontSize = fonts.h2 || 20;
  const bodyFontSize = fonts.body || 16;
  const labelFontSize = fonts.label || 14; // Used for section titles and some buttons

  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
  const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

  return StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: theme.primary || '#007aff' },
    header: { backgroundColor: theme.primary || '#007aff', paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
    title: { ...h2Styles, fontSize: h2FontSize, fontWeight: '600', textAlign: 'center', },
    headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
    scrollContentContainer: { flexGrow: 1, backgroundColor: theme.background || '#f0f0f0', padding: 18, paddingBottom: 40, },
    sectionCard: { backgroundColor: theme.card || '#fff', borderRadius: 12, padding: 18, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border || '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme.isDark ? 0.2 : 0.08, shadowRadius: 2, elevation: 1, },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border || '#eee', },
    sectionIcon: { marginRight: 12, width: bodyFontSize * 1.1, textAlign: 'center', },
    sectionTitle: { ...labelStyles, fontSize: labelFontSize + 2, fontWeight: '600', flex: 1, },
    settingItem: { marginBottom: 15, },
    settingLabel: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', },
    sliderControlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, },
    lockButton: { paddingHorizontal: 10, paddingVertical: 5, marginRight: 10, },
    slider: { flex: 1, height: 40, },
    valueText: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '600', minWidth: 80, textAlign: 'center', marginLeft: 14, },
    infoTextSmall: { ...bodyStyles, fontSize: bodyFontSize * 0.85, fontWeight: '400', marginTop: 8, textAlign: 'center', paddingHorizontal: 5, opacity: 0.8 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border || '#eee', },
    switchLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10, },
    switchIcon: { marginRight: 15, width: bodyFontSize * 1.1, textAlign: 'center', },
    switchLabel: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', },
    textSizeOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10, marginBottom: 5, },
    textSizeButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border || '#ccc', backgroundColor: theme.card || '#fff', alignItems: 'center', justifyContent: 'center', minWidth: 70, minHeight: 44, },
    textSizeButtonActive: { backgroundColor: theme.primary || '#007aff', borderColor: theme.primary || '#007aff', },
    actionsContainer: { marginTop: 25, alignItems: 'center', },
    resetButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, },
    resetButtonText: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', textDecorationLine: 'underline', },
    buttonIcon: { marginRight: 6, },
    buttonDisabled: { opacity: 0.5, },
    textDisabled: { textDecorationLine: 'none', },
    layoutOptionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 10, marginBottom: 5, gap: 10, },
    layoutOptionButton: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border || '#ccc', backgroundColor: theme.card || '#fff', minHeight: 90, },
    layoutOptionButtonActive: { backgroundColor: theme.primary || '#007aff', borderColor: theme.primary || '#007aff', },
    layoutOptionIcon: { marginBottom: 8, },
    layoutOptionTextContainer: { alignItems: 'center', },
    layoutOptionLabel: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '600', },
    layoutOptionLabelActive: { color: theme.white || '#fff', },
    layoutCheckIcon: { position: 'absolute', top: 8, right: 8, },
    contrastSection: { marginTop: 15, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border || '#eee', },
    contrastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, },
    contrastOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, },
    contrastOptionButton: { flexBasis: '48%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border || '#ccc', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card || '#fff', minHeight: 44, },
    contrastOptionButtonActive: { borderColor: theme.primary || '#007aff', backgroundColor: theme.primaryMuted || '#e0f3ff', }, // Added fallback for primaryMuted
    contrastOptionLabel: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '500', },
    contrastOptionLabelActive: { fontWeight: '600', color: theme.primary || '#007aff', },
    loadingText: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', marginTop: 15, textAlign: 'center', },
  });
};

export default DisplayOptionsScreen;