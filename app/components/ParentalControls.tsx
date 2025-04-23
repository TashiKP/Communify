// src/components/ParentalControls.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Keyboard // Added Keyboard
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSave, faUndo } from '@fortawesome/free-solid-svg-icons'; // Keep only used icons here
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Import types and sub-components (Adjust paths if your structure differs)
import { ParentalSettingsData, AsdLevel, DayOfWeek } from './parental/types';
import ContentFilteringSection from './parental/ContentFilteringSection';
import AppManagementSection from './parental/AppManagementSection';
import ScreenTimeSection from './parental/ScreenTimeSection';
import ChildProfileSection from './parental/ChildProfileSection';
import SecuritySection from './parental/SecuritySection';
import UsageReportingSection from './parental/UsageReportingSection';

// --- Props Interface ---
interface ParentalControlsProps {
    onClose: () => void;
    initialSettings: ParentalSettingsData;
    onSave: (settings: ParentalSettingsData) => Promise<void>; // Expecting Promise from parent now
}

// --- Default Settings ---
const defaultSettings: ParentalSettingsData = {
    blockViolence: false, blockInappropriate: false, dailyLimitHours: '',
    asdLevel: null, downtimeEnabled: false, downtimeDays: [],
    downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false,
    notifyEmails: [], // Initialize new field
};

