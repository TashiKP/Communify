// src/components/ParentalControls.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Keyboard, TextInput
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faLock,
} from '@fortawesome/free-solid-svg-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as KeychainService from '../services/keychainService';
import { ParentalSettingsData, AsdLevel, DayOfWeek } from './parental/types';
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
    blockViolence: false, blockInappropriate: false, dailyLimitHours: '',
    asdLevel: null, downtimeEnabled: false, downtimeDays: [],
    downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false,
    notifyEmails: [],
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

    // --- State ---
    const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
    const [originalSettings, setOriginalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
    const [isSaving, setIsSaving] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
    const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());
    const [showAddEmailInput, setShowAddEmailInput] = useState(false);
    const [newNotifyEmail, setNewNotifyEmail] = useState('');
    const [passcodeExists, setPasscodeExists] = useState(false); // Initial assumption, will be updated
    const [isLoadingPasscodeStatus, setIsLoadingPasscodeStatus] = useState(true); // Start true for initial check
    const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
    const [currentPasscode, setCurrentPasscode] = useState('');
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [isSettingPasscode, setIsSettingPasscode] = useState(false);
    const [passcodeError, setPasscodeError] = useState<string | null>(null);
    const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
    // ---------------------------------------

    // --- Refs ---
    const newPasscodeRef = useRef<TextInput>(null);
    const confirmPasscodeRef = useRef<TextInput>(null);
    const currentPasscodeRef = useRef<TextInput>(null);
    const isMountedRef = useRef(true);

    // --- Memoize ---
    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
    }, [localSettings, originalSettings]);

    // --- Function to check passcode status ---
    const checkPasscodeStatus = useCallback(async () => {
        if (!isMountedRef.current) return;

        console.log("Checking keychain status...");
        // Ensure loading state is true *before* the async call
        if(isMountedRef.current) setIsLoadingPasscodeStatus(true);

        try {
            // Introduce a small artificial delay for testing loading states if needed
            // await new Promise(resolve => setTimeout(resolve, 1500)); // REMOVE THIS IN PRODUCTION
            const exists = await KeychainService.hasPasscode();
            if (isMountedRef.current) {
                setPasscodeExists(exists);
                console.log("Keychain check complete. Passcode exists:", exists);
            }
        } catch (error) {
             console.error("Failed to check passcode status:", error);
             if (isMountedRef.current) {
                 setPasscodeExists(false); // Assume false on error
                 // Avoid Alert here if possible, handle error state in UI
                 // Alert.alert("Keychain Error", "Could not check passcode status.");
             }
        } finally {
             if (isMountedRef.current) {
                 setIsLoadingPasscodeStatus(false); // Finish loading
             }
        }
     }, []); // No dependencies needed here, relies on isMountedRef internally

    // --- Effects ---
     useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Effect 1: Initialize/Reset state from props (FAST)
    useEffect(() => {
        console.log("Parental Controls: Initializing state from props.");
        const mergedInitial = { ...defaultSettings, ...initialSettings };
        setLocalSettings(mergedInitial);
        setOriginalSettings(mergedInitial);
        setShowTimePicker(false);
        setShowAddEmailInput(false);
        setNewNotifyEmail('');
        setIsSaving(false);
        setShowPasscodeSetup(false); // Close setup if props change
        // Don't reset passcode text inputs here, they reset when setup opens
    }, [initialSettings]);

    // Effect 2: Perform initial passcode check ONCE on mount (ASYNC)
    useEffect(() => {
        console.log("Parental Controls: Performing initial passcode status check.");
        checkPasscodeStatus();
    }, []); // Runs once on mount

    // Effect 3: Handle inconsistency AFTER passcode check completes or settings change
    useEffect(() => {
        // Only run logic *after* the loading is complete
        if (!isLoadingPasscodeStatus) {
            if (localSettings.requirePasscode && !passcodeExists) {
                console.warn("requirePasscode is ON but no passcode exists. Forcing OFF locally.");
                // Update local state directly - user must SAVE this change
                setLocalSettings(prev => {
                    if (prev.requirePasscode) {
                        return {...prev, requirePasscode: false};
                    }
                    return prev;
                });
                // Avoid alert if the setup panel is *already* open (user might be fixing it)
                 if (!showPasscodeSetup) {
                     Alert.alert("Passcode Settings Update", "The 'Require Passcode' setting was turned off because no passcode was found. Please save settings to confirm this change or set up a passcode.");
                 }
            }
        }
    }, [isLoadingPasscodeStatus, localSettings.requirePasscode, passcodeExists, showPasscodeSetup]);


    // --- Handlers ---
    const togglePasscodeSetup = useCallback(() => {
        setShowPasscodeSetup(prev => {
            const nextState = !prev;
            if (nextState) { // Opening setup
                 setCurrentPasscode(''); setNewPasscode(''); setConfirmPasscode('');
                 setPasscodeError(null); setPasscodeSuccess(null);
                 setTimeout(() => {
                     if (passcodeExists) currentPasscodeRef.current?.focus();
                     else newPasscodeRef.current?.focus();
                 }, 150);
            } else { // Closing setup
                Keyboard.dismiss();
            }
            return nextState;
        });
    }, [passcodeExists]);

    const handleSettingChange = useCallback(<K extends keyof ParentalSettingsData>( key: K, value: ParentalSettingsData[K] ) => {
         if (key === 'requirePasscode' && value === true) {
             if (!passcodeExists) {
                 Alert.alert(
                     "Passcode Required",
                     "You need to set a passcode before you can require it. Please set one now.",
                     [{ text: "OK", onPress: () => {
                         // Don't change requirePasscode state here, just open setup
                         togglePasscodeSetup();
                         }
                     }]
                 );
                 return; // Prevent setting requirePasscode to true locally yet
             }
         }
        // Default handling
        setLocalSettings(prev => {
            if (key === 'dailyLimitHours') { const numericValue = value as string; const filteredValue = numericValue.replace(/[^0-9]/g, ''); const num = parseInt(filteredValue, 10); let finalValue: string; if (filteredValue === '') { finalValue = ''; } else if (!isNaN(num)) { if (num === 0) finalValue = '0'; else if (num > 0 && num <= 24) finalValue = num.toString(); else if (num > 24) finalValue = '24'; else finalValue = prev.dailyLimitHours; } else { finalValue = prev.dailyLimitHours; } return { ...prev, dailyLimitHours: finalValue }; }
            else if (key === 'notifyEmails') { return { ...prev, notifyEmails: value as string[] }; }
            else if (key === 'downtimeDays') { return { ...prev, downtimeDays: value as DayOfWeek[] }; }
            else if (key === 'asdLevel') { return { ...prev, asdLevel: value as AsdLevel | null }; }
            else if (key === 'downtimeStart' || key === 'downtimeEnd') { return { ...prev, [key]: value as string}; }
            return { ...prev, [key]: value };
        });
    }, [passcodeExists, togglePasscodeSetup]);

    const handleDowntimeDayToggle = useCallback((day: DayOfWeek) => { setLocalSettings(prev => { const cD=prev.downtimeDays; const nD=cD.includes(day)?cD.filter(d=>d!==day):[...cD,day].sort((a,b)=>daysOfWeek.indexOf(a)-daysOfWeek.indexOf(b)); return{...prev,downtimeDays:nD};}); }, []);

    const handleReset = () => {
        if(hasUnsavedChanges) {
            Alert.alert( "Reset Changes?", "Discard all unsaved changes?", [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: () => {
                    console.log("Resetting settings to original.");
                    setLocalSettings(originalSettings);
                    if (showPasscodeSetup) {
                        togglePasscodeSetup();
                    }
                }}
            ]);
        }
    };

    const handleAttemptClose = useCallback(() => {
        if (hasUnsavedChanges) {
            Alert.alert( "Unsaved Changes", "Discard changes and close?", [
                 { text: "Cancel", style: "cancel" },
                 { text: "Discard", style: "destructive", onPress: onClose }
            ]);
        } else {
             onClose();
        }
     }, [hasUnsavedChanges, onClose]);

    const handleSaveChanges = async () => {
        if (!hasUnsavedChanges || isSaving || isLoadingPasscodeStatus) return; // Prevent save during initial check too

        // Consistency check: Ensure passcode exists if required *before* attempting save
        if (localSettings.requirePasscode && !passcodeExists) {
             Alert.alert("Cannot Save", "Passcode is required but not set up. Please set a passcode or disable the requirement before saving.");
             if (!showPasscodeSetup) {
                 togglePasscodeSetup();
             }
             return; // Prevent saving inconsistent state
        }
        if (localSettings.downtimeEnabled && localSettings.downtimeDays.length === 0) { Alert.alert("Incomplete Setting", "Select days for downtime or disable it."); return; }

        setIsSaving(true);
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings); // Update baseline on successful save
            setIsSaving(false);
            onClose(); // Close after successful save
        } catch (error) {
            console.error("Error saving parental controls:", error);
            Alert.alert("Error", "Could not save settings. Please try again.");
            setIsSaving(false); // Reset saving state on error
        }
    };

    const showTimePickerModal = useCallback((target: 'start' | 'end') => { setTimePickerTarget(target); setTimePickerValue(parseTime(target === 'start' ? localSettings.downtimeStart : localSettings.downtimeEnd)); setShowTimePicker(true); }, [localSettings.downtimeStart, localSettings.downtimeEnd]);
    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => { const currentDate = selectedDate || timePickerValue; if (Platform.OS === 'android') setShowTimePicker(false); if (event.type === 'set' && timePickerTarget) { const formattedTime = formatTime(currentDate); handleSettingChange(timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd', formattedTime); setTimePickerTarget(null); if (Platform.OS === 'ios') setShowTimePicker(false); } else if (event.type === 'dismissed'){ setTimePickerTarget(null); if (Platform.OS === 'ios') setShowTimePicker(false); } };
    const handleConfigureApps = useCallback(() => Alert.alert("App Limits", "Coming Soon."), []);
    const handleConfigureWeb = useCallback(() => Alert.alert("Web Filtering", "Coming Soon."), []);

    // --- Passcode Handlers ---
    const handleSetOrUpdatePasscode = useCallback(async () => {
        Keyboard.dismiss(); setPasscodeError(null); setPasscodeSuccess(null);
        if (passcodeExists && !currentPasscode) { setPasscodeError("Enter current passcode."); return; }
        if (!newPasscode || newPasscode.length < 4) { setPasscodeError("New passcode: min 4 digits."); return; }
        if (newPasscode !== confirmPasscode) { setPasscodeError("New passcodes don't match."); return; }

        setIsSettingPasscode(true);
        try {
            if (passcodeExists) {
                const verified = await KeychainService.verifyPasscode(currentPasscode);
                if (!verified) { setPasscodeError("Incorrect current passcode."); setIsSettingPasscode(false); return; }
            }
            const success = await KeychainService.setPasscode(newPasscode);
            if (success) {
                const wasFirstPasscode = !passcodeExists;
                setPasscodeSuccess("Passcode set/updated!");
                setPasscodeExists(true);
                // Ensure requirePasscode is locally ON after successful set/update
                setLocalSettings(prev => ({ ...prev, requirePasscode: true }));
                setTimeout(() => {
                     togglePasscodeSetup();
                     if (wasFirstPasscode) { Alert.alert("Passcode Set", "'Require Passcode' has been automatically enabled. Remember to save your settings."); }
                }, 1500);
            } else { setPasscodeError("Failed to save passcode. Please try again."); }
        } catch (error) { console.error("Error setting/updating passcode:", error); setPasscodeError("An unexpected error occurred."); }
        finally { setIsSettingPasscode(false); }
    }, [passcodeExists, currentPasscode, newPasscode, confirmPasscode, togglePasscodeSetup]);

     const handleRemovePasscodeClick = useCallback(async () => {
        Keyboard.dismiss(); setPasscodeError(null); setPasscodeSuccess(null);
        if (!currentPasscode) { setPasscodeError("Enter current passcode to remove."); return; }
        Alert.alert( "Remove Passcode?", "Are you sure? Passcode protection will be disabled.", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: async () => {
                setIsSettingPasscode(true);
                try {
                    const verified = await KeychainService.verifyPasscode(currentPasscode);
                    if (!verified) { setPasscodeError("Incorrect passcode."); setIsSettingPasscode(false); return; }
                    const success = await KeychainService.resetPasscode();
                    if(success) {
                        setPasscodeSuccess("Passcode removed.");
                        setPasscodeExists(false);
                        setLocalSettings(prev => ({...prev, requirePasscode: false })); // Force OFF locally
                        setTimeout(() => {
                             togglePasscodeSetup();
                             Alert.alert("Passcode Removed", "'Require Passcode' has been turned off. Remember to save settings.");
                        }, 1500);
                    } else { setPasscodeError("Failed to remove passcode."); }
                } catch (error) { console.error("Error removing passcode:", error); setPasscodeError("An unexpected error occurred."); }
                finally { setIsSettingPasscode(false); }
            }}
        ]);
    }, [currentPasscode, togglePasscodeSetup]);

    // --- Usage Reporting Handlers ---
    const toggleAddEmailInput = useCallback(() => { setShowAddEmailInput(prev => !prev); setNewNotifyEmail(''); if (showAddEmailInput) Keyboard.dismiss(); }, [showAddEmailInput]);
    const handleAddNotifyEmail = useCallback(() => { const trimmedEmail = newNotifyEmail.trim(); if (!trimmedEmail) return; if (!emailRegex.test(trimmedEmail)) { Alert.alert("Invalid Email"); return; } const lowerCaseEmail = trimmedEmail.toLowerCase(); if (localSettings.notifyEmails.some(email => email.toLowerCase() === lowerCaseEmail)) { Alert.alert("Duplicate Email"); return; } handleSettingChange('notifyEmails', [...localSettings.notifyEmails, trimmedEmail]); setNewNotifyEmail(''); setShowAddEmailInput(false); Keyboard.dismiss(); }, [newNotifyEmail, localSettings.notifyEmails, handleSettingChange]);
    const handleDeleteNotifyEmail = useCallback((emailToDelete: string) => { handleSettingChange('notifyEmails', localSettings.notifyEmails.filter(email => email !== emailToDelete)); }, [localSettings.notifyEmails, handleSettingChange]);

    // --- Pass styles object down ---
    const componentStyles = useMemo(() => ({
        ...styles, // Pass all base styles
        // Pass color constants or other derived values if needed by children
        _primaryColor: primaryColor, _darkGrey: darkGrey, _placeholderColor: placeholderColor,
        _mediumGrey: mediumGrey, _whiteColor: whiteColor, _textColor: textColor, _errorColor: errorColor,
        _lightGrey: lightGrey, _screenBackgroundColor: screenBackgroundColor, _cardBackgroundColor: cardBackgroundColor, _successColor: successColor,
    }), []);

    // Determine if Save button should be disabled
    const isSaveDisabled = isSaving || !hasUnsavedChanges || isLoadingPasscodeStatus || isSettingPasscode || (localSettings.requirePasscode && !passcodeExists);

    // --- Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel="Close Parental Controls"><FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} /></TouchableOpacity>
                    <View style={styles.titleContainer}><Text style={styles.title}>Parental Controls</Text></View>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleSaveChanges}
                        disabled={isSaveDisabled}
                        hitSlop={hitSlop}
                        accessibilityLabel="Save Settings"
                        accessibilityState={{ disabled: isSaveDisabled }}
                    >
                        {isSaving
                           ? <ActivityIndicator size="small" color={whiteColor} />
                           /* Icon color reflects save readiness */
                           : <FontAwesomeIcon icon={faSave} size={20} color={!isSaveDisabled ? whiteColor : disabledButtonColor} />
                         }
                    </TouchableOpacity>
                </View>

                {/* Render ScrollView immediately */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Sections */}
                    <ContentFilteringSection settings={localSettings} onSettingChange={handleSettingChange} onConfigureWeb={handleConfigureWeb} switchStyles={switchStyles} styles={componentStyles}/>
                    <ScreenTimeSection settings={localSettings} onSettingChange={handleSettingChange} onDayToggle={handleDowntimeDayToggle} onShowTimePicker={showTimePickerModal} switchStyles={switchStyles} styles={componentStyles} daysOfWeek={daysOfWeek}/>
                    <ChildProfileSection settings={localSettings} onSettingChange={handleSettingChange} styles={componentStyles}/>
                    <UsageReportingSection settings={localSettings} showAddEmailInput={showAddEmailInput} newNotifyEmail={newNotifyEmail} onNewEmailChange={setNewNotifyEmail} onToggleAddEmail={toggleAddEmailInput} onAddEmail={handleAddNotifyEmail} onDeleteEmail={handleDeleteNotifyEmail} styles={componentStyles}/>

                    {/* Security Section - Will show its own loading state internally */}
                    <SecuritySection
                        settings={localSettings}
                        passcodeExists={passcodeExists}
                        onSettingChange={handleSettingChange}
                        onTogglePasscodeSetup={togglePasscodeSetup}
                        isLoadingPasscodeStatus={isLoadingPasscodeStatus} // Pass loading state
                        switchStyles={switchStyles}
                        styles={componentStyles} // Pass combined styles
                    />

                    {/* Inline Passcode Setup UI (conditionally rendered based on state) */}
                    {showPasscodeSetup && (
                        <View style={styles.inlineSetupContainer}>
                            <Text style={styles.inlineSetupTitle}>{passcodeExists ? 'Change Passcode' : 'Set New Passcode'}</Text>
                            {/* Current Passcode Input */}
                            {passcodeExists && (
                                <View style={styles.inputGroupInline}>
                                    <Text style={styles.labelInline}>Current Passcode</Text>
                                    <TextInput ref={currentPasscodeRef} style={styles.inputInline} value={currentPasscode} onChangeText={setCurrentPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="next" onSubmitEditing={() => newPasscodeRef.current?.focus()} blurOnSubmit={false} autoFocus={true} />
                                </View>
                            )}
                             {/* New Passcode Input */}
                            <View style={styles.inputGroupInline}>
                                <Text style={styles.labelInline}>New Passcode (min 4 digits)</Text>
                                <TextInput ref={newPasscodeRef} style={styles.inputInline} value={newPasscode} onChangeText={setNewPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="next" onSubmitEditing={() => confirmPasscodeRef.current?.focus()} blurOnSubmit={false} autoFocus={!passcodeExists} />
                             </View>
                             {/* Confirm Passcode Input */}
                             <View style={styles.inputGroupInline}>
                                <Text style={styles.labelInline}>Confirm New Passcode</Text>
                                <TextInput ref={confirmPasscodeRef} style={styles.inputInline} value={confirmPasscode} onChangeText={setConfirmPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="done" onSubmitEditing={handleSetOrUpdatePasscode}/>
                             </View>
                             {/* Feedback Messages */}
                            {passcodeError && <Text style={styles.errorTextInline}>{passcodeError}</Text>}
                            {passcodeSuccess && <Text style={styles.successTextInline}>{passcodeSuccess}</Text>}
                             {/* Action Buttons */}
                            <View style={styles.inlineButtonRow}>
                                {passcodeExists && (<TouchableOpacity style={[styles.inlineButton, styles.removeButtonInline]} onPress={handleRemovePasscodeClick} disabled={isSettingPasscode}>{isSettingPasscode ? <ActivityIndicator size="small" color={errorColor}/> : <Text style={styles.removeButtonTextInline}>Remove</Text>}</TouchableOpacity>)}
                                <TouchableOpacity style={[styles.inlineButton, styles.cancelButtonInline]} onPress={togglePasscodeSetup} disabled={isSettingPasscode}><Text style={styles.cancelButtonTextInline}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.inlineButton, styles.saveButtonInline,
                                        (isSettingPasscode || !newPasscode || newPasscode.length < 4 || newPasscode !== confirmPasscode || (passcodeExists && !currentPasscode)) && styles.buttonDisabled
                                    ]}
                                    onPress={handleSetOrUpdatePasscode}
                                    disabled={isSettingPasscode || !newPasscode || newPasscode.length < 4 || newPasscode !== confirmPasscode || (passcodeExists && !currentPasscode) }
                                >
                                    {isSettingPasscode ? <ActivityIndicator size="small" color={whiteColor}/> : <Text style={styles.saveButtonTextInline}>{passcodeExists ? 'Update' : 'Set'}</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {/* ----------------------------------- */}

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[styles.resetButton, (!hasUnsavedChanges || isSaving || isLoadingPasscodeStatus) && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={isSaving || !hasUnsavedChanges || isLoadingPasscodeStatus} // Disable if initial check running
                    >
                         <FontAwesomeIcon icon={faUndo} size={14} color={hasUnsavedChanges && !isLoadingPasscodeStatus ? darkGrey : mediumGrey} style={styles.buttonIcon}/>
                         <Text style={[styles.resetButtonText, (!hasUnsavedChanges || isLoadingPasscodeStatus) && styles.textDisabled]}>Discard Changes</Text>
                    </TouchableOpacity>
                </ScrollView>

                 {/* Time Picker Modal */}
                {showTimePicker && ( <DateTimePicker testID="dateTimePicker" value={timePickerValue} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} /> )}
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
const errorColor = '#dc3545';
const successColor = '#198754';
const disabledButtonColor = '#a9d6e9'; // Muted blue for disabled save icon

const switchStyles = { trackColor: { false: mediumGrey, true: secondaryColor }, thumbColor: Platform.OS === 'android' ? primaryColor : undefined, ios_backgroundColor: mediumGrey, };
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Stylesheet (Consolidated) ---
const styles = StyleSheet.create({
    // Layout & Containers
    safeArea: { flex: 1, backgroundColor: primaryColor },
    container: { flex: 1, backgroundColor: screenBackgroundColor },
    scrollView: { flex: 1, },
    scrollContainer: { padding: 15, paddingBottom: 40, }, // Content padding

    // Header
    header: { backgroundColor: primaryColor, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
    title: { fontSize: 18, fontWeight: '600', color: whiteColor, textAlign: 'center' },
    headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },

    // Cards & Sections
    sectionCard: { backgroundColor: cardBackgroundColor, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: lightGrey, overflow: 'hidden', },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: lightGrey, },
    cardIcon: { marginRight: 12, width: 20, textAlign: 'center', },
    sectionTitle: { fontSize: 17, fontWeight: '600', color: textColor, flex: 1, },
    cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lightGrey, },

    // Rows within Cards
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 44, paddingHorizontal: 18, },
    featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 44, paddingHorizontal: 18, }, // For navigation-like rows
    featureIcon: { marginRight: 18, width: 20, textAlign: 'center', },
    featureLabel: { flex: 1, fontSize: 15, color: darkGrey, marginRight: 10, },
    settingIcon: { marginRight: 18, width: 20, textAlign: 'center' },
    settingLabel: { flex: 1, fontSize: 15, color: textColor, marginRight: 10 },
    infoText: { fontSize: 13, color: darkGrey, paddingVertical: 15, textAlign: 'left', paddingHorizontal: 18, },

    // Input Elements & Controls
    timeInputContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    timeInput: { height: 40, width: 55, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, paddingHorizontal: 8, backgroundColor: whiteColor, fontSize: 15, color: textColor, textAlign: 'center' },
    timeInputLabel: { marginLeft: 8, fontSize: 14, color: darkGrey },
    fieldLabel: { fontSize: 14, color: darkGrey, fontWeight: '500', marginBottom: 12 },
    optionsList: { marginTop: 0, paddingHorizontal: 18, paddingBottom: 10 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: whiteColor, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1.5, borderColor: mediumGrey, marginBottom: 10, },
    optionCardSelected: { borderColor: primaryColor, backgroundColor: '#e7f5ff' },
    optionIcon: { marginRight: 15, width: 25, textAlign: 'center'},
    optionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: textColor },
    optionLabelSelected: { color: primaryColor, fontWeight: 'bold' },
    radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: mediumGrey, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    radioOuterSelected: { borderColor: primaryColor },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: primaryColor },

    // Day/Time Selection
    downtimeDetails: { marginTop: 15, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lightGrey, paddingHorizontal: 18, paddingBottom: 10 },
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

    // Email List / Usage Reporting Specific
    emailListContainer: { paddingHorizontal: 18, paddingBottom: 10, /* Removed top border/margin */ },
    emailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', },
    emailText: { flex: 1, fontSize: 15, color: textColor, marginRight: 10, },
    deleteEmailButton: { padding: 5, }, // Add hitSlop if needed
    noEmailsText: { fontStyle: 'italic', color: darkGrey, textAlign: 'center', paddingVertical: 15, },
    addEmailContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 15, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee', },
    addEmailInput: { flex: 1, height: 44, borderColor: mediumGrey, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginRight: 10, fontSize: 15, backgroundColor: whiteColor, },
    addEmailConfirmButton: { backgroundColor: primaryColor, padding: 10, height: 44, width: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', },
    addEmailToggleButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: lightGrey, marginTop: 5 },
    addEmailToggleText: { fontSize: 15, color: primaryColor, fontWeight: '500', },

    // General Buttons & States
    resetButton: { flexDirection: 'row', alignSelf: 'center', marginTop: 25, marginBottom: 10, paddingVertical: 10, paddingHorizontal: 20, },
    resetButtonText: { fontSize: 14, color: darkGrey, fontWeight: '600', textDecorationLine: 'underline', },
    clearButton: { marginTop: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 }, // For ASD level clear
    clearButtonText: { fontSize: 14, color: primaryColor, fontWeight: '500' },
    buttonIcon: { marginRight: 8, },
    buttonDisabled: { opacity: 0.6, }, // General disabled style for buttons/touchables
    textDisabled: { color: mediumGrey, textDecorationLine: 'none', }, // For disabled text elements

    // Inline Passcode Setup Styles
    inlineSetupContainer: { marginTop: -1, // Overlaps border slightly
        paddingTop: 20, paddingHorizontal: 18, paddingBottom: 20, backgroundColor: '#f0f4f8', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderTopWidth: 0, borderColor: lightGrey, marginBottom: 20, },
    inlineSetupTitle: { fontSize: 16, fontWeight: '600', color: darkGrey, marginBottom: 20, textAlign: 'center', },
    inputGroupInline: { marginBottom: 15, },
    labelInline: { fontSize: 13, fontWeight: '500', color: darkGrey, marginBottom: 5, },
    inputInline: { backgroundColor: whiteColor, height: 46, borderColor: mediumGrey, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: textColor, },
    errorTextInline: { color: errorColor, textAlign: 'center', marginTop: 5, marginBottom: 10, fontSize: 14, fontWeight: '500', },
    successTextInline: { color: successColor, textAlign: 'center', marginTop: 5, marginBottom: 10, fontSize: 14, fontWeight: '500', },
    inlineButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, gap: 10, },
    inlineButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 44, flexShrink: 1, flexGrow: 0, },
    saveButtonInline: { backgroundColor: primaryColor, paddingHorizontal: 20, },
    saveButtonTextInline: { color: whiteColor, fontSize: 15, fontWeight: 'bold', },
    removeButtonInline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: errorColor, marginRight: 'auto', }, // Pushes to left
    removeButtonTextInline: { color: errorColor, fontSize: 15, fontWeight: 'bold', },
    cancelButtonInline: { backgroundColor: lightGrey, borderWidth: 1.5, borderColor: mediumGrey, },
    cancelButtonTextInline: { color: darkGrey, fontSize: 15, fontWeight: '600', },

});

export default ParentalControls;