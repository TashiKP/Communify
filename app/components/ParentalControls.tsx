import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, Platform,
    Switch, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faCheck, faClock, faUserShield, faShieldAlt, faChild, faChevronRight,
    faGlobe, faMobileAlt, faBed, faLock, faSave, faUndo, faBan, faHourglassHalf,
    faCalendarAlt, faEyeSlash, faHeart
} from '@fortawesome/free-solid-svg-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// --- Types ---
export type AsdLevel = 'high' | 'medium' | 'low' | 'noAsd';
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ParentalSettingsData {
    blockViolence: boolean;
    blockInappropriate: boolean;
    dailyLimitHours: string;
    asdLevel: AsdLevel | null;
    downtimeEnabled: boolean;
    downtimeDays: DayOfWeek[];
    downtimeStart: string; // HH:MM
    downtimeEnd: string;   // HH:MM
    requirePasscode: boolean;
}

// --- Props Interface ---
interface ParentalControlsProps {
    visible: boolean;
    onClose: () => void;
    initialSettings: ParentalSettingsData;
    onSave: (settings: ParentalSettingsData) => Promise<void> | void;
}

// --- Default Settings ---
const defaultSettings: ParentalSettingsData = {
    blockViolence: false,
    blockInappropriate: false,
    dailyLimitHours: '',
    asdLevel: null,
    downtimeEnabled: false,
    downtimeDays: [],
    downtimeStart: '21:00',
    downtimeEnd: '07:00',
    requirePasscode: false,
};

