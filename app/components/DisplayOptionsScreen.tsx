import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView, Alert, Switch, ActivityIndicator
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faColumns, faSun, faLock, faLockOpen,
    faTextHeight, // Icon for text size
    faMoon,       // Icon for dark mode
    faFont       // Alternative text size icon
} from '@fortawesome/free-solid-svg-icons';

// --- Types ---
type TextSizeType = 'small' | 'medium' | 'large';

export interface DisplaySettingsData {
  layout: 0 | 50 | 100;
  brightness: 0 | 50 | 100;
  layoutLocked: boolean;
  brightnessLocked: boolean;
  textSize: TextSizeType;
  darkModeEnabled: boolean;
}

interface DisplayOptionsScreenProps {
  initialSettings: DisplaySettingsData;
  onSave: (settings: DisplaySettingsData) => Promise<void> | void;
  onClose: () => void; // Function to navigate back/close
}

// --- Default Values ---
const defaultSettings: DisplaySettingsData = {
  layout: 50,
  brightness: 50,
  layoutLocked: false,
  brightnessLocked: false,
  textSize: 'medium',
  darkModeEnabled: false,
};

// --- Component ---
const DisplayOptionsScreen: React.FC<DisplayOptionsScreenProps> = ({
  initialSettings: initialPropsSettings,
  onSave,
  onClose,
}) => {
    // --- State ---
    const [localSettings, setLocalSettings] = useState<DisplaySettingsData>(
        { ...defaultSettings, ...initialPropsSettings }
    );
    const [originalSettings, setOriginalSettings] = useState<DisplaySettingsData>(
        { ...defaultSettings, ...initialPropsSettings }
    );
    const [isSaving, setIsSaving] = useState(false);

    // --- Memoize Check for Unsaved Changes ---
    const hasChanged = useMemo(() => {
        return JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
    }, [localSettings, originalSettings]);

    // --- Effect to update local state if initial props change ---
    // (Less critical for a screen, but good practice)
    useEffect(() => {
        const mergedInitial = { ...defaultSettings, ...initialPropsSettings };
        setLocalSettings(mergedInitial);
        setOriginalSettings(mergedInitial);
    }, [initialPropsSettings]);


    // --- Handlers ---
    // Generic setting change handler
    const handleSettingChange = <K extends keyof DisplaySettingsData>(
        key: K,
        value: DisplaySettingsData[K]
    ) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    // Map slider value to labels
    const mapLayoutValueToLabel = (value: 0 | 50 | 100): string => {
        if (value === 0) return 'Simple';
        if (value === 50) return 'Standard';
        return 'Dense';
    };
    const mapBrightnessValueToLabel = (value: 0 | 50 | 100): string => {
        if (value === 0) return 'Low';
        if (value === 50) return 'Medium';
        return 'High';
    };

    // Reset to original settings
    const handleReset = () => {
        Alert.alert(
            "Reset Changes?",
            "Discard changes and revert to last saved settings?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: () => setLocalSettings(originalSettings) }
            ]
        );
    };

    // Save changes
    const handleSave = async () => {
        if (!hasChanged) return;
        setIsSaving(true);
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings); // Update baseline
            onClose(); // Close after save
        } catch (error) {
            console.error("Failed to save display settings:", error);
            Alert.alert("Error", "Could not save display settings.");
            setIsSaving(false); // Reset saving state on error
        }
    };

    // Handle closing/going back
    const handleAttemptClose = useCallback(() => {
        if (hasChanged) {
        Alert.alert(
            "Unsaved Changes",
            "Discard changes and go back?",
            [
            { text: "Cancel", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: onClose }
            ]
        );
        } else {
        onClose();
        }
    }, [hasChanged, onClose]);


    // --- Render ---
    return (
    <SafeAreaView style={styles.screenContainer}>
        {/* Screen Header */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop}>
                <FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>Display Options</Text>
            </View>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSave}
                disabled={!hasChanged || isSaving}
                hitSlop={hitSlop}
            >
                {isSaving
                    ? <ActivityIndicator size="small" color={whiteColor}/>
                    : <FontAwesomeIcon icon={faSave} size={20} color={hasChanged ? whiteColor : disabledButtonColor} />
                }
            </TouchableOpacity>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">

            {/* --- Layout Section --- */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FontAwesomeIcon icon={faColumns} size={18} color={primaryColor} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Layout Density</Text>
                </View>
                <View style={styles.sliderControlRow}>
                    <TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('layoutLocked', !localSettings.layoutLocked)} hitSlop={hitSlop} accessibilityLabel={localSettings.layoutLocked ? "Unlock layout density" : "Lock layout density"}>
                        <FontAwesomeIcon icon={localSettings.layoutLocked ? faLock : faLockOpen} size={20} color={localSettings.layoutLocked ? primaryColor : darkGrey}/>
                    </TouchableOpacity>
                    <Slider
                        style={styles.slider}
                        minimumValue={0} maximumValue={100} step={50}
                        value={localSettings.layout}
                        onValueChange={(value) => handleSettingChange('layout', value as 0 | 50 | 100)}
                        disabled={localSettings.layoutLocked}
                        {...sliderStyles}
                        accessibilityLabel="Layout density slider"
                    />
                    <Text style={styles.valueText} accessibilityLabel={`Current layout ${mapLayoutValueToLabel(localSettings.layout)}`}>{mapLayoutValueToLabel(localSettings.layout)}</Text>
                </View>
                 <Text style={styles.infoTextSmall}>Adjusts the amount of content shown on screen.</Text>
            </View>

            {/* --- Appearance Section --- */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FontAwesomeIcon icon={faSun} size={18} color={primaryColor} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Appearance</Text>
                </View>

                {/* Brightness */}
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Brightness</Text>
                    <View style={styles.sliderControlRow}>
                        <TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('brightnessLocked', !localSettings.brightnessLocked)} hitSlop={hitSlop} accessibilityLabel={localSettings.brightnessLocked ? "Unlock brightness" : "Lock brightness"}>
                            <FontAwesomeIcon icon={localSettings.brightnessLocked ? faLock : faLockOpen} size={20} color={localSettings.brightnessLocked ? primaryColor : darkGrey}/>
                        </TouchableOpacity>
                        <Slider
                            style={styles.slider}
                            minimumValue={0} maximumValue={100} step={50}
                            value={localSettings.brightness}
                            onValueChange={(value) => handleSettingChange('brightness', value as 0 | 50 | 100)}
                            disabled={localSettings.brightnessLocked}
                            {...sliderStyles}
                            accessibilityLabel="Brightness slider"
                        />
                        <Text style={styles.valueText} accessibilityLabel={`Current brightness ${mapBrightnessValueToLabel(localSettings.brightness)}`}>{mapBrightnessValueToLabel(localSettings.brightness)}</Text>
                    </View>
                </View>

                 {/* Dark Mode */}
                 <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                        <FontAwesomeIcon icon={faMoon} size={18} color={darkGrey} style={styles.switchIcon}/>
                        <Text style={styles.switchLabel}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={localSettings.darkModeEnabled}
                        onValueChange={(v) => handleSettingChange('darkModeEnabled', v)}
                        {...switchStyles}
                        accessibilityLabel="Dark mode switch"
                    />
                 </View>
            </View>

            {/* --- Text Size Section --- */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <FontAwesomeIcon icon={faTextHeight} size={18} color={primaryColor} style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>Text Size</Text>
                </View>
                <View style={styles.textSizeOptionsContainer}>
                    {(['small', 'medium', 'large'] as TextSizeType[]).map((size) => (
                        <TouchableOpacity
                            key={size}
                            style={[
                                styles.textSizeButton,
                                localSettings.textSize === size && styles.textSizeButtonActive
                            ]}
                            onPress={() => handleSettingChange('textSize', size)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: localSettings.textSize === size }}
                            accessibilityLabel={`Set text size to ${size}`}
                        >
                            <Text
                                style={[
                                    styles.textSizeButtonText,
                                    localSettings.textSize === size && styles.textSizeButtonTextActive
                                ]}
                             >
                                {/* Example dynamic font size for label */}
                                <FontAwesomeIcon icon={faFont} size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} color={localSettings.textSize === size ? whiteColor : primaryColor}/>
                                {/* Or static text */}
                                {/* {size.charAt(0).toUpperCase() + size.slice(1)} */}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

             {/* --- Actions --- */}
             <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.resetButton, !hasChanged && styles.buttonDisabled]}
                    onPress={handleReset}
                    disabled={isSaving || !hasChanged}
                    accessibilityRole="button"
                    accessibilityLabel="Reset changes to last saved settings"
                >
                    <FontAwesomeIcon icon={faUndo} size={14} color={hasChanged ? darkGrey : mediumGrey} style={styles.buttonIcon}/>
                    <Text style={[styles.resetButtonText, !hasChanged && styles.textDisabled]}>Reset Changes</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    </SafeAreaView>
    );
};

