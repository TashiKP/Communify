// src/components/parental/ScreenTimeSection.tsx
import React from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faHourglassHalf, faBed } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData, DayOfWeek } from './types'; // Assuming types are moved

// Define props
interface ScreenTimeSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onDayToggle: (day: DayOfWeek) => void;
    onShowTimePicker: (target: 'start' | 'end') => void;
    switchStyles: any;
    styles: any; // Pass shared styles object
    daysOfWeek: DayOfWeek[]; // Pass days array
}

const ScreenTimeSection: React.FC<ScreenTimeSectionProps> = ({
    settings,
    onSettingChange,
    onDayToggle,
    onShowTimePicker,
    switchStyles,
    styles,
    daysOfWeek
}) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faClock} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>Screen Time</Text>
            </View>
            {/* Daily Limit */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faHourglassHalf} size={20} color={styles._darkGrey} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>Daily Usage Limit</Text>
               <View style={styles.timeInputContainer}>
                   <TextInput
                       style={styles.timeInput}
                       value={settings.dailyLimitHours}
                       onChangeText={(text) => onSettingChange('dailyLimitHours', text)} // Validation happens in parent
                       keyboardType="number-pad"
                       placeholder="-"
                       placeholderTextColor={styles._placeholderColor}
                       maxLength={2}
                   />
                   <Text style={styles.timeInputLabel}>hours / day</Text>
                </View>
           </View>
           {/* Downtime Toggle */}
           <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBed} size={20} color={styles._darkGrey} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>Downtime Schedule</Text>
               <Switch value={settings.downtimeEnabled} onValueChange={(v) => onSettingChange('downtimeEnabled', v)} {...switchStyles}/>
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
                               >
                                   <Text style={[styles.dayButtonText, isDaySelected && styles.dayButtonTextSelected]}>{day}</Text>
                               </TouchableOpacity>
                           );
                       })}
                    </View>
                     <Text style={styles.fieldLabel}>Downtime Hours:</Text>
                     <View style={styles.timeSelectionRow}>
                         <TouchableOpacity style={styles.timeDisplayBox} onPress={() => onShowTimePicker('start')} activeOpacity={0.7}>
                             <Text style={styles.timeDisplayLabel}>From</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeStart}</Text>
                         </TouchableOpacity>
                          <Text style={styles.timeSeparator}>to</Text>
                          <TouchableOpacity style={styles.timeDisplayBox} onPress={() => onShowTimePicker('end')} activeOpacity={0.7}>
                             <Text style={styles.timeDisplayLabel}>Until</Text>
                             <Text style={styles.timeDisplayText}>{settings.downtimeEnd}</Text>
                          </TouchableOpacity>
                     </View>
                </View>
            )}
       </View>
    );
};

export default ScreenTimeSection;