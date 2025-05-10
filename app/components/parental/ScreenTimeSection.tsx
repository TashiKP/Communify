// src/components/parental/ScreenTimeSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faHourglassHalf, faBed } from '@fortawesome/free-solid-svg-icons';
import {TFunction} from 'i18next'
import { useTranslation } from 'react-i18next'; // Corrected import

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData, DayOfWeek } from './types'; // Ensure this path is correct

// --- Component Props ---
interface ScreenTimeSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onDayToggle: (day: DayOfWeek) => void;
    onShowTimePicker: (target: 'start' | 'end') => void;
    daysOfWeek: DayOfWeek[];
    t: TFunction<"translation", undefined>;
    // Style props passed from parent
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>; // For the main section icon
}

// --- Component ---
const ScreenTimeSection: React.FC<ScreenTimeSectionProps> = ({
    settings,
    onSettingChange,
    onDayToggle,
    onShowTimePicker,
    daysOfWeek,
    t,
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();
    const { i18n } = useTranslation(); // Get i18n instance for currentLanguage
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    // Helper to get translated day names
    const getTranslatedDay = (dayKey: DayOfWeek): string => {
        return t(`parentalControls.screenTime.days.${dayKey.toLowerCase()}`, { defaultValue: dayKey });
    };

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faClock} // Icon for this section
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
               <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.screenTime.sectionTitle')}</Text>
            </View>

            {/* Daily Limit */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faHourglassHalf} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>{t('parentalControls.screenTime.dailyLimitLabel')}</Text>
               <View style={styles.timeInputContainer}>
                   <TextInput
                       style={styles.timeInput}
                       value={settings.dailyLimitHours}
                       onChangeText={(text) => onSettingChange('dailyLimitHours', text)}
                       keyboardType="number-pad"
                       placeholder="-"
                       placeholderTextColor={theme.disabled}
                       maxLength={2}
                       selectionColor={theme.primary}
                       accessibilityLabel={t('parentalControls.screenTime.dailyLimitAccessibilityLabel')}
                   />
                   <Text style={styles.timeInputLabel}>{t('parentalControls.screenTime.hoursPerDaySuffix')}</Text>
                </View>
           </View>

           {/* Downtime Toggle */}
           <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBed} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>{t('parentalControls.screenTime.downtimeScheduleLabel')}</Text>
               <Switch
                    value={settings.downtimeEnabled}
                    onValueChange={(v) => onSettingChange('downtimeEnabled', v)}
                    {...switchStyles}
                    accessibilityLabel={t('parentalControls.screenTime.downtimeToggleAccessibilityLabel')}
                    accessibilityState={{ checked: settings.downtimeEnabled }}
                />
            </View>

            {/* Downtime Details (Conditional) */}
            {settings.downtimeEnabled && (
                <View style={styles.downtimeDetails}>
                    <Text style={styles.fieldLabel}>{t('parentalControls.screenTime.activeDowntimeDaysLabel')}</Text>
                    <View style={styles.daySelector}>
                       {daysOfWeek.map(day => {
                           const isDaySelected = settings.downtimeDays.includes(day);
                           const translatedDay = getTranslatedDay(day);
                           return (
                               <TouchableOpacity
                                   key={day}
                                   style={[styles.dayButton, isDaySelected && styles.dayButtonSelected]}
                                   onPress={() => onDayToggle(day)}
                                   activeOpacity={0.7}
                                   accessibilityLabel={t('parentalControls.screenTime.dayToggleAccessibilityLabel', { day: translatedDay })}
                                   accessibilityState={{ selected: isDaySelected }}
                               >
                                   <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>{translatedDay}</Text>
                               </TouchableOpacity>
                           );
                       })}
                    </View>
                     <Text style={styles.fieldLabel}>{t('parentalControls.screenTime.downtimeHoursLabel')}</Text>
                     <View style={styles.timeSelectionRow}>
                         <TouchableOpacity
                             style={styles.timeDisplayBox}
                             onPress={() => onShowTimePicker('start')}
                             activeOpacity={0.7}
                             accessibilityLabel={t('parentalControls.screenTime.downtimeStartAccessibilityLabel', { time: settings.downtimeStart })}
                             accessibilityRole="button"
                          >
                             <Text style={styles.timeDisplayLabel}>{t('parentalControls.screenTime.downtimeFromLabel')}</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeStart}</Text>
                         </TouchableOpacity>
                          <Text style={styles.timeSeparator}>{t('parentalControls.screenTime.timeSeparatorTo')}</Text>
                          <TouchableOpacity
                              style={styles.timeDisplayBox}
                              onPress={() => onShowTimePicker('end')}
                              activeOpacity={0.7}
                              accessibilityLabel={t('parentalControls.screenTime.downtimeEndAccessibilityLabel', { time: settings.downtimeEnd })}
                              accessibilityRole="button"
                           >
                             <Text style={styles.timeDisplayLabel}>{t('parentalControls.screenTime.downtimeUntilLabel')}</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeEnd}</Text>
                          </TouchableOpacity>
                     </View>
                </View>
            )}
       </View>
    );
};


// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage); // For timeDisplayText

    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: 'hidden',
        },
        defaultCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 15,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        defaultCardIcon: {
            marginRight: 12,
        },
        defaultSectionTitle: {
            ...labelStyles, // Using label for section titles
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            minHeight: 44,
            paddingHorizontal: 18,
        },
        settingIcon: {
            marginRight: 18,
            width: fonts.body * 1.1,
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles, // Typography for setting labels
            flex: 1,
            color: theme.text,
            marginRight: 10,
        },
        timeInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 'auto', // Pushes to the right
        },
        timeInput: { // For TextInput
            ...bodyStyles, // Typography for text input
            height: 40,
            width: 55, // Specific width
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 8,
            backgroundColor: theme.background,
            color: theme.text,
            textAlign: 'center',
        },
        timeInputLabel: { // "hours/day"
            ...captionStyles, // Typography for time input suffix
            marginLeft: 8,
            color: theme.textSecondary,
        },
        downtimeDetails: {
            paddingTop: 15,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            paddingHorizontal: 18,
            paddingBottom: 15,
        },
        fieldLabel: { // "Active on days:", "Downtime hours:"
            ...labelStyles, // Typography for field labels within downtime
            color: theme.textSecondary,
            fontWeight: '500',
            marginBottom: 12,
        },
        daySelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around', // Or 'flex-start' with gap if preferred
            marginBottom: 20,
        },
        dayButton: {
            minWidth: 42, // Ensure consistent button size
            height: 42,
            borderRadius: 21, // Circular
            borderWidth: 1.5,
            borderColor: theme.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
            backgroundColor: theme.card, // Or theme.background
            paddingHorizontal: 5, // Small horizontal padding for short day names
            marginHorizontal: 3, // Add some space between buttons
        },
        dayButtonSelected: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        dayButtonText: {
            ...captionStyles, // Typography for day button text
            fontWeight: '600',
            color: theme.primary,
        },
        dayButtonTextSelected: {
            ...captionStyles, // Typography for selected day button text
            fontWeight: '600', // Keep weight
            color: theme.white, // Override color
        },
        timeSelectionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: 10,
        },
        timeDisplayBox: {
            minWidth: 90,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            alignItems: 'center',
            backgroundColor: theme.background, // Or theme.card
        },
        timeDisplayLabel: { // "From", "Until"
            ...captionStyles, // Typography for time display labels
            color: theme.textSecondary,
            marginBottom: 4,
        },
        timeDisplayText: { // The actual time e.g., "21:00"
            ...h2Styles, // Use h2 for prominent time display
            fontWeight: '600',
            color: theme.primary,
        },
        timeSeparator: { // "to"
            ...labelStyles, // Typography for the "to" separator
            color: theme.textSecondary,
            marginHorizontal: 5,
        },
    });
};

export default ScreenTimeSection;