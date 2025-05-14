// app/components/parental/ScreenTimeSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faHourglassHalf, faBed } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Or remove if using useTranslation directly
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Shared Types from apiService.ts ---
import { ParentalSettingsData, DayOfWeek } from '../../services/apiService'; // MODIFIED IMPORT

// --- Component Props ---
interface ScreenTimeSectionProps {
    settings: ParentalSettingsData; // Now uses the type from apiService
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onDayToggle: (day: DayOfWeek) => void; // DayOfWeek also from apiService
    onShowTimePicker: (target: 'start' | 'end') => void;
    daysOfWeek: DayOfWeek[]; // This array is passed from ParentalControls, ensure it uses the correct DayOfWeek type
    t: TFunction<"translation", undefined>; // Or remove if using useTranslation directly
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
}

// --- Component ---
const ScreenTimeSection: React.FC<ScreenTimeSectionProps> = ({
    settings,
    onSettingChange,
    onDayToggle,
    onShowTimePicker,
    daysOfWeek, // This prop now expects DayOfWeek[] from apiService.ts
    t,
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();
    // const { t, i18n } = useTranslation(); // Uncomment if t prop is removed
    const { i18n } = useTranslation(); // Only need i18n if t is passed as prop
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' },
        thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined,
        ios_backgroundColor: theme.disabled || '#767577',
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
                    icon={faClock}
                    size={(fonts.h2 || 20) * 0.7}
                    color={theme.primary || '#007aff'}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.screenTime.sectionTitle')}</Text>
            </View>

            {/* Daily Limit */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faHourglassHalf} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>
                    {t('parentalControls.screenTime.dailyLimitLabel')}
                </Text>
                <View style={styles.timeInputContainer}>
                    <TextInput
                        style={[styles.timeInput, { color: theme.text || '#000', borderColor: theme.border || '#ccc' }]}
                        value={settings.dailyLimitHours}
                        onChangeText={(text) => onSettingChange('dailyLimitHours', text)}
                        keyboardType="number-pad"
                        placeholder="-"
                        placeholderTextColor={theme.disabled || '#aaa'}
                        maxLength={2}
                        selectionColor={theme.primary || '#007aff'}
                        accessibilityLabel={t('parentalControls.screenTime.dailyLimitAccessibilityLabel')}
                    />
                    <Text style={[styles.timeInputLabel, { color: theme.textSecondary || '#555' }]}>
                        {t('parentalControls.screenTime.hoursPerDaySuffix')}
                    </Text>
                </View>
            </View>

            {/* Downtime Toggle */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBed} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>
                    {t('parentalControls.screenTime.downtimeScheduleLabel')}
                </Text>
                <Switch
                    value={settings.downtimeEnabled}
                    onValueChange={(v) => onSettingChange('downtimeEnabled', v)}
                    {...switchStyles} // Already has fallbacks
                    accessibilityLabel={t('parentalControls.screenTime.downtimeToggleAccessibilityLabel')}
                    accessibilityState={{ checked: settings.downtimeEnabled }}
                />
            </View>

            {/* Downtime Details (Conditional) */}
            {settings.downtimeEnabled && (
                <View style={styles.downtimeDetails}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary || '#555' }]}>
                        {t('parentalControls.screenTime.activeDowntimeDaysLabel')}
                    </Text>
                    <View style={styles.daySelector}>
                        {daysOfWeek.map(day => { // daysOfWeek array should also use the imported DayOfWeek type
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
                                    <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>
                                        {translatedDay}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary || '#555' }]}>
                        {t('parentalControls.screenTime.downtimeHoursLabel')}
                    </Text>
                    <View style={styles.timeSelectionRow}>
                        <TouchableOpacity
                            style={styles.timeDisplayBox}
                            onPress={() => onShowTimePicker('start')}
                            activeOpacity={0.7}
                            accessibilityLabel={t('parentalControls.screenTime.downtimeStartAccessibilityLabel', { time: settings.downtimeStart })}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.timeDisplayLabel, { color: theme.textSecondary || '#555' }]}>
                                {t('parentalControls.screenTime.downtimeFromLabel')}
                            </Text>
                            <Text style={[styles.timeDisplayText, { color: theme.primary || '#007aff' }]}>
                                {settings.downtimeStart}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.timeSeparator, { color: theme.textSecondary || '#555' }]}>
                            {t('parentalControls.screenTime.timeSeparatorTo')}
                        </Text>
                        <TouchableOpacity
                            style={styles.timeDisplayBox}
                            onPress={() => onShowTimePicker('end')}
                            activeOpacity={0.7}
                            accessibilityLabel={t('parentalControls.screenTime.downtimeEndAccessibilityLabel', { time: settings.downtimeEnd })}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.timeDisplayLabel, { color: theme.textSecondary || '#555' }]}>
                                {t('parentalControls.screenTime.downtimeUntilLabel')}
                            </Text>
                            <Text style={[styles.timeDisplayText, { color: theme.primary || '#007aff' }]}>
                                {settings.downtimeEnd}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyFontSize = fonts.body || 16;
    const captionFontSize = fonts.caption || 12;
    const h2FontSize = fonts.h2 || 20;

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage); // If actually used for section title directly

    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card || '#fff',
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border || '#ddd',
            overflow: 'hidden',
        },
        defaultCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 15,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border || '#ddd',
        },
        defaultCardIcon: {
            marginRight: 12,
        },
        defaultSectionTitle: { // This style is passed from ParentalControls, but providing a fallback
            fontSize: fonts.label || 16, // Using label size for section titles
            fontWeight: '600',
            color: theme.text || '#000',
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
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            marginRight: 10,
        },
        timeInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 'auto', // Pushes to the right
        },
        timeInput: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            height: 40,
            width: 55, // Fixed width for time input
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: Platform.OS === 'ios' ? 8 : 5, // Adjust padding for different OS
            backgroundColor: theme.background || '#f0f0f0',
            textAlign: 'center',
        },
        timeInputLabel: {
            ...captionStyles,
            fontSize: captionFontSize,
            marginLeft: 8,
        },
        downtimeDetails: {
            paddingTop: 15,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border || '#ddd',
            paddingHorizontal: 18,
            paddingBottom: 15,
        },
        fieldLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            marginBottom: 12,
        },
        daySelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around', // Distributes space evenly
            marginBottom: 20,
        },
        dayButton: {
            minWidth: 42, // Ensure consistent tap target size
            height: 42,
            borderRadius: 21, // Makes it circular
            borderWidth: 1.5,
            borderColor: theme.border || '#ccc',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
            backgroundColor: theme.card || '#fff',
            paddingHorizontal: Platform.OS === 'ios' ? 5 : 8, // Adjust padding
            marginHorizontal: 3, // Small gap between buttons
        },
        dayButtonSelected: {
            backgroundColor: theme.primary || '#007aff',
            borderColor: theme.primary || '#007aff',
        },
        dayButtonText: {
            ...captionStyles,
            fontSize: captionFontSize,
            fontWeight: '600',
            color: theme.primary || '#007aff',
        },
        dayButtonTextSelected: {
            ...captionStyles,
            fontSize: captionFontSize,
            fontWeight: '600',
            color: theme.white || '#fff',
        },
        timeSelectionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around', // Distributes space evenly
            marginBottom: 10,
        },
        timeDisplayBox: {
            minWidth: 90, // Ensure enough width for time
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: theme.border || '#ccc',
            borderRadius: 8,
            alignItems: 'center',
            backgroundColor: theme.background || '#f0f0f0', // Subtle background
        },
        timeDisplayLabel: {
            ...captionStyles,
            fontSize: captionFontSize,
            marginBottom: 4,
        },
        timeDisplayText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '600',
        },
        timeSeparator: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            marginHorizontal: 5,
        },
    });
};

export default ScreenTimeSection;