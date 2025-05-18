// app/components/parental/ScreenTimeSection.tsx
import React, { useMemo, useEffect, useState, useCallback } from 'react'; // Added useCallback
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faHourglassHalf, faBed } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';
import { ParentalSettingsData, DayOfWeek } from '../../services/apiService';

// --- Reporting Types ---
export type ReportEventType =
    | 'downtime_active'
    | 'downtime_inactive'
    | 'daily_limit_set'
    | 'daily_limit_exceeded_info'; // Conceptual: real check needs usage data

export interface ReportEvent {
    type: ReportEventType;
    message: string;
    details?: Record<string, any>;
}

// --- Component Props ---
interface ScreenTimeSectionProps {
    settings: ParentalSettingsData; // Contains notifyEmails
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onDayToggle: (day: DayOfWeek) => void;
    onShowTimePicker: (target: 'start' | 'end') => void;
    daysOfWeek: DayOfWeek[];
    t: TFunction<"translation", undefined>;
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
    onReport?: (event: ReportEvent) => void;
    sendEmailReport?: (subject: string, body: string, recipients: string[], eventType: ReportEventType) => Promise<void>; // New prop for sending email
    // currentScreenTimeUsageMinutes?: number;
}

// --- Helper Functions ---
const getApiDayFromJsDay = (jsDay: number): DayOfWeek | undefined => {
    const dayMap: Record<number, DayOfWeek> = {
        0: 'Sun',    // Sunday
        1: 'Mon',    // Monday
        2: 'Tue',    // Tuesday
        3: 'Wed',    // Wednesday
        4: 'Thu',    // Thursday
        5: 'Fri',    // Friday
        6: 'Sat'     // Saturday
    };
    return dayMap[jsDay];
};

const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return NaN;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
    return hours * 60 + minutes;
};


// --- Component ---
const ScreenTimeSection: React.FC<ScreenTimeSectionProps> = ({
    settings,
    onSettingChange,
    onDayToggle,
    onShowTimePicker,
    daysOfWeek,
    t, // Passed as prop
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
    onReport,
    sendEmailReport,
    // currentScreenTimeUsageMinutes,
}) => {
    const { theme, fonts } = useAppearance();
    const { i18n } = useTranslation(); // Only for i18n.language if t is a prop
    const currentLanguage = i18n.language;

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' },
        thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined,
        ios_backgroundColor: theme.disabled || '#767577',
    }), [theme]);

    const [reportedDailyLimit, setReportedDailyLimit] = useState<string | null>(null);
    const [isDowntimeActiveCurrently, setIsDowntimeActiveCurrently] = useState(false);


    const handleGeneratedReport = useCallback((event: ReportEvent) => {
        // 1. Default UI Alert & Console Log
        console.log(`[ParentalControlReport] ${event.type}: ${event.message}`, event.details || '');
        Alert.alert(
            t(`parentalControls.reports.titles.${event.type}`, { defaultValue: 'Parental Control Update' }),
            event.message
        );

        // 2. Email Reporting
        if (sendEmailReport && settings.notifyEmails && settings.notifyEmails.length > 0) {
            const emailSubject = t(`parentalControls.reports.emailSubjects.${event.type}`, {
                defaultValue: t(`parentalControls.reports.titles.${event.type}`, { defaultValue: `Update: ${event.type}` })
            });

            let emailBody = `${event.message}\n\n`;
            if (event.details && Object.keys(event.details).length > 0) {
                emailBody += `${t('parentalControls.reports.emailDetailsSectionTitle', { defaultValue: "Details:" })}\n`;
                Object.entries(event.details).forEach(([key, value]) => {
                    emailBody += `- ${key}: ${value}\n`;
                });
            }

            sendEmailReport(emailSubject, emailBody, settings.notifyEmails, event.type)
                .then(() => {
                    console.log(`Email report for ${event.type} successfully queued for sending to:`, settings.notifyEmails.join(', '));
                })
                .catch((error) => {
                    console.error(`Failed to queue email report for ${event.type}:`, error);
                    Alert.alert(
                        t('parentalControls.reports.emailFailedTitle', { defaultValue: "Email Report Failed" }),
                        t('parentalControls.reports.emailFailedMessage', { defaultValue: `Could not send email notification: ${error.message || 'Unknown error'}` })
                    );
                });
        } else if (sendEmailReport && (!settings.notifyEmails || settings.notifyEmails.length === 0)) {
            console.log(`Email reporting is set up, but no notification email addresses are configured for event type: ${event.type}.`);
        }

        // 3. Call parent's onReport if provided (for additional custom actions)
        if (onReport) {
            onReport(event);
        }
    }, [t, sendEmailReport, settings, onReport, i18n.language]); // settings includes notifyEmails

    // Effect for daily limit changes
    useEffect(() => {
        const limitStr = settings.dailyLimitHours;
        const limitNum = parseFloat(limitStr);

        if (!isNaN(limitNum) && limitNum > 0) {
            if (limitStr !== reportedDailyLimit) {
                handleGeneratedReport({
                    type: 'daily_limit_set',
                    message: t('parentalControls.reports.dailyLimitSet', { hours: limitStr }),
                    details: { limitHours: limitStr }
                });
                setReportedDailyLimit(limitStr);
            }
            // Conceptual "exceeded" check would go here if `currentScreenTimeUsageMinutes` was available
            // and would call handleGeneratedReport with 'daily_limit_exceeded_info'
        } else if (reportedDailyLimit !== null && (isNaN(limitNum) || limitNum <= 0)) {
            setReportedDailyLimit(null); // Reset if limit is cleared or invalid
        }
    }, [settings.dailyLimitHours, t, handleGeneratedReport, reportedDailyLimit]);

    // Effect for downtime checks
    useEffect(() => {
        const checkDowntime = () => {
            const now = new Date();
            const currentJsDay = now.getDay();
            const currentApiDay = getApiDayFromJsDay(currentJsDay);
            let isDeviceCurrentlyInDowntime = false;

            if (settings.downtimeEnabled && currentApiDay && settings.downtimeDays.includes(currentApiDay)) {
                const downtimeStartMinutes = parseTimeToMinutes(settings.downtimeStart);
                const downtimeEndMinutes = parseTimeToMinutes(settings.downtimeEnd);
                const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

                if (!isNaN(downtimeStartMinutes) && !isNaN(downtimeEndMinutes)) {
                    if (downtimeStartMinutes <= downtimeEndMinutes) { // Same day
                        if (currentTimeMinutes >= downtimeStartMinutes && currentTimeMinutes < downtimeEndMinutes) {
                            isDeviceCurrentlyInDowntime = true;
                        }
                    } else { // Overnight
                        if (currentTimeMinutes >= downtimeStartMinutes || currentTimeMinutes < downtimeEndMinutes) {
                            isDeviceCurrentlyInDowntime = true;
                        }
                    }
                }
            }

            if (isDeviceCurrentlyInDowntime !== isDowntimeActiveCurrently) {
                setIsDowntimeActiveCurrently(isDeviceCurrentlyInDowntime);
                const eventType = isDeviceCurrentlyInDowntime ? 'downtime_active' : 'downtime_inactive';
                const message = isDeviceCurrentlyInDowntime
                    ? t('parentalControls.reports.downtimeActive', { until: settings.downtimeEnd })
                    : t('parentalControls.reports.downtimeInactive');
                const details = isDeviceCurrentlyInDowntime
                    ? { activeUntil: settings.downtimeEnd, scheduledStart: settings.downtimeStart }
                    : { lastScheduledStart: settings.downtimeStart, lastScheduledEnd: settings.downtimeEnd };

                handleGeneratedReport({ type: eventType, message, details });
            }
        };

        checkDowntime();
        const intervalId = setInterval(checkDowntime, 60000); // Check every minute
        return () => clearInterval(intervalId);
    }, [
        settings.downtimeEnabled,
        settings.downtimeDays,
        settings.downtimeStart,
        settings.downtimeEnd,
        t,
        handleGeneratedReport,
        isDowntimeActiveCurrently
    ]);


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
                        onChangeText={(text) => onSettingChange('dailyLimitHours', text.replace(/[^0-9.]/g, ''))}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor={theme.disabled || '#aaa'}
                        maxLength={4}
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
                    {...switchStyles}
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
                                    <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>
                                        {translatedDay.substring(0,3)}
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

