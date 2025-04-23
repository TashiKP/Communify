// src/components/parental/ChildProfileSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData, AsdLevel } from './types'; // Assuming types are moved

// Define props
interface ChildProfileSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    styles: any; // Pass shared styles object
}

const ChildProfileSection: React.FC<ChildProfileSectionProps> = ({
    settings,
    onSettingChange,
    styles
}) => {
    const profileOptions: { level: AsdLevel; label: string; icon: any }[] = [
        { level: 'high', label: "Level 3 Support", icon: faHeart },
        { level: 'medium', label: "Level 2 Support", icon: faChild }, // Changed icon
        { level: 'low', label: "Level 1 Support", icon: faUserShield },
        { level: 'noAsd', label: "No Specific Needs", icon: faUserShield } // Reused icon
    ];

    return (
        <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faChild} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Child Profile (Optional)</Text>
             </View>
             <Text style={styles.infoText}>Select a profile to tailor communication aids.</Text>
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, label, icon }) => {
                    const isSelected = settings.asdLevel === level;
                    return (
                        <TouchableOpacity
                            key={level}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => onSettingChange('asdLevel', level)}
                            activeOpacity={0.8}
                        >
                             <FontAwesomeIcon icon={icon} size={20} color={isSelected ? styles._primaryColor : styles._darkGrey} style={styles.optionIcon}/>
                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Clear Button */}
                {settings.asdLevel !== null && (
                    <TouchableOpacity style={styles.clearButton} onPress={() => onSettingChange('asdLevel', null)} >
                        <Text style={styles.clearButtonText}>Clear Selection</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default ChildProfileSection;