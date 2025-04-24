// src/components/parental/ScreenTimeSection.tsx
import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faHourglassHalf, faBed } from '@fortawesome/free-solid-svg-icons';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData, DayOfWeek } from './types';

// --- Component Props ---
interface ScreenTimeSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onDayToggle: (day: DayOfWeek) => void;
    onShowTimePicker: (target: 'start' | 'end') => void;
    daysOfWeek: DayOfWeek[]; // Pass days array
}

// --- Component ---
const ScreenTimeSection: React.FC<ScreenTimeSectionProps> = ({
    settings,
    onSettingChange,
    onDayToggle,
    onShowTimePicker,
    daysOfWeek
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
    const switchStyles = useMemo(() => ({ // Generate switch styles from theme
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    return (
        <View style={styles.sectionCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faClock} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>Screen Time</Text>
            </View>

            {/* Daily Limit */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faHourglassHalf} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>Daily Usage Limit</Text>
               <View style={styles.timeInputContainer}>
                   <TextInput
                       style={styles.timeInput}
                       value={settings.dailyLimitHours}
                       onChangeText={(text) => onSettingChange('dailyLimitHours', text)} // Validation happens in parent
                       keyboardType="number-pad"
                       placeholder="-" // Keep placeholder simple
                       placeholderTextColor={theme.disabled} // Use theme color
                       maxLength={2}
                       selectionColor={theme.primary} // Use theme color
                   />
                   <Text style={styles.timeInputLabel}>hours / day</Text>
                </View>
           </View>

           {/* Downtime Toggle */}
           <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBed} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>Downtime Schedule</Text>
               <Switch
                    value={settings.downtimeEnabled}
                    onValueChange={(v) => onSettingChange('downtimeEnabled', v)}
                    {...switchStyles} // Apply themed switch styles
                    accessibilityLabel="Toggle downtime schedule"
                    accessibilityState={{ checked: settings.downtimeEnabled }}
                />
            </View>

            {/* Downtime Details (Conditional) */}
            {settings.downtimeEnabled && (
                <View style={styles.downtimeDetails}>
                    <Text style={styles.fieldLabel}>Active Downtime Days:</Text>
                    <View style={styles.daySelector}>
                       {daysOfWeek.map(day => {
                           const isDaySelected = settings.downtimeDays.includes(day);
                           return (
                               <TouchableOpacity
                                   key={day}
                                   style={[styles.dayButton, isDaySelected && styles.dayButtonSelected]}
                                   onPress={() => onDayToggle(day)}
                                   activeOpacity={0.7}
                                   accessibilityLabel={`Toggle ${day} for downtime`}
                                   accessibilityState={{ selected: isDaySelected }}
                               >
                                   <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>{day}</Text>
                               </TouchableOpacity>
                           );
                       })}
                    </View>
                     <Text style={styles.fieldLabel}>Downtime Hours:</Text>
                     <View style={styles.timeSelectionRow}>
                         <TouchableOpacity
                             style={styles.timeDisplayBox}
                             onPress={() => onShowTimePicker('start')}
                             activeOpacity={0.7}
                             accessibilityLabel={`Change downtime start time, currently ${settings.downtimeStart}`}
                             accessibilityRole="button"
                          >
                             <Text style={styles.timeDisplayLabel}>From</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeStart}</Text>
                         </TouchableOpacity>
                          <Text style={styles.timeSeparator}>to</Text>
                          <TouchableOpacity
                              style={styles.timeDisplayBox}
                              onPress={() => onShowTimePicker('end')}
                              activeOpacity={0.7}
                              accessibilityLabel={`Change downtime end time, currently ${settings.downtimeEnd}`}
                              accessibilityRole="button"
                           >
                             <Text style={styles.timeDisplayLabel}>Until</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeEnd}</Text>
                          </TouchableOpacity>
                     </View>
                </View>
            )}
       </View>
    );
};


// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    cardIcon: {
        marginRight: 12,
        // size/color set dynamically
    },
    sectionTitle: {
        fontSize: fonts.h2 * 0.9,
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
        // color set dynamically
    },
    settingLabel: {
        flex: 1,
        fontSize: fonts.body,
        color: theme.text,
        marginRight: 10,
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto', // Pushes to the right
    },
    timeInput: {
        height: 40,
        width: 55, // Keep width fixed?
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: theme.background, // Use background for input field
        fontSize: fonts.body,
        color: theme.text,
        textAlign: 'center',
    },
    timeInputLabel: {
        marginLeft: 8,
        fontSize: fonts.caption,
        color: theme.textSecondary,
    },
    downtimeDetails: {
        // No top margin needed, border handles separation
        paddingTop: 15,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        paddingHorizontal: 18,
        paddingBottom: 15, // Add padding at the bottom
    },
    fieldLabel: {
        fontSize: fonts.label,
        color: theme.textSecondary,
        fontWeight: '500',
        marginBottom: 12,
    },
    daySelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    dayButton: {
        minWidth: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        borderColor: theme.border, // Use theme border
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: theme.card, // Use card color
        paddingHorizontal: 5,
    },
    dayButtonSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    dayButtonText: {
        fontSize: fonts.caption,
        fontWeight: '600',
        color: theme.primary,
    },
    dayButtonTextSelected: {
        color: theme.white, // Use theme white
    },
    timeSelectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around', // Space out boxes
        marginBottom: 10,
    },
    timeDisplayBox: {
        minWidth: 90,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: theme.border, // Use theme border
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: theme.background, // Use theme background
    },
    timeDisplayLabel: {
        fontSize: fonts.caption,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    timeDisplayText: {
        fontSize: fonts.h2 * 0.9,
        fontWeight: '600',
        color: theme.primary,
    },
    timeSeparator: {
        fontSize: fonts.label,
        color: theme.textSecondary,
        marginHorizontal: 5,
    },
});

export default ScreenTimeSection;