// --- Utility Functions ---
const formatTime = (date: Date): string => { const h = date.getHours().toString().padStart(2,'0'); const m = date.getMinutes().toString().padStart(2,'0'); return `${h}:${m}`; };
const parseTime = (timeString: string): Date => { const p=timeString?.split(':'); const h=parseInt(p?.[0]??'0',10); const m=parseInt(p?.[1]??'0',10); const d=new Date(); if(!isNaN(h)&&!isNaN(m))d.setHours(h,m,0,0); else d.setHours(0,0,0,0); return d; };
const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Component ---
const ParentalControls: React.FC<ParentalControlsProps> = ({
    onClose,
    initialSettings,
    onSave
}) => {
    // --- Local State ---
    const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
    const [originalSettings, setOriginalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
    const [isSaving, setIsSaving] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
    const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());
    // --- State for Usage Reporting Input ---
    const [showAddEmailInput, setShowAddEmailInput] = useState(false);
    const [newNotifyEmail, setNewNotifyEmail] = useState('');
    // ---------------------------------------

    // --- Memoize ---
    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
    }, [localSettings, originalSettings]);

    // --- Effects ---
    // Reset local state when initialSettings prop changes
    useEffect(() => {
        const mergedInitial = { ...defaultSettings, ...initialSettings };
        setLocalSettings(mergedInitial);
        setOriginalSettings(mergedInitial);
        setIsSaving(false); setShowTimePicker(false);
        setShowAddEmailInput(false); setNewNotifyEmail('');
    }, [initialSettings]);

    const handleSettingChange = useCallback(<K extends keyof ParentalSettingsData>( key: K, value: ParentalSettingsData[K] ) => {
        setLocalSettings(prev => {
            // Handle the specific case for dailyLimitHours
            if (key === 'dailyLimitHours') {
                const numericValue = value as string;
                const filteredValue = numericValue.replace(/[^0-9]/g, '');
                const num = parseInt(filteredValue, 10);
                let finalValue: string;

                if (filteredValue === '') {
                    finalValue = '';
                } else if (!isNaN(num)) {
                    if (num === 0) finalValue = '0';
                    else if (num > 0 && num <= 24) finalValue = num.toString();
                    else if (num > 24) finalValue = '24';
                    else finalValue = prev.dailyLimitHours; // Fallback to previous valid string
                } else {
                    finalValue = prev.dailyLimitHours; // Fallback if not a valid number input
                }
                return { ...prev, dailyLimitHours: finalValue }; // Use the specific key here
            }

             if (key === 'notifyEmails') {
                 return { ...prev, notifyEmails: value as string[] }; // Use specific key and cast value
             }
             if (key === 'downtimeDays') {
                 return { ...prev, downtimeDays: value as DayOfWeek[] }; // Use specific key and cast value
            }
             if (key === 'asdLevel') {
                 return { ...prev, asdLevel: value as AsdLevel | null }; // Use specific key and cast value
             }
             if (key === 'downtimeStart' || key === 'downtimeEnd') {
                 return { ...prev, [key]: value as string}; // Use specific key and cast value
             }

            return { ...prev, [key]: value };
        });
    }, []); // Keep dependency array empty

    const handleDowntimeDayToggle = useCallback((day: DayOfWeek) => {
        setLocalSettings(prev => {
            const currentDays = prev.downtimeDays;
            const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day].sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
            return { ...prev, downtimeDays: newDays };
        });
    }, []); // daysOfWeek is constant, no need to list

    const handleReset = () => {
        if (hasUnsavedChanges) {
            Alert.alert( "Reset Changes?", "Discard all changes and revert to the last saved settings?", [ { text: "Cancel", style: "cancel" }, { text: "Reset", style: "destructive", onPress: () => setLocalSettings(originalSettings) } ] );
        }
    };

    const handleAttemptClose = useCallback(() => {
        if (hasUnsavedChanges) { Alert.alert( "Unsaved Changes", "You have unsaved changes. Discard them and close?", [ { text: "Cancel", style: "cancel" }, { text: "Discard", style: "destructive", onPress: onClose } ] ); }
        else { onClose(); }
    }, [hasUnsavedChanges, onClose]);

    const handleSaveChanges = async () => {
        if (!hasUnsavedChanges) return;
        if (localSettings.downtimeEnabled && localSettings.downtimeDays.length === 0) { Alert.alert("Incomplete Setting", "Please select at least one day for the downtime schedule or disable downtime."); return; }

        setIsSaving(true);
        try {
            await onSave(localSettings); // Call parent save function
            setOriginalSettings(localSettings); // Update baseline on success
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Error saving parental controls (via onSave prop):", error);
            Alert.alert("Error", "Could not save settings. Please try again.");
            setIsSaving(false); // Reset saving state only on error
        }
    };

    const showTimePickerModal = useCallback((target: 'start' | 'end') => { setTimePickerTarget(target); setTimePickerValue(parseTime(target === 'start' ? localSettings.downtimeStart : localSettings.downtimeEnd)); setShowTimePicker(true); }, [localSettings.downtimeStart, localSettings.downtimeEnd]);
    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => { const currentDate = selectedDate || timePickerValue; if (Platform.OS === 'android') setShowTimePicker(false); if (event.type === 'set' && timePickerTarget) { const formattedTime = formatTime(currentDate); handleSettingChange(timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd', formattedTime); setTimePickerTarget(null); if (Platform.OS === 'ios') setShowTimePicker(false); } else if (event.type === 'dismissed'){ setTimePickerTarget(null); if (Platform.OS === 'ios') setShowTimePicker(false); } };
    const handleConfigureApps = useCallback(() => Alert.alert("App Limits", "Coming Soon."), []);
    const handleConfigureWeb = useCallback(() => Alert.alert("Web Filtering", "Coming Soon."), []);
    const handleConfigurePasscode = useCallback(() => Alert.alert("Security", "Coming Soon."), []);

    // --- Handlers for Usage Reporting ---
    const toggleAddEmailInput = useCallback(() => { setShowAddEmailInput(prev => !prev); setNewNotifyEmail(''); if (showAddEmailInput) Keyboard.dismiss(); }, [showAddEmailInput]);
    const handleAddNotifyEmail = useCallback(() => {
        const trimmedEmail = newNotifyEmail.trim();
        if (!trimmedEmail) return;
        if (!emailRegex.test(trimmedEmail)) { Alert.alert("Invalid Email", "Please enter a valid email address."); return; }
        const lowerCaseEmail = trimmedEmail.toLowerCase();
        if (localSettings.notifyEmails.some(email => email.toLowerCase() === lowerCaseEmail)) { Alert.alert("Duplicate Email", "This email address is already added."); return; }
        handleSettingChange('notifyEmails', [...localSettings.notifyEmails, trimmedEmail]);
        setNewNotifyEmail(''); setShowAddEmailInput(false); Keyboard.dismiss();
    }, [newNotifyEmail, localSettings.notifyEmails, handleSettingChange]);
    const handleDeleteNotifyEmail = useCallback((emailToDelete: string) => {
        handleSettingChange('notifyEmails', localSettings.notifyEmails.filter(email => email !== emailToDelete));
    }, [localSettings.notifyEmails, handleSettingChange]);
    // ---------------------------------------

    // --- Pass styles object down ---
    const componentStyles = useMemo(() => ({
        ...styles,
        _primaryColor: primaryColor, _darkGrey: darkGrey, _placeholderColor: placeholderColor,
        _mediumGrey: mediumGrey, _whiteColor: whiteColor, _textColor: textColor, _errorColor: errorColor,
        _lightGrey: lightGrey, _screenBackgroundColor: screenBackgroundColor, _cardBackgroundColor: cardBackgroundColor,
    }), []); // Empty array ensures this only calculates once

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel="Close Parental Controls">
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Parental Controls</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleSaveChanges}
                        disabled={isSaving || !hasUnsavedChanges}
                        hitSlop={hitSlop}
                        accessibilityLabel="Save Parental Controls settings"
                        accessibilityState={{ disabled: isSaving || !hasUnsavedChanges }}
                    >
                        {isSaving ? <ActivityIndicator size="small" color={whiteColor} /> : <FontAwesomeIcon icon={faSave} size={20} color={hasUnsavedChanges ? whiteColor : disabledButtonColor} />}
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content Area */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Render Sub-Components */}
                    <ContentFilteringSection
                        settings={localSettings}
                        onSettingChange={handleSettingChange}
                        onConfigureWeb={handleConfigureWeb}
                        switchStyles={switchStyles}
                        styles={componentStyles}
                    />

                    <AppManagementSection
                        onConfigureApps={handleConfigureApps}
                        styles={componentStyles}
                    />

                    <ScreenTimeSection
                        settings={localSettings}
                        onSettingChange={handleSettingChange}
                        onDayToggle={handleDowntimeDayToggle}
                        onShowTimePicker={showTimePickerModal}
                        switchStyles={switchStyles}
                        styles={componentStyles}
                        daysOfWeek={daysOfWeek}
                    />

                    <ChildProfileSection
                         settings={localSettings}
                         onSettingChange={handleSettingChange}
                         styles={componentStyles}
                    />

                    <UsageReportingSection
                        settings={localSettings}
                        showAddEmailInput={showAddEmailInput}
                        newNotifyEmail={newNotifyEmail}
                        // Removed onSettingChange as direct prop
                        onNewEmailChange={setNewNotifyEmail}
                        onToggleAddEmail={toggleAddEmailInput}
                        onAddEmail={handleAddNotifyEmail}
                        onDeleteEmail={handleDeleteNotifyEmail}
                        styles={componentStyles}
                    />

                    <SecuritySection
                        settings={localSettings}
                        onSettingChange={handleSettingChange}
                        onConfigurePasscode={handleConfigurePasscode}
                        switchStyles={switchStyles}
                        styles={componentStyles}
                     />

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[styles.resetButton, !hasUnsavedChanges && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={isSaving || !hasUnsavedChanges}
                        accessibilityRole="button"
                        accessibilityLabel="Discard changes"
                    >
                        <FontAwesomeIcon icon={faUndo} size={14} color={hasUnsavedChanges ? darkGrey : mediumGrey} style={styles.buttonIcon}/>
                        <Text style={[styles.resetButtonText, !hasUnsavedChanges && styles.textDisabled]}>Discard Changes</Text>
                    </TouchableOpacity>

                </ScrollView>

                 {/* Time Picker rendered conditionally */}
                {showTimePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={timePickerValue}
                        mode="time"
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onTimeChange}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

// --- Styles & Constants ---
const primaryColor = '#0077b6';
const secondaryColor = '#90e0ef';
const screenBackgroundColor = '#f4f7f9';
const cardBackgroundColor = '#ffffff';
const whiteColor = '#ffffff';
const textColor = '#2d3436';
const darkGrey = '#636e72';
const mediumGrey = '#b2bec3';
const lightGrey = '#dfe6e9';
const placeholderColor = '#adb5bd';
const errorColor = '#dc3545'; // Define error color if needed by sub-components via styles._errorColor
const disabledButtonColor = '#a9d6e9';

const switchStyles = { trackColor: { false: mediumGrey, true: secondaryColor }, thumbColor: Platform.OS === 'android' ? primaryColor : undefined, ios_backgroundColor: mediumGrey, };
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: primaryColor },
    container: { flex: 1, backgroundColor: screenBackgroundColor },
    header: { backgroundColor: primaryColor, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
    title: { fontSize: 18, fontWeight: '600', color: whiteColor, textAlign: 'center' },
    headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1, },
    scrollContainer: { padding: 15, paddingBottom: 40, },
    sectionCard: { backgroundColor: cardBackgroundColor, borderRadius: 12, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 20, borderWidth: 1, borderColor: lightGrey, overflow: 'hidden', },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 10, /* marginBottom: 15, // Let content push down */ borderBottomWidth: 1, borderBottomColor: lightGrey, },
    cardIcon: { marginRight: 12, width: 20, textAlign: 'center', },
    sectionTitle: { fontSize: 17, fontWeight: '600', color: textColor, flex: 1, },
    cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lightGrey, marginTop: 10, paddingTop: 0, paddingHorizontal: 18, paddingBottom: 0, }, // Reduced paddingBottom
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 44, paddingHorizontal: 18, },
    featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, },
    featureIcon: { marginRight: 18, width: 25, textAlign: 'center', },
    featureLabel: { flex: 1, fontSize: 15, color: darkGrey, marginRight: 10, },
    settingIcon: { marginRight: 18, width: 25, textAlign: 'center' },
    settingLabel: { flex: 1, fontSize: 15, color: textColor, marginRight: 10 },
    timeInputContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    timeInput: { height: 40, width: 55, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, paddingHorizontal: 8, backgroundColor: whiteColor, fontSize: 15, color: textColor, textAlign: 'center' },
    timeInputLabel: { marginLeft: 8, fontSize: 14, color: darkGrey },
    downtimeDetails: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: lightGrey, paddingHorizontal: 18, paddingBottom: 10 },
    fieldLabel: { fontSize: 14, color: darkGrey, fontWeight: '500', marginBottom: 12 },
    daySelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 20 },
    dayButton: { minWidth: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: mediumGrey, justifyContent: 'center', alignItems: 'center', marginBottom: 10, backgroundColor: whiteColor, paddingHorizontal: 5 },
    dayButtonSelected: { backgroundColor: primaryColor, borderColor: primaryColor },
    dayButtonText: { fontSize: 13, fontWeight: '600', color: primaryColor },
    dayButtonTextSelected: { color: whiteColor },
    timeSelectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 10},
    timeDisplayBox: { minWidth: 90, paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, alignItems: 'center', backgroundColor: '#f8f9fa'},
    timeDisplayLabel: { fontSize: 12, color: darkGrey, marginBottom: 4 },
    timeDisplayText: { fontSize: 18, fontWeight: '600', color: primaryColor },
    timeSeparator: { fontSize: 14, color: darkGrey, marginHorizontal: 5 },
    infoText: { fontSize: 13, color: darkGrey, paddingVertical: 15, textAlign: 'left', paddingHorizontal: 18, }, // Added vertical padding
    optionsList: { marginTop: 0, paddingHorizontal: 18, paddingBottom: 10 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: whiteColor, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1.5, borderColor: mediumGrey, marginBottom: 10, },
    optionCardSelected: { borderColor: primaryColor, backgroundColor: '#e7f5ff' },
    optionIcon: { marginRight: 15, width: 25, textAlign: 'center'},
    optionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: textColor },
    optionLabelSelected: { color: primaryColor, fontWeight: 'bold' },
    radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: mediumGrey, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    radioOuterSelected: { borderColor: primaryColor },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: primaryColor },
    clearButton: { marginTop: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
    clearButtonText: { fontSize: 14, color: primaryColor, fontWeight: '500' },
    resetButton: { flexDirection: 'row', alignSelf: 'center', marginTop: 15, paddingVertical: 10, paddingHorizontal: 20, },
    resetButtonText: { fontSize: 14, color: darkGrey, fontWeight: '600', textDecorationLine: 'underline', },
    buttonIcon: { marginRight: 8, }, // Used by Reset button and Add Email toggle
    buttonDisabled: { opacity: 0.6 },
    textDisabled: { color: mediumGrey, textDecorationLine: 'none', },
    modalButtonDisabled: { backgroundColor: mediumGrey, opacity: 0.7 }, // Style shared with sub-components

    // --- Styles potentially used by UsageReportingSection (defined here for clarity, passed down) ---
    emailListContainer: { paddingHorizontal: 18, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lightGrey, paddingTop: 10, marginTop: 15 },
    emailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', },
    emailText: { flex: 1, fontSize: 15, color: textColor, marginRight: 10, },
    deleteEmailButton: { padding: 5, },
    noEmailsText: { fontStyle: 'italic', color: darkGrey, textAlign: 'center', paddingVertical: 15, },
    addEmailContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 15, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee', },
    addEmailInput: { flex: 1, height: 44, borderColor: mediumGrey, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginRight: 10, fontSize: 15, backgroundColor: whiteColor, },
    addEmailConfirmButton: { backgroundColor: primaryColor, padding: 10, height: 44, width: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', },
    addEmailToggleButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, justifyContent: 'center' },
    addEmailToggleText: { fontSize: 15, color: primaryColor, fontWeight: '500', },
});

export default ParentalControls;