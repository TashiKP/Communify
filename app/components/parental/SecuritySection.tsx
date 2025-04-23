// src/components/parental/SecuritySection.tsx
import React from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native'; // Added ActivityIndicator, StyleSheet
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData } from './types';

// Define props including the new optional loading state
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    switchStyles: any; // Consider creating a more specific type
    styles: any; // Consider creating a more specific type (e.g., StyleSheet.NamedStyles<any>)
    isLoadingPasscodeStatus?: boolean; // Add the optional loading prop
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
    settings,
    passcodeExists,
    onSettingChange,
    onTogglePasscodeSetup,
    isLoadingPasscodeStatus = false, // Destructure and provide default value
    switchStyles,
    styles // This object should contain all needed styles from ParentalControls
}) => {

    // Determine if the user *can* enable the 'Require Passcode' switch.
    // They can only enable it if a passcode already exists.
    // They can always *disable* it if it's currently on.
    const canEnablePasscodeRequirement = passcodeExists;

    // Handler for the Require Passcode switch
    const handleRequirePasscodeToggle = (value: boolean) => {
        // Prevent enabling if no passcode exists
        if (value && !canEnablePasscodeRequirement) {
             Alert.alert(
                 "Set Passcode First",
                 "Please set a passcode using the option below before requiring it."
             );
             // Don't change the state, return early
             return;
        }
        // If valid, call the parent's handler
         onSettingChange('requirePasscode', value);
    };

    // Determine if the switch should be visually and functionally disabled
    const isSwitchDisabled =
        isLoadingPasscodeStatus || // Disable if loading
        (!settings.requirePasscode && !canEnablePasscodeRequirement); // Disable if trying to enable without a passcode

    // Determine if the Set/Change button should be disabled
    const isConfigureButtonDisabled = isLoadingPasscodeStatus;


    return (
        <View style={styles.sectionCard}>
             <View style={styles.cardHeader}>
               <FontAwesomeIcon icon={faLock} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>Security</Text>
               {/* Optional: Show loading indicator in header */}
               {isLoadingPasscodeStatus && (
                    <ActivityIndicator size="small" color={styles._primaryColor} style={localStyles.headerLoader} />
               )}
             </View>

            {/* --- Require Passcode Switch Row --- */}
            <View style={[styles.settingRow, isSwitchDisabled && localStyles.disabledOverlay]}>
               <FontAwesomeIcon icon={faUserShield} size={20} color={isSwitchDisabled ? styles._mediumGrey : styles._darkGrey} style={styles.settingIcon}/>
               <Text style={[styles.settingLabel, isSwitchDisabled && localStyles.disabledText]}>
                   Require Parent Passcode
                </Text>
               <Switch
                   value={settings.requirePasscode}
                   onValueChange={handleRequirePasscodeToggle}
                   disabled={isSwitchDisabled} // Use the combined disabled logic
                   trackColor={isSwitchDisabled ? { false: styles._lightGrey, true: styles._lightGrey } : switchStyles.trackColor}
                   thumbColor={isSwitchDisabled ? styles._mediumGrey : switchStyles.thumbColor}
                   ios_backgroundColor={isSwitchDisabled ? styles._lightGrey : switchStyles.ios_backgroundColor} // Use lightGrey when disabled on iOS too
                   accessibilityLabel="Require Parent Passcode"
                   accessibilityState={{ disabled: isSwitchDisabled, checked: settings.requirePasscode }}
               />
           </View>

            {/* --- Set/Change Passcode Link Row --- */}
            {/* Wrap the footer content to easily apply overlay if needed, though disabling button might be enough */}
            <View style={[styles.cardFooter, isConfigureButtonDisabled && localStyles.disabledOverlay]}>
               <TouchableOpacity
                    style={styles.featureRow} // Assuming featureRow exists in parent styles
                    onPress={onTogglePasscodeSetup}
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.6} // Reduce feedback when disabled
                    disabled={isConfigureButtonDisabled} // Disable button during load
                    accessibilityLabel={passcodeExists ? 'Change Passcode' : 'Set Passcode'}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
               >
                   <FontAwesomeIcon
                        icon={faUserShield}
                        size={18}
                        color={isConfigureButtonDisabled ? styles._mediumGrey : styles._darkGrey}
                        style={styles.featureIcon} // Assuming featureIcon exists
                    />
                   <Text style={[styles.featureLabel, isConfigureButtonDisabled && localStyles.disabledText]}>
                       {passcodeExists ? 'Change Passcode' : 'Set Passcode'}
                   </Text>
                   <FontAwesomeIcon
                        icon={faChevronRight}
                        size={16}
                        color={isConfigureButtonDisabled ? styles._lightGrey : styles._placeholderColor}
                    />
               </TouchableOpacity>
            </View>
        </View>
    );
};

// Optional: Local styles specific to this component's disabled states if not covered by parent styles
const localStyles = StyleSheet.create({
    disabledOverlay: {
        opacity: 0.6, // Make section look faded when loading/disabled
        // backgroundColor: '#f0f0f0', // Optional subtle background change
    },
    disabledText: {
        color: '#a0a0a0', // Use a specific grey for disabled text if needed
    },
    headerLoader: {
        marginLeft: 10, // Space between title and loader
    }
});


export default SecuritySection;