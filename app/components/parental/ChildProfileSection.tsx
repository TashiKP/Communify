// src/components/parental/ChildProfileSection.tsx
import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield } from '@fortawesome/free-solid-svg-icons'; // Removed faCheckCircle (radio handles it)

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData, AsdLevel } from './types'; // Assuming types are moved

// --- Component Props ---
interface ChildProfileSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    // No longer need to pass styles prop, use context instead
    // styles: any;
}

// --- Component ---
const ChildProfileSection: React.FC<ChildProfileSectionProps> = ({
    settings,
    onSettingChange,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    // Memoize styles based on theme and fonts
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Profile Options Data ---
    // Define options with appropriate icons
    const profileOptions: { level: AsdLevel; label: string; icon: any }[] = [
        { level: 'high', label: "Level 3 Support", icon: faHeart },
        { level: 'medium', label: "Level 2 Support", icon: faChild },
        { level: 'low', label: "Level 1 Support", icon: faUserShield },
        { level: 'noAsd', label: "No Specific Needs", icon: faUserShield } // Can use the same icon or a different one
    ];

    return (
        <View style={styles.sectionCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faChild} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Child Profile (Optional)</Text>
             </View>
             {/* Info Text */}
             <Text style={styles.infoText}>Select a profile to tailor communication aids.</Text>
            {/* Options List */}
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, label, icon }) => {
                    const isSelected = settings.asdLevel === level;
                    // Determine colors based on selection and theme
                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const labelStyle = isSelected ? styles.optionLabelSelected : styles.optionLabel;
                    const radioOuterStyle = isSelected ? styles.radioOuterSelected : styles.radioOuter;

                    return (
                        <TouchableOpacity
                            key={level}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            // Update state when an option is pressed
                            onPress={() => onSettingChange('asdLevel', level)}
                            activeOpacity={0.8}
                            accessibilityLabel={`Select profile ${label}`}
                            accessibilityRole="radio" // Indicate radio button behavior
                            accessibilityState={{ checked: isSelected }}
                        >
                             <FontAwesomeIcon icon={icon} size={fonts.body * 1.2} color={iconColor} style={styles.optionIcon}/>
                            <Text style={labelStyle}>{label}</Text>
                            {/* Custom Radio Button Visual */}
                            <View style={radioOuterStyle}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Clear Button */}
                {settings.asdLevel !== null && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => onSettingChange('asdLevel', null)} // Set level to null to clear
                        accessibilityLabel="Clear profile selection"
                        accessibilityRole="button"
                    >
                        <Text style={styles.clearButtonText}>Clear Selection</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: { // Inherited style, apply theme
        backgroundColor: theme.card,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    cardHeader: { // Inherited style, apply theme
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    cardIcon: { // Inherited style
        marginRight: 12,
        // size and color set dynamically
    },
    sectionTitle: { // Inherited style, apply theme
        fontSize: fonts.h2 * 0.9,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    infoText: { // Inherited style, apply theme
        fontSize: fonts.caption,
        color: theme.textSecondary,
        paddingVertical: 15,
        textAlign: 'left',
        paddingHorizontal: 18,
    },
    optionsList: { // Inherited style, apply theme padding
        paddingHorizontal: 18,
        paddingBottom: 10, // Add padding at the bottom of the list
    },
    optionCard: { // Inherited style, apply theme
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card, // Base card color
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: theme.border, // Default border
        marginBottom: 10,
    },
    optionCardSelected: { // Inherited style, apply theme
        borderColor: theme.primary,
        backgroundColor: theme.primaryMuted, // Use muted primary for selected background
    },
    optionIcon: { // Inherited style
        marginRight: 15,
        width: fonts.body * 1.2, // Adjust width based on icon size
        textAlign: 'center',
         // color set dynamically
    },
    optionLabel: { // Inherited style, apply theme
        flex: 1,
        fontSize: fonts.body,
        fontWeight: '500',
        color: theme.text, // Default text color
    },
    optionLabelSelected: { // Inherited style, apply theme
        flex: 1,
        fontSize: fonts.body,
        fontWeight: 'bold', // Make selected label bold
        color: theme.primary, // Use primary color for selected text
    },
    radioOuter: { // Inherited style, apply theme
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.border, // Default border color
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10, // Space it from the text
    },
    radioOuterSelected: { // Inherited style, apply theme
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.primary, // Use primary color for selected border
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    radioInner: { // Inherited style, apply theme
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: theme.primary, // Use primary color for inner dot
    },
    clearButton: { // Inherited style
        marginTop: 5,
        marginBottom: 5, // Add margin below button
        alignSelf: 'flex-end',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    clearButtonText: { // Inherited style, apply theme
        fontSize: fonts.label,
        color: theme.primary, // Use primary color for clear button text
        fontWeight: '500',
    },
});

export default ChildProfileSection;