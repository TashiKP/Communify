// src/components/ParentalControls.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Keyboard, TextInput, Switch
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faLock, faCheck, faTimes,
    faShieldAlt, // Example icon for Content Filtering
    faClock,     // Example icon for Screen Time
    faChild,     // Example icon for Child Profile
    faEnvelopeOpenText, // Example icon for Usage Reporting
    faKey        // Example icon for Security
} from '@fortawesome/free-solid-svg-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as KeychainService from '../services/keychainService'; // Adjust path
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path if needed

// --- Import Local Types & Components ---
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

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const ERROR_COLOR_HEX = '#dc3545';
const SUCCESS_COLOR_HEX = '#198754';

// --- Component ---
const ParentalControls: React.FC<ParentalControlsProps> = ({
    onClose,
    initialSettings,
    onSave
}) => {
    // --- Hooks ---
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // --- State ---
    const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
    const [originalSettings, setOriginalSettings] = useState<ParentalSettingsData>(() => ({ ...defaultSettings, ...initialSettings }));
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
    const hasUnsavedChanges = useMemo(() => JSON.stringify(localSettings) !== JSON.stringify(originalSettings), [localSettings, originalSettings]);

    // --- Function to check passcode status ---
    const checkPasscodeStatus = useCallback(async () => {
        if (!isMountedRef.current) return;
        setIsLoadingPasscodeStatus(true);
        try {
            const exists = await KeychainService.hasPasscode();
            if (isMountedRef.current) setPasscodeExists(exists);
        } catch (error) {
             console.error("ParentalControls: Failed to check passcode status:", error);
             if (isMountedRef.current) setPasscodeExists(false);
        } finally {
             if (isMountedRef.current) setIsLoadingPasscodeStatus(false);
        }
     }, []);

    // --- Effects ---
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        const mergedInitial = { ...defaultSettings, ...initialSettings };
        setLocalSettings(mergedInitial);
        setOriginalSettings(mergedInitial);
        setShowTimePicker(false); setShowAddEmailInput(false); setNewNotifyEmail('');
        setIsSaving(false); setShowPasscodeSetup(false);
        setCurrentPasscode(''); setNewPasscode(''); setConfirmPasscode('');
        setPasscodeError(null); setPasscodeSuccess(null);
    }, [initialSettings]);

    useEffect(() => {
        checkPasscodeStatus();
    }, [checkPasscodeStatus]);

    useEffect(() => {
        if (!isLoadingPasscodeStatus && typeof t === 'function') {
            if (localSettings.requirePasscode && !passcodeExists) {
                if (localSettings.requirePasscode) {
                    setLocalSettings(prev => ({ ...prev, requirePasscode: false }));
                }
                if (!showPasscodeSetup) {
                    Alert.alert(t('parentalControls.passcodeAlertTitle'), t('parentalControls.passcodeAlertMessage'));
                }
            }
        }
    }, [isLoadingPasscodeStatus, localSettings.requirePasscode, passcodeExists, showPasscodeSetup, t]);

    // --- Handlers ---
    const togglePasscodeSetup = useCallback(() => {
        setShowPasscodeSetup(prev => {
            const nextState = !prev;
            if (nextState) {
                setCurrentPasscode(''); setNewPasscode(''); setConfirmPasscode('');
                setPasscodeError(null); setPasscodeSuccess(null);
                setTimeout(() => {
                    if (isMountedRef.current) {
                        if (passcodeExists) currentPasscodeRef.current?.focus();
                        else newPasscodeRef.current?.focus();
                    }
                }, 150);
            } else { Keyboard.dismiss(); }
            return nextState;
        });
    }, [passcodeExists]);

    const handleSettingChange = useCallback(<K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => {
        if (key === 'requirePasscode' && value === true) {
            if (!passcodeExists) {
                Alert.alert(t('parentalControls.passcodeRequiredTitle'), t('parentalControls.passcodeRequiredMessage'), [{ text: t('common.ok'), onPress: togglePasscodeSetup }]);
                return;
            }
        }
        setLocalSettings(prev => {
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
    }, [passcodeExists, togglePasscodeSetup, t]);

    const handleDowntimeDayToggle = useCallback((day: DayOfWeek) => {
        setLocalSettings(prev => {
            const newDays = prev.downtimeDays.includes(day)
                ? prev.downtimeDays.filter(d => d !== day)
                : [...prev.downtimeDays, day];
            return { ...prev, downtimeDays: newDays };
        });
    }, []);

    const handleReset = () => {
        if(hasUnsavedChanges) {
            Alert.alert(t('parentalControls.resetConfirmTitle'),t('parentalControls.resetConfirmMessage'),[{ text: t('common.cancel'), style: "cancel" },{ text: t('common.reset'), style: "destructive", onPress: () => { setLocalSettings(originalSettings); if (showPasscodeSetup) togglePasscodeSetup(); }}]);
        }
    };

    const handleAttemptClose = useCallback(() => {
        if (hasUnsavedChanges) {
            Alert.alert(t('parentalControls.unsavedChangesTitle'),t('parentalControls.unsavedChangesMessage'),[{ text: t('common.cancel'), style: "cancel" },{ text: t('common.discard'), style: "destructive", onPress: onClose }]);
        } else { onClose(); }
    }, [hasUnsavedChanges, onClose, t]);

    const handleSaveChanges = async () => {
        if (!hasUnsavedChanges || isSaving || isLoadingPasscodeStatus || isLoadingAppearance) return;
        if (localSettings.requirePasscode && !passcodeExists) { Alert.alert(t('parentalControls.errors.saveFailTitle'), t('parentalControls.errors.passcodeNotSet')); if (!showPasscodeSetup) togglePasscodeSetup(); return; }
        if (localSettings.downtimeEnabled && localSettings.downtimeDays.length === 0) { Alert.alert(t('parentalControls.errors.incompleteDowntimeTitle'), t('parentalControls.errors.incompleteDowntimeMessage')); return; }
        setIsSaving(true);
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings);
            onClose();
        } catch (error) {
            console.error("Error saving parental controls:", error);
            Alert.alert(t('common.error'), t('parentalControls.errors.saveFail'));
            if(isMountedRef.current) setIsSaving(false);
        } finally {
            if(isMountedRef.current && isSaving) setIsSaving(false);
        }
    };

    const showTimePickerModal = useCallback((target: 'start' | 'end') => {
        setTimePickerTarget(target);
        setTimePickerValue(parseTime(target === 'start' ? localSettings.downtimeStart : localSettings.downtimeEnd));
        setShowTimePicker(true);
    }, [localSettings.downtimeStart, localSettings.downtimeEnd]);

    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || timePickerValue;
        if (Platform.OS === 'android') { setShowTimePicker(false); }
        if (event.type === 'set' && timePickerTarget) {
            const formattedTime = formatTime(currentDate);
            handleSettingChange(timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd', formattedTime);
            if (Platform.OS === 'ios') setShowTimePicker(false);
            setTimePickerTarget(null);
        } else if (event.type === 'dismissed' || event.type === 'neutralButtonPressed') {
            setShowTimePicker(false);
            setTimePickerTarget(null);
        }
    };
    const handleConfigureApps = useCallback(() => Alert.alert(t('parentalControls.appLimitsTitle'), t('parentalControls.comingSoon')), [t]);
    const handleConfigureWeb = useCallback(() => Alert.alert(t('parentalControls.webFilteringTitle'), t('parentalControls.comingSoon')), [t]);

    const handleSetOrUpdatePasscode = useCallback(async () => {
        Keyboard.dismiss(); setPasscodeError(null); setPasscodeSuccess(null);
        if (passcodeExists && !currentPasscode) { setPasscodeError(t('parentalControls.passcode.errorEnterCurrent')); return; }
        if (!newPasscode || newPasscode.length < 4) { setPasscodeError(t('parentalControls.passcode.errorNewMinLength')); return; }
        if (newPasscode !== confirmPasscode) { setPasscodeError(t('parentalControls.passcode.errorMismatch')); return; }
        setIsSettingPasscode(true);
        try {
            if (passcodeExists) { const verified = await KeychainService.verifyPasscode(currentPasscode); if (!verified) { setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent')); setIsSettingPasscode(false); return; }}
            const success = await KeychainService.setPasscode(newPasscode);
            if (success) { const wasFirstPasscode = !passcodeExists; setPasscodeSuccess(t('parentalControls.passcode.successSetUpdate')); setPasscodeExists(true); setLocalSettings(prev => ({ ...prev, requirePasscode: true })); setTimeout(() => { if(isMountedRef.current) { togglePasscodeSetup(); if (wasFirstPasscode) { Alert.alert(t('parentalControls.passcode.successTitle'), t('parentalControls.passcode.successRequireEnabledMessage')); }}}, 1500);
            } else { setPasscodeError(t('parentalControls.passcode.errorSaveFailed')); }
        } catch (error) { console.error("Error setting/updating passcode:", error); setPasscodeError(t('parentalControls.passcode.errorUnexpected')); }
        finally { if(isMountedRef.current) setIsSettingPasscode(false); }
    }, [passcodeExists, currentPasscode, newPasscode, confirmPasscode, togglePasscodeSetup, t]);

    const handleRemovePasscodeClick = useCallback(async () => {
        Keyboard.dismiss(); setPasscodeError(null); setPasscodeSuccess(null);
        if (!currentPasscode) { setPasscodeError(t('parentalControls.passcode.errorEnterCurrentToRemove')); return; }
        Alert.alert( t('parentalControls.passcode.removeConfirmTitle'), t('parentalControls.passcode.removeConfirmMessage'), [{ text: t('common.cancel'), style: "cancel" },{ text: t('common.remove'), style: "destructive", onPress: async () => {
            setIsSettingPasscode(true);
            try {
                const verified = await KeychainService.verifyPasscode(currentPasscode); if (!verified) { setPasscodeError(t('parentalControls.passcode.errorIncorrectCurrent')); setIsSettingPasscode(false); return; }
                const success = await KeychainService.resetPasscode();
                if(success) { setPasscodeSuccess(t('parentalControls.passcode.successRemoved')); setPasscodeExists(false); setLocalSettings(prev => ({...prev, requirePasscode: false })); setTimeout(() => { if(isMountedRef.current){ togglePasscodeSetup(); Alert.alert(t('parentalControls.passcode.successRemovedTitle'), t('parentalControls.passcode.successRequireDisabledMessage')); }}, 1500);
                } else { setPasscodeError(t('parentalControls.passcode.errorRemoveFailed')); }
            } catch (error) { console.error("Error removing passcode:", error); setPasscodeError(t('parentalControls.passcode.errorUnexpected')); }
            finally { if(isMountedRef.current) setIsSettingPasscode(false); }
        }}]);
    }, [currentPasscode, togglePasscodeSetup, t]);

    const toggleAddEmailInput = useCallback(() => { setShowAddEmailInput(prev => !prev); setNewNotifyEmail(''); if (showAddEmailInput) Keyboard.dismiss(); }, [showAddEmailInput]);
    const handleAddNotifyEmail = useCallback(() => {
        const trimmedEmail = newNotifyEmail.trim(); if (!trimmedEmail) return;
        if (!emailRegex.test(trimmedEmail)) { Alert.alert(t('parentalControls.errors.invalidEmail')); return; }
        const lowerCaseEmail = trimmedEmail.toLowerCase();
        if (localSettings.notifyEmails.some(email => email.toLowerCase() === lowerCaseEmail)) { Alert.alert(t('parentalControls.errors.duplicateEmail')); return; }
        handleSettingChange('notifyEmails', [...localSettings.notifyEmails, trimmedEmail]); setNewNotifyEmail(''); setShowAddEmailInput(false); Keyboard.dismiss();
    }, [newNotifyEmail, localSettings.notifyEmails, handleSettingChange, t]);

    const handleDeleteNotifyEmail = useCallback((emailToDelete: string) => { handleSettingChange('notifyEmails', localSettings.notifyEmails.filter(email => email !== emailToDelete)); }, [localSettings.notifyEmails, handleSettingChange]);

    // --- Loading/Saving States ---
    const isLoadingInitialContext = isLoadingAppearance || isLoadingPasscodeStatus; // Renamed for clarity
    const isSaveDisabled = isSaving || !hasUnsavedChanges || isLoadingInitialContext || isSettingPasscode || (localSettings.requirePasscode && !passcodeExists);
    const isResetDisabled = isSaving || !hasUnsavedChanges || isLoadingInitialContext || isSettingPasscode;

    // --- Render Guard for i18n ---
    if (!i18n.isInitialized || typeof t !== 'function') {
        return (
            <SafeAreaView style={styles.screenContainer}>
                <View style={[styles.contentArea, {justifyContent: 'center', alignItems: 'center'}]}>
                    <ActivityIndicator size="large" color={theme.primary || '#0077b6'} />
                    <Text style={styles.loadingText}>Loading Interface...</Text>
                </View>
            </SafeAreaView>
        );
    }
    if (isLoadingInitialContext && !showPasscodeSetup) { // Avoid overlaying passcode UI
        return (
            <SafeAreaView style={styles.screenContainer}>
                 <View style={styles.header}>
                     <View style={styles.headerButton} />
                     <View style={styles.titleContainer}><Text style={styles.title}>{t('parentalControls.title')}</Text></View>
                     <View style={styles.headerButton} />
                 </View>
                <View style={[styles.contentArea, {justifyContent: 'center', alignItems: 'center'}]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>{t('parentalControls.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.screenContainer}>
            <View style={styles.header}>
                 <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel={t('common.goBack')}>
                    <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
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
                    {isSaving ? <ActivityIndicator size="small" color={theme.white} /> : <FontAwesomeIcon icon={faSave} size={fonts.h2 * 0.9} color={!isSaveDisabled ? theme.white : theme.disabled} /> }
                 </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.contentArea}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Sections - Pass t function to subsections */}
                <ContentFilteringSection settings={localSettings} onSettingChange={handleSettingChange} onConfigureWeb={handleConfigureWeb} t={t} sectionStyle={styles.sectionCard} headerStyle={styles.sectionHeader} titleStyle={styles.sectionTitle} iconStyle={styles.sectionIcon} />
                <ScreenTimeSection settings={localSettings} onSettingChange={handleSettingChange} onDayToggle={handleDowntimeDayToggle} onShowTimePicker={showTimePickerModal} daysOfWeek={daysOfWeek} t={t} sectionStyle={styles.sectionCard} headerStyle={styles.sectionHeader} titleStyle={styles.sectionTitle} iconStyle={styles.sectionIcon}/>
                <ChildProfileSection settings={localSettings} onSettingChange={handleSettingChange} t={t} sectionStyle={styles.sectionCard} headerStyle={styles.sectionHeader} titleStyle={styles.sectionTitle} iconStyle={styles.sectionIcon}/>
                <UsageReportingSection settings={localSettings} showAddEmailInput={showAddEmailInput} newNotifyEmail={newNotifyEmail} onNewEmailChange={setNewNotifyEmail} onToggleAddEmail={toggleAddEmailInput} onAddEmail={handleAddNotifyEmail} onDeleteEmail={handleDeleteNotifyEmail} t={t} sectionStyle={styles.sectionCard} headerStyle={styles.sectionHeader} titleStyle={styles.sectionTitle} iconStyle={styles.sectionIcon}/>
                <SecuritySection
                    settings={localSettings}
                    passcodeExists={passcodeExists}
                    onSettingChange={handleSettingChange}
                    onTogglePasscodeSetup={togglePasscodeSetup}
                    isLoadingPasscodeStatus={isLoadingPasscodeStatus} // Pass this if SecuritySection needs it
                    t={t}
                    sectionStyle={styles.sectionCard}
                    headerStyle={styles.sectionHeader}
                    titleStyle={styles.sectionTitle}
                    iconStyle={styles.sectionIcon}
                />

                {/* Inline Passcode Setup UI */}
                {showPasscodeSetup && (
                    <View style={styles.passcodeSetupCard}>
                        <Text style={styles.passcodeSetupTitle}>{passcodeExists ? t('parentalControls.passcode.changeTitle') : t('parentalControls.passcode.setTitle')}</Text>
                        {passcodeExists && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('parentalControls.passcode.currentLabel')}</Text>
                                <TextInput ref={currentPasscodeRef} style={styles.textInput} value={currentPasscode} onChangeText={setCurrentPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="next" onSubmitEditing={() => newPasscodeRef.current?.focus()} blurOnSubmit={false} autoFocus={true} placeholderTextColor={theme.disabled} selectionColor={theme.primary} />
                            </View>
                        )}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('parentalControls.passcode.newLabel')}</Text>
                            <TextInput ref={newPasscodeRef} style={styles.textInput} value={newPasscode} onChangeText={setNewPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="next" onSubmitEditing={() => confirmPasscodeRef.current?.focus()} blurOnSubmit={false} autoFocus={!passcodeExists} placeholderTextColor={theme.disabled} selectionColor={theme.primary} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{t('parentalControls.passcode.confirmLabel')}</Text>
                            <TextInput ref={confirmPasscodeRef} style={styles.textInput} value={confirmPasscode} onChangeText={setConfirmPasscode} keyboardType="number-pad" secureTextEntry maxLength={10} returnKeyType="done" onSubmitEditing={handleSetOrUpdatePasscode} placeholderTextColor={theme.disabled} selectionColor={theme.primary}/>
                        </View>
                        {passcodeError && <Text style={styles.passcodeFeedbackError}>{passcodeError}</Text>}
                        {passcodeSuccess && <Text style={styles.passcodeFeedbackSuccess}>{passcodeSuccess}</Text>}
                        <View style={styles.passcodeActionsRow}>
                            {passcodeExists && ( <TouchableOpacity style={[styles.passcodeActionButton, styles.removeButton]} onPress={handleRemovePasscodeClick} disabled={isSettingPasscode} accessibilityLabel={t('common.remove')}> {isSettingPasscode ? <ActivityIndicator size="small" color={ERROR_COLOR_HEX}/> : <Text style={styles.removeButtonText}>{t('common.remove')}</Text>} </TouchableOpacity> )}
                            <TouchableOpacity style={[styles.passcodeActionButton, styles.cancelButton]} onPress={togglePasscodeSetup} disabled={isSettingPasscode} accessibilityLabel={t('common.cancel')}><Text style={styles.cancelButtonText}>{t('common.cancel')}</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.passcodeActionButton, styles.saveButton,(isSettingPasscode || !newPasscode || newPasscode.length < 4 || newPasscode !== confirmPasscode || (passcodeExists && !currentPasscode)) && styles.buttonDisabled]} onPress={handleSetOrUpdatePasscode} disabled={isSettingPasscode || !newPasscode || newPasscode.length < 4 || newPasscode !== confirmPasscode || (passcodeExists && !currentPasscode) } accessibilityLabel={passcodeExists ? t('common.update') : t('common.set')} >{isSettingPasscode ? <ActivityIndicator size="small" color={theme.white}/> : <Text style={styles.saveButtonText}>{passcodeExists ? t('common.update') : t('common.set')}</Text>}</TouchableOpacity>
                        </View>
                    </View>
                )}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]} onPress={handleReset} disabled={isResetDisabled} accessibilityLabel={t('common.resetChanges')}>
                         <FontAwesomeIcon icon={faUndo} size={fonts.label} color={!isResetDisabled ? theme.textSecondary : theme.disabled} style={styles.buttonIcon}/>
                         <Text style={[styles.resetButtonText, isResetDisabled && styles.textDisabled]}>{t('common.resetChanges')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>


            {showTimePicker && ( <DateTimePicker testID="dateTimePicker" value={timePickerValue} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} textColor={theme.text} accentColor={theme.primary} themeVariant={theme.isDark ? 'dark' : 'light'} /> )}
        </SafeAreaView>
    );
};