// --- Constants & Styles ---
const primaryColor = '#0077b6';
const secondaryColor = '#90e0ef'; // For slider/switch tracks
const screenBackgroundColor = '#f8f9fa'; // Slightly off-white screen background
const cardBackgroundColor = '#ffffff';
const whiteColor = '#ffffff';
const textColor = '#343a40';
const darkGrey = '#6c757d';
const mediumGrey = '#adb5bd'; // Used for disabled text/icons
const lightGrey = '#e9ecef'; // Borders
const disabledButtonColor = '#a9d6e9'; // Muted primary for disabled header button icon

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const sliderStyles = {
    minimumTrackTintColor: primaryColor,
    maximumTrackTintColor: secondaryColor,
    thumbTintColor: Platform.OS === 'android' ? primaryColor : undefined
};
const switchStyles = {
    trackColor: { false: mediumGrey, true: secondaryColor },
    thumbColor: Platform.OS === 'android' ? primaryColor : undefined,
    ios_backgroundColor: mediumGrey,
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: primaryColor,
  },
  header: {
    backgroundColor: primaryColor,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: whiteColor,
    textAlign: 'center',
  },
  headerButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContentContainer: {
    flexGrow: 1,
    backgroundColor: screenBackgroundColor,
    padding: 15,
    paddingBottom: 40, // Ensure space below last element
  },
  sectionCard: {
    backgroundColor: cardBackgroundColor,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18, // More space below header
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: lightGrey,
  },
  sectionIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: textColor,
    flex: 1,
  },
  settingItem: { // Added for spacing within a card
     marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: textColor,
    marginBottom: 8,
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8, // Slightly more space
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valueText: {
    fontSize: 15,
    color: primaryColor,
    fontWeight: '600',
    minWidth: 75, // Ensure space for "Standard"
    textAlign: 'center',
    marginLeft: 12, // Slightly more space
  },
  infoTextSmall: {
    fontSize: 12,
    color: darkGrey,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 10, // Add margin top for spacing from brightness
    borderTopWidth: 1, // Separator line
    borderTopColor: lightGrey,
  },
  switchLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1, // Allow label to take space
      marginRight: 10,
  },
   switchIcon: {
       marginRight: 15,
       width: 20,
       textAlign: 'center',
   },
  switchLabel: {
      fontSize: 16,
      color: textColor,
      fontWeight: '500',
  },
  // Text Size Options
  textSizeOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around', // Distribute buttons evenly
      marginTop: 5,
      marginBottom: 5,
  },
  textSizeButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20, // Rounded buttons
      borderWidth: 1.5,
      borderColor: lightGrey,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70, // Ensure minimum width
  },
  textSizeButtonActive: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
  },
  textSizeButtonText: {
      fontSize: 14, // Base size, adjust as needed
      fontWeight: '500',
      color: primaryColor,
  },
  textSizeButtonTextActive: {
      color: whiteColor,
  },
  // Actions Container (for Reset Button)
   actionsContainer: {
      marginTop: 20, // Space above reset button
      alignItems: 'center', // Center button horizontally
  },
  resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      // Add background or border if desired
      // backgroundColor: lightGrey,
      // borderRadius: 8,
  },
  resetButtonText: {
      fontSize: 14,
      color: darkGrey,
      fontWeight: '500',
      textDecorationLine: 'underline',
  },
  buttonIcon: { // Used for reset button icon
      marginRight: 6,
  },
  buttonDisabled: { // Generic style for disabled interactive elements
      // Applied via conditional style props
  },
  textDisabled: { // Style for text within a disabled element
      color: mediumGrey,
      textDecorationLine: 'none',
  }
});

export default DisplayOptionsScreen;