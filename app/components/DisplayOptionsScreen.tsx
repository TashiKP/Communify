// src/components/DisplayOptionsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Alert, Switch, ActivityIndicator
} from 'react-native';
import Slider from '@react-native-community/slider'; // Ensure installed: npm install @react-native-community/slider
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faColumns, faSun, faLock, faLockOpen,
    faTextHeight, faMoon, faFont,
    faThLarge, faTh, faGripVertical, faCheckCircle, faAdjust
} from '@fortawesome/free-solid-svg-icons';

// --- Import Context Hooks & Types ---
import { useGrid, GridLayoutType } from '../context/GridContext'; // Adjust path if needed
import {
    useAppearance,
    TextSizeType,
    ContrastModeType,
    ThemeColors, // Type for theme colors
    FontSizes // Type for font sizes
} from '../context/AppearanceContext'; // Adjust path if needed

// --- Re-export types for convenience if needed by parent (Menu) ---
export type { TextSizeType, ContrastModeType };

// --- Define the settings managed locally by this screen FOR TRACKING CHANGES ---
// These mirror the AppearanceSettings from the context, plus the local lock state
interface DisplayLocalSettingsData {
  brightness: number; // 0-100
  brightnessLocked: boolean; // Local state for the lock UI, not saved globally
  textSize: TextSizeType;
  darkModeEnabled: boolean;
  contrastMode: ContrastModeType;
}

// --- Component Props ---
interface DisplayOptionsScreenProps {
  // No initialSettings or onSave needed - reads/writes directly to context
  onClose: () => void;
}