// --- Utility Functions ---
const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const parseTime = (timeString: string): Date => {
    const timeParts = timeString?.split(':');
    const hours = parseInt(timeParts?.[0] ?? '0', 10);
    const minutes = parseInt(timeParts?.[1] ?? '0', 10);
    const date = new Date();
    if (!isNaN(hours) && !isNaN(minutes)) {
        date.setHours(hours, minutes, 0, 0);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date;
};

const daysOfWeek: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Component ---
const ParentalControls: React.FC<ParentalControlsProps> = ({
    visible,
    onClose,
    initialSettings,
    onSave
}) => {
    // --- Local State ---
    const [localSettings, setLocalSettings] = useState<ParentalSettingsData>(initialSettings);
    const [originalSettings, setOriginalSettings] = useState<ParentalSettingsData>(initialSettings);
    const [isSaving, setIsSaving] = useState(false);

    // --- Time Picker State ---
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
    const [timePickerValue, setTimePickerValue] = useState<Date>(new Date());

    // --- Memoize ---
    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
    }, [localSettings, originalSettings]);

    // --- Effects ---
    useEffect(() => {
        if (visible) {
            setLocalSettings(initialSettings);
            setOriginalSettings(initialSettings);
            setIsSaving(false);
            setShowTimePicker(false);
        }
    }, [visible, initialSettings]);

    // --- Handlers ---
    const handleSettingChange = <K extends keyof ParentalSettingsData>(
        key: K,
        value: ParentalSettingsData[K]
    ) => {
        if (key === 'dailyLimitHours') {
            const numericValue = value as string;
            const filteredValue = numericValue.replace(/[^0-9]/g, '');
            const num = parseInt(filteredValue, 10);

            if (filteredValue === '') {
                 setLocalSettings(prev => ({ ...prev, [key]: '' }));
            } else if (!isNaN(num) && num >= 0 && num <= 24) {
                setLocalSettings(prev => ({ ...prev, [key]: num.toString() }));
            } else if (!isNaN(num) && num > 24) {
                setLocalSettings(prev => ({ ...prev, [key]: '24' }));
            }
        } else {
            setLocalSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleDowntimeDayToggle = (day: DayOfWeek) => {
        setLocalSettings(prev => {
            const currentDays = prev.downtimeDays;
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day].sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
            return { ...prev, downtimeDays: newDays };
        });
    };

    const handleReset = () => {
        Alert.alert(
            "Reset Changes?",
            "Discard changes and revert to the last saved settings?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: () => setLocalSettings(originalSettings) }
            ]
        );
    };

    const handleAttemptClose = useCallback(() => {
        if (hasUnsavedChanges) {
        Alert.alert(
            "Unsaved Changes",
            "You have unsaved changes. Discard them and close?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Discard", style: "destructive", onPress: onClose }
            ]
        );
        } else {
        onClose();
        }
    }, [hasUnsavedChanges, onClose]);

    const handleSaveChanges = async () => {
        if (!hasUnsavedChanges) return;

        if (localSettings.downtimeEnabled && localSettings.downtimeDays.length === 0) {
            Alert.alert("Incomplete Setting", "Please select at least one day for the downtime schedule or disable downtime.");
            return;
        }

        setIsSaving(true);
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings);
            onClose();
        } catch (error) {
            console.error("Error saving parental controls:", error);
            Alert.alert("Error", "Could not save settings. Please try again.");
            setIsSaving(false);
        }
    };

    // --- Time Picker Handlers ---
     const showTimePickerModal = (target: 'start' | 'end') => {
        setTimePickerTarget(target);
        const currentTime = target === 'start' ? localSettings.downtimeStart : localSettings.downtimeEnd;
        setTimePickerValue(parseTime(currentTime));
        setShowTimePicker(true);
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || timePickerValue;
        if (Platform.OS === 'android') {
             setShowTimePicker(false);
        }

        if (event.type === 'set' && timePickerTarget) {
             const formattedTime = formatTime(currentDate);
             handleSettingChange(timePickerTarget === 'start' ? 'downtimeStart' : 'downtimeEnd', formattedTime);
             setTimePickerTarget(null);
             if (Platform.OS === 'ios') {
                 setShowTimePicker(false);
             }
        } else if (event.type === 'dismissed'){
             setTimePickerTarget(null);
             if (Platform.OS === 'ios') {
                 setShowTimePicker(false);
             }
        }
    };


    // Placeholders
    const handleConfigureApps = () => Alert.alert("App Limits", "Configure allowed apps (Coming Soon).");
    const handleConfigureWeb = () => Alert.alert("Web Filtering", "Configure web restrictions (Coming Soon).");
    const handleConfigurePasscode = () => Alert.alert("Security", "Set parental passcode (Coming Soon).");


    // --- Render ---
    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleAttemptClose} >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header remains fixed */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop}>
                            <FontAwesomeIcon icon={faTimes} size={20} color={whiteColor} />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}><Text style={styles.title}>Parental Controls</Text></View>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleSaveChanges}
                            disabled={isSaving || !hasUnsavedChanges}
                            hitSlop={hitSlop}
                         >
                             {isSaving
                                ? <ActivityIndicator size="small" color={whiteColor} />
                                : <FontAwesomeIcon icon={faCheck} size={20} color={hasUnsavedChanges ? whiteColor : disabledButtonColor} />
                             }
                        </TouchableOpacity>
                    </View>

                    {/* ScrollView wraps content below header */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContainer} // Uses padding
                        keyboardShouldPersistTaps="handled"
                     >

                        {/* Content Filtering */}
                        <View style={styles.sectionCard}>
                            <View style={styles.cardHeader}>
                                <FontAwesomeIcon icon={faShieldAlt} size={18} color={primaryColor} style={styles.cardIcon}/>
                                <Text style={styles.sectionTitle}>Content Filtering</Text>
                            </View>
                            <View style={styles.settingRow}>
                                <FontAwesomeIcon icon={faBan} size={20} color={darkGrey} style={styles.settingIcon}/>
                                <Text style={styles.settingLabel}>Block Violent Content</Text>
                                <Switch value={localSettings.blockViolence} onValueChange={(v) => handleSettingChange('blockViolence', v)} {...switchStyles}/>
                            </View>
                             <View style={styles.settingRow}>
                                 <FontAwesomeIcon icon={faEyeSlash} size={20} color={darkGrey} style={styles.settingIcon}/>
                                <Text style={styles.settingLabel}>Block Inappropriate Content</Text>
                                <Switch value={localSettings.blockInappropriate} onValueChange={(v) => handleSettingChange('blockInappropriate', v)} {...switchStyles} />
                            </View>
                            <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.featureRow} onPress={handleConfigureWeb} activeOpacity={0.6}>
                                    <FontAwesomeIcon icon={faGlobe} size={18} color={darkGrey} style={styles.featureIcon}/>
                                    <Text style={styles.featureLabel}>Web Filtering Rules</Text>
                                    <FontAwesomeIcon icon={faChevronRight} size={16} color={placeholderColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                         {/* App Management */}
                         <View style={styles.sectionCard}>
                             <View style={styles.cardHeader}>
                                 <FontAwesomeIcon icon={faMobileAlt} size={18} color={primaryColor} style={styles.cardIcon}/>
                                <Text style={styles.sectionTitle}>App Management</Text>
                             </View>
                             <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.featureRow} onPress={handleConfigureApps} activeOpacity={0.6}>
                                    <FontAwesomeIcon icon={faMobileAlt} size={18} color={darkGrey} style={styles.featureIcon}/>
                                    <Text style={styles.featureLabel}>Allowed Apps & Limits</Text>
                                    <FontAwesomeIcon icon={faChevronRight} size={16} color={placeholderColor} />
                                </TouchableOpacity>
                             </View>
                        </View>

                        {/* Screen Time */}
                        <View style={styles.sectionCard}>
                             <View style={styles.cardHeader}>
                                 <FontAwesomeIcon icon={faClock} size={18} color={primaryColor} style={styles.cardIcon}/>
                                <Text style={styles.sectionTitle}>Screen Time</Text>
                             </View>
                            <View style={styles.settingRow}>
                                 <FontAwesomeIcon icon={faHourglassHalf} size={20} color={darkGrey} style={styles.settingIcon}/>
                                <Text style={styles.settingLabel}>Daily Usage Limit</Text>
                                <View style={styles.timeInputContainer}>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={localSettings.dailyLimitHours}
                                        onChangeText={(text) => handleSettingChange('dailyLimitHours', text)}
                                        keyboardType="number-pad"
                                        placeholder="-"
                                        placeholderTextColor={placeholderColor}
                                        maxLength={2}
                                    />
                                    <Text style={styles.timeInputLabel}>hours / day</Text>
                                 </View>
                            </View>
                            <View style={styles.settingRow}>
                                 <FontAwesomeIcon icon={faBed} size={20} color={darkGrey} style={styles.settingIcon}/>
                                <Text style={styles.settingLabel}>Downtime Schedule</Text>
                                <Switch value={localSettings.downtimeEnabled} onValueChange={(v) => handleSettingChange('downtimeEnabled', v)} {...switchStyles}/>
                             </View>
                             {localSettings.downtimeEnabled && (
                                 <View style={styles.downtimeDetails}>
                                     <Text style={styles.fieldLabel}>Active Downtime Days:</Text>
                                     <View style={styles.daySelector}>
                                        {daysOfWeek.map(day => {
                                            const isDaySelected = localSettings.downtimeDays.includes(day);
                                            return (
                                                <TouchableOpacity
                                                    key={day}
                                                    style={[styles.dayButton, isDaySelected && styles.dayButtonSelected]}
                                                    onPress={() => handleDowntimeDayToggle(day)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>{day}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                     </View>
                                      <Text style={styles.fieldLabel}>Downtime Hours:</Text>
                                      <View style={styles.timeSelectionRow}>
                                          <TouchableOpacity style={styles.timeDisplayBox} onPress={() => showTimePickerModal('start')} activeOpacity={0.7}>
                                              <Text style={styles.timeDisplayLabel}>From</Text>
                                              <Text style={styles.timeDisplayText}>{localSettings.downtimeStart}</Text>
                                          </TouchableOpacity>
                                           <Text style={styles.timeSeparator}>to</Text>
                                           <TouchableOpacity style={styles.timeDisplayBox} onPress={() => showTimePickerModal('end')} activeOpacity={0.7}>
                                              <Text style={styles.timeDisplayLabel}>Until</Text>
                                              <Text style={styles.timeDisplayText}>{localSettings.downtimeEnd}</Text>
                                           </TouchableOpacity>
                                      </View>
                                 </View>
                             )}
                        </View>

                        {/* Child Profile / Support Needs */}
                        <View style={styles.sectionCard}>
                            <View style={styles.cardHeader}>
                                <FontAwesomeIcon icon={faChild} size={18} color={primaryColor} style={styles.cardIcon}/>
                                <Text style={styles.sectionTitle}>Child Profile (Optional)</Text>
                             </View>
                             <Text style={styles.infoText}>Select a profile to tailor communication aids.</Text>
                            <View style={styles.optionsList}>
                                {([
                                    { level: 'high', label: "Level 3 Support Needs", icon: faHeart },
                                    { level: 'medium', label: "Level 2 Support Needs", icon: faChild },
                                    { level: 'low', label: "Level 1 Support Needs", icon: faUserShield },
                                    { level: 'noAsd', label: "No Specific Needs", icon: faChild }
                                ] as {level: AsdLevel, label: string, icon: any}[]).map(({ level, label, icon }) => {
                                    const isSelected = localSettings.asdLevel === level;
                                    return (
                                        <TouchableOpacity key={level} style={[styles.optionCard, isSelected && styles.optionCardSelected]} onPress={() => handleSettingChange('asdLevel', level)} activeOpacity={0.8} >
                                             <FontAwesomeIcon icon={icon} size={20} color={isSelected ? primaryColor : darkGrey} style={styles.optionIcon}/>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
                                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>{isSelected && <View style={styles.radioInner} />}</View>
                                        </TouchableOpacity>
                                    );
                                })}
                                {localSettings.asdLevel !== null && (
                                    <TouchableOpacity style={styles.clearButton} onPress={() => handleSettingChange('asdLevel', null)} >
                                        <Text style={styles.clearButtonText}>Clear Selection</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Security */}
                         <View style={styles.sectionCard}>
                              <View style={styles.cardHeader}>
                                <FontAwesomeIcon icon={faLock} size={18} color={primaryColor} style={styles.cardIcon}/>
                                <Text style={styles.sectionTitle}>Security</Text>
                              </View>
                             <View style={styles.settingRow}>
                                <FontAwesomeIcon icon={faUserShield} size={20} color={darkGrey} style={styles.settingIcon}/>
                                <Text style={styles.settingLabel}>Require Parent Passcode</Text>
                                <Switch value={localSettings.requirePasscode} onValueChange={(v) => handleSettingChange('requirePasscode', v)} {...switchStyles}/>
                            </View>
                             <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.featureRow} onPress={handleConfigurePasscode} activeOpacity={0.6}>
                                    <FontAwesomeIcon icon={faUserShield} size={18} color={darkGrey} style={styles.featureIcon}/>
                                    <Text style={styles.featureLabel}>Set/Change Passcode</Text>
                                    <FontAwesomeIcon icon={faChevronRight} size={16} color={placeholderColor} />
                                </TouchableOpacity>
                             </View>
                         </View>

                         {/* Reset Button */}
                         <TouchableOpacity
                            style={[styles.resetButton, !hasUnsavedChanges && styles.buttonDisabled]}
                            onPress={handleReset}
                            disabled={isSaving || !hasUnsavedChanges}
                          >
                            <FontAwesomeIcon icon={faUndo} size={14} color={hasUnsavedChanges ? darkGrey : mediumGrey} style={styles.buttonIcon}/>
                             <Text style={[styles.resetButtonText, !hasUnsavedChanges && styles.textDisabled]}>Discard Changes</Text>
                         </TouchableOpacity>

                    </ScrollView>
                </View>
            </SafeAreaView>

            {/* Time Picker Modal */}
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
        </Modal>
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
const dangerColor = '#d63031';
const disabledButtonColor = '#a9d6e9';

const switchStyles = {
    trackColor: { false: mediumGrey, true: secondaryColor },
    thumbColor: Platform.OS === 'android' ? primaryColor : undefined,
    ios_backgroundColor: mediumGrey,
};
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: primaryColor },
    container: { flex: 1, backgroundColor: screenBackgroundColor },
    header: {
        backgroundColor: primaryColor,
        paddingVertical: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
     },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
    title: { fontSize: 18, fontWeight: '600', color: whiteColor, textAlign: 'center' },
    headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
    scrollView: { // Added style
        flex: 1,
    },
    scrollContainer: { // Content padding
        padding: 15,
        paddingBottom: 20, // Reduced bottom padding
    },
    sectionCard: {
        backgroundColor: cardBackgroundColor,
        borderRadius: 12,
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: lightGrey,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: lightGrey,
     },
    cardIcon: {
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
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: lightGrey,
        marginTop: 5,
        paddingTop: 0,
        paddingHorizontal: 18,
        paddingBottom: 5,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        minHeight: 44,
        paddingHorizontal: 18,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
     featureIcon: {
         marginRight: 18,
         width: 25,
         textAlign: 'center',
     },
     featureLabel: {
        flex: 1,
        fontSize: 15,
        color: darkGrey,
        marginRight: 10,
    },
    settingIcon: { marginRight: 18, width: 25, textAlign: 'center' },
    settingLabel: { flex: 1, fontSize: 15, color: textColor, marginRight: 10 },
    timeInputContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    timeInput: { height: 40, width: 55, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, paddingHorizontal: 8, backgroundColor: whiteColor, fontSize: 15, color: textColor, textAlign: 'center' },
    timeInputLabel: { marginLeft: 8, fontSize: 14, color: darkGrey },
    downtimeDetails: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: lightGrey,
        paddingHorizontal: 18,
    },
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
    infoText: {
        fontSize: 13,
        color: darkGrey,
        marginBottom: 15,
        textAlign: 'left',
        paddingHorizontal: 18,
    },
    optionsList: {
         marginTop: 0,
         paddingHorizontal: 18,
     },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: whiteColor,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: mediumGrey,
        marginBottom: 10,
     },
    optionCardSelected: { borderColor: primaryColor, backgroundColor: '#e7f5ff' },
    optionIcon: { marginRight: 15, width: 25, textAlign: 'center'},
    optionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: textColor },
    optionLabelSelected: { color: primaryColor, fontWeight: 'bold' },
    radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: mediumGrey, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    radioOuterSelected: { borderColor: primaryColor },
    radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: primaryColor },
    clearButton: { marginTop: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
    clearButtonText: { fontSize: 14, color: primaryColor, fontWeight: '500' },
    resetButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginTop: 15, // Reduced margin
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    resetButtonText: {
        fontSize: 14,
        color: darkGrey,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    buttonIcon: {
        marginRight: 8,
     },
     buttonDisabled: { },
     textDisabled: {
         color: mediumGrey,
         textDecorationLine: 'none',
     }
});

export default ParentalControls;