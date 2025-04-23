// src/components/parental/SecuritySection.tsx
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData } from './types'; // Assuming types are moved

// Define props
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigurePasscode: () => void;
    switchStyles: any;
    styles: any; // Pass shared styles object
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
    settings,
    onSettingChange,
    onConfigurePasscode,
    switchStyles,
    styles
}) => {
    return (
        <View style={styles.sectionCard}>
             <View style={styles.cardHeader}>
               <FontAwesomeIcon icon={faLock} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>Security</Text>
             </View>
             {/* Require Passcode */}
            <View style={styles.settingRow}>
               <FontAwesomeIcon icon={faUserShield} size={20} color={styles._darkGrey} style={styles.settingIcon}/>
               <Text style={styles.settingLabel}>Require Parent Passcode</Text>
               <Switch
                   value={settings.requirePasscode}
                   onValueChange={(v) => onSettingChange('requirePasscode', v)}
                   {...switchStyles}
               />
           </View>
            {/* Set Passcode Link */}
            <View style={styles.cardFooter}>
               <TouchableOpacity style={styles.featureRow} onPress={onConfigurePasscode} activeOpacity={0.6}>
                   <FontAwesomeIcon icon={faUserShield} size={18} color={styles._darkGrey} style={styles.featureIcon}/>
                   <Text style={styles.featureLabel}>Set/Change Passcode</Text>
                   <FontAwesomeIcon icon={faChevronRight} size={16} color={styles._placeholderColor} />
               </TouchableOpacity>
            </View>
        </View>
    );
};

export default SecuritySection;