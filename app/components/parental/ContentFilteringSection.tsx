// src/components/parental/ContentFilteringSection.tsx
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShieldAlt, faBan, faEyeSlash, faGlobe, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData } from './types'; // Assuming types are moved to a types file or kept here

// Define props specifically needed by this section
interface ContentFilteringSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigureWeb: () => void;
    switchStyles: any; // Pass down switch style props
    styles: any; // Pass down shared styles object
}

const ContentFilteringSection: React.FC<ContentFilteringSectionProps> = ({
    settings,
    onSettingChange,
    onConfigureWeb,
    switchStyles,
    styles // Use passed styles
}) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faShieldAlt} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Content Filtering</Text>
            </View>
            {/* Block Violence */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBan} size={20} color={styles._darkGrey} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>Block Violent Content</Text>
                <Switch
                    value={settings.blockViolence}
                    onValueChange={(v) => onSettingChange('blockViolence', v)}
                    {...switchStyles}
                />
            </View>
            {/* Block Inappropriate */}
            <View style={styles.settingRow}>
                 <FontAwesomeIcon icon={faEyeSlash} size={20} color={styles._darkGrey} style={styles.settingIcon}/>
                <Text style={styles.settingLabel}>Block Inappropriate Content</Text>
                <Switch
                    value={settings.blockInappropriate}
                    onValueChange={(v) => onSettingChange('blockInappropriate', v)}
                    {...switchStyles}
                />
            </View>
            {/* Web Filtering Link */}
            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.featureRow} onPress={onConfigureWeb} activeOpacity={0.6}>
                    <FontAwesomeIcon icon={faGlobe} size={18} color={styles._darkGrey} style={styles.featureIcon}/>
                    <Text style={styles.featureLabel}>Web Filtering Rules</Text>
                    <FontAwesomeIcon icon={faChevronRight} size={16} color={styles._placeholderColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ContentFilteringSection;