// src/components/parental/ChildProfileSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'; // Added StyleProp, ViewStyle, TextStyle
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // TFunction can be from i18next
import { useTranslation } from 'react-i18next'; // Correct: useTranslation from react-i18next

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData, AsdLevel } from './types'; // Assuming types are moved

// --- Component Props ---
interface ChildProfileSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    t: TFunction<"translation", undefined>;
    // Style props passed from parent
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>; // For the main section icon
}

// --- Component ---
const ChildProfileSection: React.FC<ChildProfileSectionProps> = ({
    settings,
    onSettingChange,
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

    // --- Profile Options Data (Labels will use t function) ---
    // Note: The 'AsdLevel' type in your types.ts should match these values: 'high', 'medium', 'low', 'noAsd', or null.
    // If 'noAsd' is meant to be represented by `null` in `settings.asdLevel`, adjust `profileOptions` accordingly.
    // For this example, I'm assuming 'noAsd' is a distinct string value for AsdLevel.
    const profileOptions: { level: AsdLevel | 'noAsd'; labelKey: string; icon: any }[] = [
        { level: 'high', labelKey: "parentalControls.childProfile.level3Label", icon: faHeart },
        { level: 'medium', labelKey: "parentalControls.childProfile.level2Label", icon: faChild },
        { level: 'low', labelKey: "parentalControls.childProfile.level1Label", icon: faUserShield },
        { level: 'noAsd', labelKey: "parentalControls.childProfile.noNeedsLabel", icon: faUserShield } // Assuming 'noAsd' is a valid AsdLevel string or handle null separately
    ];

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faChild} // Icon for this section
                    size={fonts.h2 * 0.7} // Consistent with parent's definition for section icons
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.childProfile.sectionTitle')}</Text>
             </View>
             {/* Info Text */}
             <Text style={styles.infoText}>{t('parentalControls.childProfile.infoText')}</Text>
            {/* Options List */}
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, labelKey, icon }) => {
                    // Adjusting for null possibility if 'noAsd' represents null
                    const currentLevelToCompare = level === 'noAsd' ? null : level;
                    const isSelected = settings.asdLevel === currentLevelToCompare;

                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const labelStyle = isSelected ? styles.optionLabelSelected : styles.optionLabel;
                    const radioOuterStyle = isSelected ? styles.radioOuterSelected : styles.radioOuter;
                    const label = t(labelKey);

                    return (
                        <TouchableOpacity
                            key={level} // level is unique here
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => onSettingChange('asdLevel', currentLevelToCompare as AsdLevel | null)} // Cast to ensure type safety
                            activeOpacity={0.8}
                            accessibilityLabel={t('parentalControls.childProfile.optionAccessibilityLabel', { profile: label })}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                        >
                             <FontAwesomeIcon icon={icon} size={fonts.body * 1.2} color={iconColor} style={styles.optionIcon}/>
                            <Text style={labelStyle}>{label}</Text>
                            <View style={radioOuterStyle}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {settings.asdLevel !== null && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => onSettingChange('asdLevel', null)}
                        accessibilityLabel={t('parentalControls.childProfile.clearAccessibilityLabel')}
                        accessibilityRole="button"
                    >
                        <Text style={styles.clearButtonText}>{t('parentalControls.childProfile.clearButtonText')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);

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
            // size and color are set by props or parent's iconStyle
        },
        defaultSectionTitle: {
            ...labelStyles, // Using label for section titles
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        infoText: {
            ...captionStyles, // Typography for info text
            color: theme.textSecondary,
            paddingVertical: 15,
            textAlign: 'left',
            paddingHorizontal: 18,
        },
        optionsList: {
            paddingHorizontal: 18,
            paddingBottom: 10,
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card, // Or theme.background if options are not "cards within a card"
            paddingVertical: 12,
            paddingHorizontal: 15,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.border,
            marginBottom: 10,
        },
        optionCardSelected: {
            borderColor: theme.primary,
            backgroundColor: theme.primaryMuted,
        },
        optionIcon: {
            marginRight: 15,
            width: fonts.body * 1.2, // Base icon size on body font
            textAlign: 'center',
        },
        optionLabel: {
            ...bodyStyles, // Typography for option labels
            flex: 1,
            fontWeight: '500', // Default weight
            color: theme.text,
        },
        optionLabelSelected: {
            ...bodyStyles, // Typography for selected option labels
            flex: 1,
            fontWeight: 'bold', // Override weight
            color: theme.primary, // Override color
        },
        radioOuter: {
            height: 22,
            width: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },
        radioOuterSelected: { // No change from your version, looks good
            height: 22,
            width: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },
        radioInner: { // No change, looks good
            height: 12,
            width: 12,
            borderRadius: 6,
            backgroundColor: theme.primary,
        },
        clearButton: {
            marginTop: 5,
            marginBottom: 5,
            alignSelf: 'flex-end',
            paddingVertical: 6,
            paddingHorizontal: 12,
        },
        clearButtonText: {
            ...labelStyles, // Using label style for clear button text
            color: theme.primary,
            fontWeight: '500',
        },
    });
};

export default ChildProfileSection;