// --- Styles (Unchanged from previous version) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyFontSize = fonts.body || 16;
    const captionFontSize = fonts.caption || 12;

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);

    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card || '#fff',
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border || '#ddd',
            overflow: 'hidden',
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1.5,
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
        defaultSectionTitle: {
            fontSize: fonts.label || 16,
            fontWeight: '600',
            color: theme.text || '#000',
            flex: 1,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            minHeight: 48,
            paddingHorizontal: 18,
        },
        settingIcon: {
            marginRight: 18,
            width: (bodyFontSize * 1.1) + 4,
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
            marginLeft: 'auto',
        },
        timeInput: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            height: 40,
            width: 60,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: Platform.OS === 'ios' ? 8 : 6,
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
            fontSize: bodyFontSize * 0.95,
            fontWeight: '500',
            marginBottom: 12,
            color: theme.textSecondary || '#555',
        },
        daySelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        dayButton: {
            minWidth: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: theme.border || '#ccc',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
            backgroundColor: theme.card || '#fff',
            paddingHorizontal: 5,
        },
        dayButtonSelected: {
            backgroundColor: theme.primary || '#007aff',
            borderColor: theme.primary || '#007aff',
        },
        dayButtonText: {
            ...captionStyles,
            fontSize: captionFontSize * 1.1,
            fontWeight: '600',
            color: theme.primary || '#007aff',
        },
        dayButtonTextSelected: {
            ...captionStyles,
            fontSize: captionFontSize * 1.1,
            fontWeight: '600',
            color: theme.white || '#fff',
        },
        timeSelectionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
        },
        timeDisplayBox: {
            flex: 1,
            maxWidth: '45%',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: theme.border || '#ccc',
            borderRadius: 8,
            alignItems: 'center',
            backgroundColor:  theme.background || '#f0f0f0',
        },
        timeDisplayLabel: {
            ...captionStyles,
            fontSize: captionFontSize * 0.9,
            marginBottom: 4,
            color: theme.textSecondary || '#555',
        },
        timeDisplayText: {
            ...bodyStyles,
            fontSize: bodyFontSize * 1.1,
            fontWeight: '600',
            color: theme.primary || '#007aff',
        },
        timeSeparator: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            marginHorizontal: 8,
            color: theme.textSecondary || '#555',
        },
    });
};

export default ScreenTimeSection;