// --- Default Values (only for initial state before context loads) ---
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
    // --- Context Hooks ---
    const { gridLayout: contextLayout, setGridLayout, isLoadingLayout } = useGrid();
    const {
        settings: appearanceSettings, // Current settings from context
        theme, // Current theme colors
        fonts, // Current font sizes
        isLoadingAppearance,
        updateAppearanceSetting // Function to save settings to context
    } = useAppearance();

    // --- State ---
    // Local state mirrors context settings *for editing and change tracking*
    const [localSettings, setLocalSettings] = useState<DisplayLocalSettingsData>(() => ({
        // Initialize from context if already loaded, otherwise use defaults temporarily
        brightness: isLoadingAppearance ? defaultLocalSettings.brightness : appearanceSettings.brightness,
        brightnessLocked: false, // Lock state always starts false locally
        textSize: isLoadingAppearance ? defaultLocalSettings.textSize : appearanceSettings.textSize,
        darkModeEnabled: isLoadingAppearance ? defaultLocalSettings.darkModeEnabled : appearanceSettings.darkModeEnabled,
        contrastMode: isLoadingAppearance ? defaultLocalSettings.contrastMode : appearanceSettings.contrastMode,
    }));
     // Separate state for the brightness lock UI element (doesn't persist globally)
     const [isBrightnessLocked, setIsBrightnessLocked] = useState(false);

    // Saving state for the main Save button action
    const [isSaving, setIsSaving] = useState(false);

    // --- Effect to sync local state when context settings load/change ---
     useEffect(() => {
        // Update local state ONLY when context is NOT loading, prevents overwriting edits
        if (!isLoadingAppearance) {
            setLocalSettings({
                 brightness: appearanceSettings.brightness,
                 brightnessLocked: isBrightnessLocked, // Keep local lock state separate
                 textSize: appearanceSettings.textSize,
                 darkModeEnabled: appearanceSettings.darkModeEnabled,
                 contrastMode: appearanceSettings.contrastMode,
            });
        }
        // We don't reset isBrightnessLocked here, it's purely local UI state
    }, [appearanceSettings, isLoadingAppearance, isBrightnessLocked]); // Sync if context settings, loading state, or local lock changes

    // --- Memoize Check for Unsaved Changes ---
    // Compare local editable state against the *current* context settings
    const hasChanged = useMemo(() => {
        if (isLoadingAppearance) return false; // No changes considered while loading
        return (
            localSettings.brightness !== appearanceSettings.brightness ||
            localSettings.textSize !== appearanceSettings.textSize ||
            localSettings.darkModeEnabled !== appearanceSettings.darkModeEnabled ||
            localSettings.contrastMode !== appearanceSettings.contrastMode
            // Note: isBrightnessLocked changes don't trigger save, it's local UI state only
        );
    }, [localSettings, appearanceSettings, isLoadingAppearance]);

    // --- Handlers ---
    // Update local state when an editable setting changes
    const handleLocalSettingChange = useCallback(<K extends keyof Omit<DisplayLocalSettingsData, 'brightnessLocked'>>( // Exclude brightnessLocked
        key: K,
        value: DisplayLocalSettingsData[K]
    ) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    }, []);

     // Toggle local brightness lock state only
     const handleBrightnessLockToggle = useCallback(() => {
        setIsBrightnessLocked(prev => !prev);
        // Do NOT modify localSettings.brightnessLocked here, it's separate state
    }, []);

    // Layout selection calls GridContext directly
    const handleLayoutSelect = useCallback(async (layout: GridLayoutType) => {
        if (layout === contextLayout || isLoadingLayout) return;
        try {
            await setGridLayout(layout); // Update context (which saves)
            // Optionally provide user feedback if needed, though context might handle it
        } catch (error) {
            console.error("DisplayOptionsScreen: Error calling setGridLayout", error);
            // Alert handled by context potentially
        }
    }, [setGridLayout, contextLayout, isLoadingLayout]);

    // Utility to map brightness value to labels
    const mapBrightnessValueToLabel = (value: number): string => {
        if (value < 34) return 'Low';
        if (value < 67) return 'Medium';
        return 'High';
    };

    // Reset local changes back to match the current context settings
    const handleReset = () => {
        if (!hasChanged || isLoadingAppearance) return;
        Alert.alert("Reset Changes?", "Discard changes to Appearance and Text Size?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset",
                style: "destructive",
                onPress: () => {
                    // Reset local state to match context's current settings
                    setLocalSettings({
                        brightness: appearanceSettings.brightness,
                        brightnessLocked: isBrightnessLocked, // Keep current local lock state
                        textSize: appearanceSettings.textSize,
                        darkModeEnabled: appearanceSettings.darkModeEnabled,
                        contrastMode: appearanceSettings.contrastMode,
                    });
                    // Optionally reset the brightness lock state as well if desired:
                    // setIsBrightnessLocked(false);
                }
            }
        ]);
    };

    // Save local changes by calling the AppearanceContext update function
    const handleSave = async () => {
        if (!hasChanged || isSaving || isLoadingAppearance) return;
        setIsSaving(true);

        // Collect update promises for only the changed settings
        const promises: Promise<void>[] = [];
        if (localSettings.brightness !== appearanceSettings.brightness) {
            promises.push(updateAppearanceSetting('brightness', localSettings.brightness));
        }
        if (localSettings.textSize !== appearanceSettings.textSize) {
            promises.push(updateAppearanceSetting('textSize', localSettings.textSize));
        }
        if (localSettings.darkModeEnabled !== appearanceSettings.darkModeEnabled) {
            promises.push(updateAppearanceSetting('darkModeEnabled', localSettings.darkModeEnabled));
        }
        if (localSettings.contrastMode !== appearanceSettings.contrastMode) {
            promises.push(updateAppearanceSetting('contrastMode', localSettings.contrastMode));
        }
        // Note: Brightness lock (isBrightnessLocked) is NOT saved via context

        try {
            await Promise.all(promises); // Wait for all context updates to complete
            setIsSaving(false);
            Alert.alert("Settings Saved", "Display options updated."); // Provide feedback
            onClose(); // Close screen after successful save
        } catch (error) {
            // Context's update function likely shows an alert on failure
            console.error("DisplayOptionsScreen: Failed to save settings via context", error);
            setIsSaving(false); // Ensure saving state is reset
            // Optionally show a generic fallback error alert here
            // Alert.alert("Error", "An error occurred while saving settings.");
        }
    };

    // Handle closing attempt, check for unsaved local changes
    const handleAttemptClose = useCallback(() => {
        if (hasChanged) {
            Alert.alert("Unsaved Changes", "Discard changes to Appearance and Text Size?", [
                { text: "Cancel", style: "cancel" },
                { text: "Discard", style: "destructive", onPress: onClose }
            ]);
        } else {
            onClose();
        }
    }, [hasChanged, onClose]);

    // --- Static Data for Options ---
    const layoutOptions: { type: GridLayoutType; label: string; icon: any; }[] = [
        { type: 'simple', label: 'Simple', icon: faGripVertical },
        { type: 'standard', label: 'Standard', icon: faTh },
        { type: 'dense', label: 'Dense', icon: faThLarge },
    ];
     const contrastOptions: { type: ContrastModeType; label: string; }[] = [
        { type: 'default', label: 'Default' },
        { type: 'high-contrast-light', label: 'High Contrast (Light)' },
        { type: 'high-contrast-dark', label: 'High Contrast (Dark)' },
    ];

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Loading State ---
     if (isLoadingAppearance) {
         return (
            <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center'}]}>
                 <ActivityIndicator size="large" color={theme.primary} />
                 <Text style={{ color: theme.text, marginTop: 15, fontSize: fonts.body }}>Loading Display Settings...</Text>
             </SafeAreaView>
         );
     }

    // --- Determine Button States ---
    const isSaveDisabled = !hasChanged || isSaving || isLoadingAppearance;
    const isResetDisabled = !hasChanged || isSaving || isLoadingAppearance;

    // --- Render ---
    return (
    <SafeAreaView style={styles.screenContainer}>
        {/* Header */}
        <View style={styles.header}>
             <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel="Go back">
                <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2} color={theme.white} />
             </TouchableOpacity>
            <View style={styles.titleContainer}><Text style={styles.title}>Display Options</Text></View>
            <TouchableOpacity
                style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaveDisabled}
                hitSlop={hitSlop}
                accessibilityLabel="Save display settings"
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
                    <Text style={styles.sectionTitle}>Layout Density</Text>
                    {isLoadingLayout && <ActivityIndicator size="small" color={theme.primary} style={{marginLeft: 10}}/>}
                </View>
                <View style={styles.layoutOptionsContainer}>
                    {layoutOptions.map((option) => {
                        const isSelected = contextLayout === option.type;
                        const isDisabled = isLoadingLayout;
                        return (
                            <TouchableOpacity
                                key={option.type}
                                style={[styles.layoutOptionButton, isSelected && styles.layoutOptionButtonActive, isDisabled && styles.buttonDisabled]}
                                onPress={() => handleLayoutSelect(option.type)}
                                activeOpacity={0.8}
                                disabled={isDisabled}
                                accessibilityLabel={`Set layout to ${option.label}`}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                            >
                                <FontAwesomeIcon icon={option.icon} size={fonts.h1 * 0.9} color={isSelected ? theme.white : theme.primary} style={styles.layoutOptionIcon} />
                                <View style={styles.layoutOptionTextContainer}>
                                    <Text style={[styles.layoutOptionLabel, isSelected && styles.layoutOptionLabelActive]}>{option.label}</Text>
                                </View>
                                {isSelected && !isDisabled && (<FontAwesomeIcon icon={faCheckCircle} size={fonts.h2 * 0.8} color={theme.white} style={styles.layoutCheckIcon}/>)}
                            </TouchableOpacity>
                        );
                    })}
                </View>
                 <Text style={styles.infoTextSmall}>Select the density for the symbol grid display. Changes are saved immediately.</Text>
            </View>

             {/* Appearance Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <FontAwesomeIcon icon={faSun} size={fonts.h2 * 0.8} color={theme.primary} style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Appearance</Text>
                </View>
                {/* Brightness */}
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>App Brightness</Text>
                    <View style={styles.sliderControlRow}>
                        <TouchableOpacity style={styles.lockButton} onPress={handleBrightnessLockToggle} hitSlop={hitSlop} accessibilityLabel={isBrightnessLocked ? "Unlock brightness editing" : "Lock brightness editing"}>
                            <FontAwesomeIcon icon={isBrightnessLocked ? faLock : faLockOpen} size={fonts.h2 * 0.9} color={isBrightnessLocked ? theme.primary : theme.textSecondary}/>
                        </TouchableOpacity>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={100}
                            step={1} // Allow fine-grained control
                            value={localSettings.brightness}
                            onValueChange={(value) => handleLocalSettingChange('brightness', Math.round(value))}
                            disabled={isBrightnessLocked} // Use local lock state
                            minimumTrackTintColor={theme.primary}
                            maximumTrackTintColor={theme.border}
                            thumbTintColor={Platform.OS === 'android' ? theme.primary : undefined}
                            accessibilityLabel="App brightness slider"
                            accessibilityValue={{ text: mapBrightnessValueToLabel(localSettings.brightness) }}
                            accessibilityState={{ disabled: isBrightnessLocked }}
                        />
                        <Text style={styles.valueText} accessibilityLabel={`Current brightness ${mapBrightnessValueToLabel(localSettings.brightness)}`}>{mapBrightnessValueToLabel(localSettings.brightness)}</Text>
                    </View>
                    <Text style={styles.infoTextSmall}>Adjusts a filter overlay within the app.</Text>
                </View>
                {/* Dark Mode */}
                <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                        <FontAwesomeIcon icon={faMoon} size={fonts.h2 * 0.8} color={theme.textSecondary} style={styles.switchIcon}/>
                        <Text style={styles.switchLabel}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={localSettings.darkModeEnabled}
                        onValueChange={(v) => handleLocalSettingChange('darkModeEnabled', v)}
                        trackColor={{ false: theme.disabled, true: theme.secondary }}
                        thumbColor={Platform.OS === 'android' ? theme.primary : undefined}
                        ios_backgroundColor={theme.disabled}
                        accessibilityLabel="Dark mode switch"
                        accessibilityState={{ checked: localSettings.darkModeEnabled }}
                    />
                </View>
                {/* Contrast Mode */}
                <View style={styles.contrastSection}>
                    <View style={styles.contrastHeader}>
                        <FontAwesomeIcon icon={faAdjust} size={fonts.h2 * 0.8} color={theme.textSecondary} style={styles.switchIcon}/>
                        <Text style={styles.switchLabel}>Contrast</Text>
                    </View>
                    <View style={styles.contrastOptionsContainer}>
                         {contrastOptions.map((option) => {
                             const isSelected = localSettings.contrastMode === option.type;
                             return (
                                 <TouchableOpacity
                                     key={option.type}
                                     style={[styles.contrastOptionButton, isSelected && styles.contrastOptionButtonActive]}
                                     onPress={() => handleLocalSettingChange('contrastMode', option.type)}
                                     accessibilityRole="radio"
                                     accessibilityState={{ checked: isSelected }}
                                     accessibilityLabel={`Set contrast mode to ${option.label}`}
                                >
                                     <Text style={[styles.contrastOptionLabel, isSelected && styles.contrastOptionLabelActive]}>{option.label}</Text>
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
                    <Text style={styles.sectionTitle}>Text Size</Text>
                </View>
                <View style={styles.textSizeOptionsContainer}>
                    {(['small', 'medium', 'large'] as TextSizeType[]).map((size) => (
                        <TouchableOpacity
                            key={size}
                            style={[styles.textSizeButton, localSettings.textSize === size && styles.textSizeButtonActive]}
                            onPress={() => handleLocalSettingChange('textSize', size)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: localSettings.textSize === size }}
                            accessibilityLabel={`Set text size to ${size}`}
                        >
                            <FontAwesomeIcon
                                icon={faFont}
                                size={size === 'small' ? fonts.caption * 1.1 : size === 'medium' ? fonts.body * 1.1 : fonts.h2 * 1.1} // Use calculated font sizes for icon size
                                color={localSettings.textSize === size ? theme.white : theme.primary}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                 <Text style={styles.infoTextSmall}>Adjusts the base size for text throughout the app.</Text>
            </View>

            {/* Actions */}
             <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
                    onPress={handleReset}
                    disabled={isResetDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Reset appearance and text size changes"
                    accessibilityState={{ disabled: isResetDisabled }}
                >
                    <FontAwesomeIcon icon={faUndo} size={fonts.label} color={!isResetDisabled ? theme.textSecondary : theme.disabled} style={styles.buttonIcon}/>
                    <Text style={[styles.resetButtonText, isResetDisabled && styles.textDisabled]}>Reset Changes</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    </SafeAreaView>
    );
};

// --- Helper Function to Create Themed Styles ---
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
  contrastOptionButtonActive: { borderColor: theme.primary, backgroundColor: theme.primaryMuted }, // Use primaryMuted for active bg
  contrastOptionLabel: { fontSize: fonts.label, fontWeight: '500', color: theme.text, textAlign: 'center' },
  contrastOptionLabelActive: { color: theme.primary, fontWeight: 'bold' }, // Keep primary color text
  // hitSlop defined outside component
});

export default DisplayOptionsScreen;