// --- Styles ---
// It's recommended to add 'error' and 'success' color properties to your ThemeColors interface
// in AppearanceContext.ts for better theming consistency.
const createThemedStyles = (
    theme: ThemeColors,
    fonts: FontSizes,
    currentLanguage: string
) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
    const buttonTextStyles = getLanguageSpecificTextStyle('button', fonts, currentLanguage); // For button text

    return StyleSheet.create({
        screenContainer: { flex: 1, backgroundColor: theme.primary },
        header: {
            backgroundColor: theme.primary,
            paddingTop: Platform.OS === 'android' ? 10 : 0,
            paddingBottom: 12,
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
        },
        titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
        title: {
            ...h2Styles,
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
        contentArea: { flex: 1, backgroundColor: theme.background },
        scrollContentContainer: { flexGrow: 1, padding: 15, paddingBottom: 40 },
        loadingText: { // For initial i18n loading & context loading
            ...bodyStyles,
            color: theme.textSecondary, // Use a secondary color for loading text
            marginTop: 15,
        },
        sectionCard: { // Common style for all sections
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 15, // Uniform padding
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.3 : 0.1,
            shadowRadius: 3,
            elevation: 2,
            borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.border,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        sectionIcon: { // Icon for the section header
            marginRight: 12,
            width: fonts.h2 * 0.7, // Base icon size on h2
            textAlign: 'center',
            color: theme.primary, // Default icon color for sections
        },
        sectionTitle: { // Title within each section card
            ...labelStyles, // Using 'label' for section titles as it's smaller than main 'h2'
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        // Styles for the inline passcode setup (mimicking sectionCard)
        passcodeSetupCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 20, // More padding for focused UI
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.isDark ? 0.35 : 0.15,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.border,
        },
        passcodeSetupTitle: {
            ...labelStyles, // Consistent with section titles
            fontWeight: '600',
            color: theme.textSecondary, // Slightly muted for sub-section title
            marginBottom: 25,
            textAlign: 'center',
        },
        inputGroup: { // For passcode TextInput groups
            marginBottom: 18,
        },
        inputLabel: { // Label for TextInputs
            ...captionStyles, // Using caption for input labels, slightly smaller
            fontWeight: '500',
            color: theme.textSecondary,
            marginBottom: 6,
        },
        textInput: { // For all TextInputs
            ...bodyStyles,
            backgroundColor: theme.background, // Input field background
            height: 48, // Consistent height
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            color: theme.text,
        },
        passcodeFeedbackError: {
            ...captionStyles, // Using caption for feedback text
            color: ERROR_COLOR_HEX,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 12,
            fontWeight: '500',
        },
        passcodeFeedbackSuccess: {
            ...captionStyles,
            color: SUCCESS_COLOR_HEX,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 12,
            fontWeight: '500',
        },
        passcodeActionsRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20,
            gap: 10, // Spacing between buttons
        },
        passcodeActionButton: { // Base style for passcode action buttons
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            flexShrink: 1,
        },
        saveButton: { // Save button in passcode section
            backgroundColor: theme.primary,
            paddingHorizontal: 20, // More padding for primary action
        },
        saveButtonText: {
            ...buttonTextStyles,
            color: theme.white,
            fontWeight: 'bold',
        },
        removeButton: { // Remove button in passcode section
            backgroundColor: 'transparent', // Keep transparent
            borderWidth: 1.5,
            borderColor: ERROR_COLOR_HEX,
            marginRight: 'auto', // Pushes to the left
        },
        removeButtonText: {
            ...buttonTextStyles,
            color: ERROR_COLOR_HEX,
            fontWeight: 'bold',
        },
        cancelButton: { // Cancel button in passcode section
            backgroundColor: theme.card, // Subtle background
            borderWidth: 1.5,
            borderColor: theme.border,
        },
        cancelButtonText: {
            ...buttonTextStyles,
            color: theme.textSecondary, // Muted color
            fontWeight: '600',
        },
        actionsContainer: { // For the main reset button at the bottom
            marginTop: 25,
            alignItems: 'center',
        },
        resetButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        resetButtonText: {
            ...labelStyles, // Use label for reset button text
            color: theme.textSecondary,
            fontWeight: '500', // Consistent with DisplayOptions
            textDecorationLine: 'underline',
        },
        buttonIcon: { marginRight: 8 },
        buttonDisabled: { opacity: 0.5 },
        textDisabled: {
            color: theme.disabled,
            textDecorationLine: 'none',
        },
    });
};

export default ParentalControls;