// src/components/DisplayOptionsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Alert, Switch, ActivityIndicator
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faColumns, faSun, faLock, faLockOpen,
    faTextHeight, faMoon, faFont,
    faThLarge, faTh, faGripVertical, faCheckCircle, faAdjust
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Context Hooks & Types ---
import { useGrid, GridLayoutType } from '../context/GridContext';
import {
    useAppearance,
    TextSizeType,
    ContrastModeType,
    ThemeColors,
    FontSizes
} from '../context/AppearanceContext';

// --- Re-export types for convenience if needed by parent (Menu) ---
export type { TextSizeType, ContrastModeType };

// --- Define the settings managed locally by this screen FOR TRACKING CHANGES ---
interface DisplayLocalSettingsData {
  brightness: number;
  brightnessLocked: boolean; // Local UI state only
  textSize: TextSizeType;
  darkModeEnabled: boolean;
  contrastMode: ContrastModeType;
}

// --- Component Props ---
interface DisplayOptionsScreenProps {
  onClose: () => void;
}

// --- Default Values ---
const defaultLocalSettings: DisplayLocalSettingsData = {
  brightness: 50,
  brightnessLocked: false,
  textSize: 'medium',
  darkModeEnabled: false,
  contrastMode: 'default',
};

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const DisplayOptionsScreen: React.FC<DisplayOptionsScreenProps> = ({ onClose }) => {
    // --- Hooks ---
    const { gridLayout: contextLayout, setGridLayout, isLoadingLayout } = useGrid();
    const {
        settings: appearanceSettings,
        theme,
        fonts,
        isLoadingAppearance,
        updateAppearanceSetting
    } = useAppearance();
    const { t, i18n } = useTranslation(); // <-- Use the translation hook

    // --- State ---
    const [localSettings, setLocalSettings] = useState<DisplayLocalSettingsData>(() => ({
        brightness: isLoadingAppearance ? defaultLocalSettings.brightness : appearanceSettings.brightness,
        brightnessLocked: false,
        textSize: isLoadingAppearance ? defaultLocalSettings.textSize : appearanceSettings.textSize,
        darkModeEnabled: isLoadingAppearance ? defaultLocalSettings.darkModeEnabled : appearanceSettings.darkModeEnabled,
        contrastMode: isLoadingAppearance ? defaultLocalSettings.contrastMode : appearanceSettings.contrastMode,
    }));
    const [isBrightnessLocked, setIsBrightnessLocked] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isMountedRef = React.useRef(true);

    // --- Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        console.log('DisplayOptionsScreen: Mounted. typeof t =', typeof t, 'i18n initialized:', i18n.isInitialized);
        return () => { isMountedRef.current = false; };
    }, [t, i18n.isInitialized]);


    // --- Effect to sync local state when context settings load/change ---
     useEffect(() => {
        if (!isLoadingAppearance) {
            if (isMountedRef.current) {
                setLocalSettings({
                     brightness: appearanceSettings.brightness,
                     brightnessLocked: isBrightnessLocked,
                     textSize: appearanceSettings.textSize,
                     darkModeEnabled: appearanceSettings.darkModeEnabled,
                     contrastMode: appearanceSettings.contrastMode,
                });
            }
        }
    }, [appearanceSettings, isLoadingAppearance, isBrightnessLocked]);

    // --- Memoize Check for Unsaved Changes ---
    const hasChanged = useMemo(() => {
        if (isLoadingAppearance) return false;
        return (
            localSettings.brightness !== appearanceSettings.brightness ||
            localSettings.textSize !== appearanceSettings.textSize ||
            localSettings.darkModeEnabled !== appearanceSettings.darkModeEnabled ||
            localSettings.contrastMode !== appearanceSettings.contrastMode
        );
    }, [localSettings, appearanceSettings, isLoadingAppearance]);

    // --- Handlers ---
    const handleLocalSettingChange = useCallback(<K extends keyof Omit<DisplayLocalSettingsData, 'brightnessLocked'>>(
        key: K,
        value: DisplayLocalSettingsData[K]
    ) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    }, []);

     const handleBrightnessLockToggle = useCallback(() => {
        setIsBrightnessLocked(prev => !prev);
    }, []);

    const handleLayoutSelect = useCallback(async (layout: GridLayoutType) => {
        if (layout === contextLayout || isLoadingLayout) return;
        try {
            await setGridLayout(layout);
             // Context handles saving and alerts, provide additional feedback if needed
            // Alert.alert(t('displayOptions.layoutChangedTitle'), t('displayOptions.layoutChangedMessage', { layout: t(`displayOptions.layout.${layout}`) }));
        } catch (error) {
            console.error("DisplayOptionsScreen: Error calling setGridLayout", error);
            // Alert handled by context potentially
        }
    }, [setGridLayout, contextLayout, isLoadingLayout, /*t*/]); // t removed if alert moved to context

    const mapBrightnessValueToLabel = (value: number): string => {
        if (value < 34) return t('displayOptions.appearance.brightnessLow');
        if (value < 67) return t('displayOptions.appearance.brightnessMedium');
        return t('displayOptions.appearance.brightnessHigh');
    };

    const handleReset = () => {
        if (!hasChanged || isLoadingAppearance) return;
        Alert.alert(t('displayOptions.resetConfirmTitle'), t('displayOptions.resetConfirmMessage'), [
            { text: t('common.cancel'), style: "cancel" },
            {
                text: t('common.reset'),
                style: "destructive",
                onPress: () => {
                    if (isMountedRef.current) {
                        setLocalSettings({
                            brightness: appearanceSettings.brightness,
                            brightnessLocked: isBrightnessLocked,
                            textSize: appearanceSettings.textSize,
                            darkModeEnabled: appearanceSettings.darkModeEnabled,
                            contrastMode: appearanceSettings.contrastMode,
                        });
                    }
                }
            }
        ]);
    };

    const handleSave = async () => {
        if (!hasChanged || isSaving || isLoadingAppearance) return;
        if(isMountedRef.current) setIsSaving(true);

        const promises: Promise<void>[] = [];
        if (localSettings.brightness !== appearanceSettings.brightness) { promises.push(updateAppearanceSetting('brightness', localSettings.brightness)); }
        if (localSettings.textSize !== appearanceSettings.textSize) { promises.push(updateAppearanceSetting('textSize', localSettings.textSize)); }
        if (localSettings.darkModeEnabled !== appearanceSettings.darkModeEnabled) { promises.push(updateAppearanceSetting('darkModeEnabled', localSettings.darkModeEnabled)); }
        if (localSettings.contrastMode !== appearanceSettings.contrastMode) { promises.push(updateAppearanceSetting('contrastMode', localSettings.contrastMode)); }

        try {
            await Promise.all(promises);
            if(isMountedRef.current) setIsSaving(false);
            Alert.alert(t('displayOptions.saveSuccessTitle'), t('displayOptions.saveSuccessMessage'));
            onClose();
        } catch (error) {
            console.error("DisplayOptionsScreen: Failed to save settings via context", error);
            if(isMountedRef.current) setIsSaving(false);
            Alert.alert(t('common.error'), t('displayOptions.errors.saveFail'));
        }
    };

    const handleAttemptClose = useCallback(() => {
        if (hasChanged) {
            Alert.alert(t('displayOptions.unsavedChangesTitle'), t('displayOptions.unsavedChangesMessage'), [
                { text: t('common.cancel'), style: "cancel" },
                { text: t('common.discard'), style: "destructive", onPress: onClose }
            ]);
        } else {
            onClose();
        }
    }, [hasChanged, onClose, t]);

    // --- Static Data for Options (Labels use t()) ---
    const layoutOptions: { type: GridLayoutType; labelKey: string; icon: any; }[] = useMemo(() => [
        { type: 'simple', labelKey: 'displayOptions.layout.simple', icon: faGripVertical },
        { type: 'standard', labelKey: 'displayOptions.layout.standard', icon: faTh },
        { type: 'dense', labelKey: 'displayOptions.layout.dense', icon: faThLarge },
    ], []);
     const contrastOptions: { type: ContrastModeType; labelKey: string; }[] = useMemo(() => [
        { type: 'default', labelKey: 'displayOptions.contrast.default' },
        { type: 'high-contrast-light', labelKey: 'displayOptions.contrast.highLight' },
        { type: 'high-contrast-dark', labelKey: 'displayOptions.contrast.highDark' },
    ], []);
    const textSizeOptions: { type: TextSizeType; labelKey: string; }[] = useMemo(() => [
        { type: 'small', labelKey: 'displayOptions.textSize.small' },
        { type: 'medium', labelKey: 'displayOptions.textSize.medium' },
        { type: 'large', labelKey: 'displayOptions.textSize.large' },
    ], []);


    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Render Guard for i18n ---
    if (!i18n.isInitialized || typeof t !== 'function') {
        console.log("DisplayOptionsScreen: Rendering loading state because 't' function is not ready.");
        return (
            <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center'}]}>
                 <ActivityIndicator size="large" color={theme.primary || '#0077b6'} />
                 <Text style={{ color: theme.text || '#000000', marginTop: 15, fontSize: fonts.body || 16 }}>Loading Interface...</Text>
             </SafeAreaView>
         );
     }

     if (isLoadingAppearance) {
         return (
            <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center'}]}>
                 <ActivityIndicator size="large" color={theme.primary} />
                 <Text style={{ color: theme.text, marginTop: 15, fontSize: fonts.body }}>{t('displayOptions.loading')}</Text>
             </SafeAreaView>
         );
     }

    // --- Determine Button States ---
    const isSaveDisabled = !hasChanged || isSaving || isLoadingAppearance;
    const isResetDisabled = !hasChanged || isSaving || isLoadingAppearance;

    return (
    <SafeAreaView style={styles.screenContainer}>
        {/* Header */}
        <View style={styles.header}>
             <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel={t('common.goBack')}>
                <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2} color={theme.white} />
             </TouchableOpacity>
            <View style={styles.titleContainer}><Text style={styles.title}>{t('displayOptions.title')}</Text></View>
            <TouchableOpacity
                style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaveDisabled}
                hitSlop={hitSlop}
                accessibilityLabel={t('common.saveSettings')}
                accessibilityState={{ disabled: isSaveDisabled }}
            >
                {isSaving ? <ActivityIndicator size="small" color={theme.white}/> : <FontAwesomeIcon icon={faSave} size={fonts.h2} color={!isSaveDisabled ? theme.white : theme.disabled} />}
            </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
            {/* Layout Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faColumns} size={fonts.h2 * 0.8} color={theme.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>{t('displayOptions.layout.sectionTitle')}</Text>
                    {isLoadingLayout && <ActivityIndicator size="small" color={theme.primary} style={{marginLeft: 10}}/>}
                </View>
                <View style={styles.layoutOptionsContainer}>
                    {layoutOptions.map((option) => {
                        const isSelected = contextLayout === option.type;
                        const isDisabled = isLoadingLayout;
                        const label = t(option.labelKey);
                        return (
                            <TouchableOpacity
                                key={option.type}
                                style={[styles.layoutOptionButton, isSelected && styles.layoutOptionButtonActive, isDisabled && styles.buttonDisabled]}
                                onPress={() => handleLayoutSelect(option.type)}
                                activeOpacity={0.8}
                                disabled={isDisabled}
                                accessibilityLabel={t('displayOptions.layout.accessibilityLabel', { layout: label })}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                            >
                                <FontAwesomeIcon icon={option.icon} size={fonts.h1 * 0.9} color={isSelected ? theme.white : theme.primary} style={styles.layoutOptionIcon} />
                                <View style={styles.layoutOptionTextContainer}>
                                    <Text style={[styles.layoutOptionLabel, isSelected && styles.layoutOptionLabelActive]}>{label}</Text>
                                </View>
                                {isSelected && !isDisabled && (<FontAwesomeIcon icon={faCheckCircle} size={fonts.h2 * 0.8} color={theme.white} style={styles.layoutCheckIcon}/>)}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                 <Text style={styles.infoTextSmall}>{t('displayOptions.layout.infoText')}</Text>
            </View>

             {/* Appearance Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faSun} size={fonts.h2 * 0.8} color={theme.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>{t('displayOptions.appearance.sectionTitle')}</Text>
                </View>
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>{t('displayOptions.appearance.brightnessLabel')}</Text>
                    <View style={styles.sliderControlRow}>
                        <TouchableOpacity style={styles.lockButton} onPress={handleBrightnessLockToggle} hitSlop={hitSlop} accessibilityLabel={isBrightnessLocked ? t('displayOptions.appearance.unlockBrightness') : t('displayOptions.appearance.lockBrightness')}>
                            <FontAwesomeIcon icon={isBrightnessLocked ? faLock : faLockOpen} size={fonts.h2 * 0.9} color={isBrightnessLocked ? theme.primary : theme.textSecondary}/>
                        </TouchableOpacity>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={100}
                            step={1}
                            value={localSettings.brightness}
                            onValueChange={(value) => handleLocalSettingChange('brightness', Math.round(value))}
                            disabled={isBrightnessLocked}
                            minimumTrackTintColor={theme.primary}
                            maximumTrackTintColor={theme.border}
                            thumbTintColor={Platform.OS === 'android' ? theme.primary : undefined}
                            accessibilityLabel={t('displayOptions.appearance.brightnessSliderAccessibilityLabel')}
                            accessibilityValue={{ text: mapBrightnessValueToLabel(localSettings.brightness) }}
                            accessibilityState={{ disabled: isBrightnessLocked }}
                        />
                        <Text style={styles.valueText} accessibilityLabel={t('displayOptions.appearance.brightnessValueAccessibilityLabel', { value: mapBrightnessValueToLabel(localSettings.brightness) })}>{mapBrightnessValueToLabel(localSettings.brightness)}</Text>
                    </View>
                    <Text style={styles.infoTextSmall}>{t('displayOptions.appearance.brightnessInfo')}</Text>
                </View>
                <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                        <FontAwesomeIcon icon={faMoon} size={fonts.h2 * 0.8} color={theme.textSecondary} style={styles.switchIcon}/>
                        <Text style={styles.switchLabel}>{t('displayOptions.appearance.darkModeLabel')}</Text>
                    </View>
                    <Switch
                        value={localSettings.darkModeEnabled}
                        onValueChange={(v) => handleLocalSettingChange('darkModeEnabled', v)}
                        trackColor={{ false: theme.disabled, true: theme.secondary }}
                        thumbColor={Platform.OS === 'android' ? theme.primary : undefined}
                        ios_backgroundColor={theme.disabled}
                        accessibilityLabel={t('displayOptions.appearance.darkModeAccessibilityLabel')}
                        accessibilityState={{ checked: localSettings.darkModeEnabled }}
                    />
                </View>
                <View style={styles.contrastSection}>
                    <View style={styles.contrastHeader}>
                        <FontAwesomeIcon icon={faAdjust} size={fonts.h2 * 0.8} color={theme.textSecondary} style={styles.switchIcon}/>
                        <Text style={styles.switchLabel}>{t('displayOptions.appearance.contrastLabel')}</Text>
                    </View>
                    <View style={styles.contrastOptionsContainer}>
                         {contrastOptions.map((option) => {
                             const isSelected = localSettings.contrastMode === option.type;
                             const label = t(option.labelKey);
                             return (
                                 <TouchableOpacity
                                     key={option.type}
                                     style={[styles.contrastOptionButton, isSelected && styles.contrastOptionButtonActive]}
                                     onPress={() => handleLocalSettingChange('contrastMode', option.type)}
                                     accessibilityRole="radio"
                                     accessibilityState={{ checked: isSelected }}
                                     accessibilityLabel={t('displayOptions.appearance.contrastAccessibilityLabel', { contrast: label })}
                                >
                                     <Text style={[styles.contrastOptionLabel, isSelected && styles.contrastOptionLabelActive]}>{label}</Text>
                                 </TouchableOpacity>
                             );
                         })}
                    </View>
                </View>
            </View>

            {/* Text Size Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faTextHeight} size={fonts.h2 * 0.8} color={theme.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>{t('displayOptions.textSize.sectionTitle')}</Text>
                </View>
                <View style={styles.textSizeOptionsContainer}>
                    {textSizeOptions.map((option) => {
                        const size = option.type;
                        const label = t(option.labelKey);
                        return (
                            <TouchableOpacity
                                key={size}
                                style={[styles.textSizeButton, localSettings.textSize === size && styles.textSizeButtonActive]}
                                onPress={() => handleLocalSettingChange('textSize', size)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: localSettings.textSize === size }}
                                accessibilityLabel={t('displayOptions.textSize.accessibilityLabel', { size: label })}
                            >
                                <FontAwesomeIcon
                                    icon={faFont}
                                    size={size === 'small' ? fonts.caption * 1.1 : size === 'medium' ? fonts.body * 1.1 : fonts.h2 * 1.1}
                                    color={localSettings.textSize === size ? theme.white : theme.primary}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
                 <Text style={styles.infoTextSmall}>{t('displayOptions.textSize.infoText')}</Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
                    onPress={handleReset}
                    disabled={isResetDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.resetChanges')}
                    accessibilityState={{ disabled: isResetDisabled }}
                >
                    <FontAwesomeIcon icon={faUndo} size={fonts.label} color={!isResetDisabled ? theme.textSecondary : theme.disabled} style={styles.buttonIcon}/>
                    <Text style={[styles.resetButtonText, isResetDisabled && styles.textDisabled]}>{t('common.resetChanges')}</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    </SafeAreaView>
    );
};

// --- Styles (Unchanged from your previous version) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: theme.primary },
  header: { backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
  title: { fontSize: fonts.h2, fontWeight: '600', color: theme.white, textAlign: 'center' },
  headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContentContainer: { flexGrow: 1, backgroundColor: theme.background, padding: 15, paddingBottom: 40 },
  sectionCard: { backgroundColor: theme.card, borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme.isDark ? 0.3 : 0.1, shadowRadius: 3, elevation: 2, borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0, borderColor: theme.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  sectionIcon: { marginRight: 12, width: 20, textAlign: 'center' },
  sectionTitle: { fontSize: fonts.h2, fontWeight: '600', color: theme.text, flex: 1 },
  settingItem: { marginBottom: 15 },
  settingLabel: { fontSize: fonts.label, fontWeight: '500', color: theme.text, marginBottom: 8 },
  sliderControlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  lockButton: { paddingHorizontal: 10, paddingVertical: 5, marginRight: 10 },
  slider: { flex: 1, height: 40 },
  valueText: { fontSize: fonts.label, color: theme.primary, fontWeight: '600', minWidth: 80, textAlign: 'center', marginLeft: 14 },
  infoTextSmall: { fontSize: fonts.caption, color: theme.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border },
  switchLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  switchIcon: { marginRight: 15, width: 20, textAlign: 'center' },
  switchLabel: { fontSize: fonts.label, color: theme.text, fontWeight: '500' },
  textSizeOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10, marginBottom: 5 },
  textSizeButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', minWidth: 70, minHeight: 44 },
  textSizeButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  actionsContainer: { marginTop: 25, alignItems: 'center' },
  resetButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  resetButtonText: { fontSize: fonts.label, color: theme.textSecondary, fontWeight: '500', textDecorationLine: 'underline' },
  buttonIcon: { marginRight: 6 },
  buttonDisabled: { opacity: 0.5 },
  textDisabled: { color: theme.disabled, textDecorationLine: 'none' },
  layoutOptionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', marginTop: 10, marginBottom: 5, gap: 10 },
  layoutOptionButton: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 5, borderRadius: 10, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card, minHeight: 90 },
  layoutOptionButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  layoutOptionIcon: { marginBottom: 8 },
  layoutOptionTextContainer: { alignItems: 'center' },
  layoutOptionLabel: { fontSize: fonts.label, fontWeight: '600', color: theme.primary, textAlign: 'center' },
  layoutOptionLabelActive: { color: theme.white },
  layoutCheckIcon: { position: 'absolute', top: 8, right: 8 },
  contrastSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border },
  contrastHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contrastOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  contrastOptionButton: { flexBasis: '48%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, minHeight: 50 },
  contrastOptionButtonActive: { borderColor: theme.primary, backgroundColor: theme.primaryMuted },
  contrastOptionLabel: { fontSize: fonts.label, fontWeight: '500', color: theme.text, textAlign: 'center' },
  contrastOptionLabelActive: { color: theme.primary, fontWeight: 'bold' },
});

export default DisplayOptionsScreen;