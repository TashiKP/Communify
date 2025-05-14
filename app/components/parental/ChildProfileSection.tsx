// app/components/parental/ChildProfileSection.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'; // Removed TextInput, Switch as they are not used here
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Or remove if using useTranslation directly
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Shared Types from apiService.ts ---
import { ParentalSettingsData, AsdLevel } from '../../services/apiService'; // MODIFIED IMPORT

// --- Component Props ---
interface ChildProfileSectionProps {
    settings: ParentalSettingsData; // Now uses the type from apiService
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    t: TFunction<"translation", undefined>; // Or remove
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
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
    // const { t, i18n } = useTranslation(); // Uncomment if t prop is removed
    const { i18n } = useTranslation(); // Only need i18n if t is passed as prop
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // --- Profile Options Data ---
    // The 'level' type here must match the AsdLevel from apiService (which includes null and "noAsd")
    const profileOptions: { level: AsdLevel | 'noAsd'; labelKey: string; icon: any }[] = [
        { level: 'high', labelKey: "parentalControls.childProfile.level3Label", icon: faHeart },
        { level: 'medium', labelKey: "parentalControls.childProfile.level2Label", icon: faChild },
        { level: 'low', labelKey: "parentalControls.childProfile.level1Label", icon: faUserShield },
        { level: 'noAsd', labelKey: "parentalControls.childProfile.noNeedsLabel", icon: faUserShield } // 'noAsd' is a string value representing null in the UI
    ];

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faChild}
                    size={(fonts.h2 || 20) * 0.7} // Added fallback for fonts.h2
                    color={theme.primary || '#007aff'} // Added fallback
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.childProfile.sectionTitle')}</Text>
            </View>

            {/* Info Text */}
            <Text style={[styles.infoText, { color: theme.textSecondary || '#555' }]}>
                {t('parentalControls.childProfile.infoText')}
            </Text>

            {/* Options List */}
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, labelKey, icon }) => {
                    // When 'noAsd' is selected in UI, we store `null` in the settings.
                    // When comparing, if level is 'noAsd', we compare against `null`.
                    const valueToCompareWithSettings = level === 'noAsd' ? null : level;
                    const isSelected = settings.asdLevel === valueToCompareWithSettings;

                    const iconColor = isSelected ? (theme.primary || '#007aff') : (theme.textSecondary || '#555');
                    const labelStyle = isSelected ? styles.optionLabelSelected : styles.optionLabel;
                    const radioOuterStyle = isSelected ? styles.radioOuterSelected : styles.radioOuter;
                    const label = t(labelKey);

                    return (
                        <TouchableOpacity
                            key={String(level)} // Ensure key is a string
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => onSettingChange('asdLevel', valueToCompareWithSettings)} // Pass null if 'noAsd'
                            activeOpacity={0.7}
                            accessibilityLabel={t('parentalControls.childProfile.optionAccessibilityLabel', { profile: label })}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                        >
                            <FontAwesomeIcon icon={icon} size={(fonts.body || 16) * 1.1} color={iconColor} style={styles.optionIcon} />
                            <Text style={labelStyle}>{label}</Text>
                            <View style={radioOuterStyle}>
                                {isSelected && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {settings.asdLevel !== null && ( // Show clear button only if a level (not 'noAsd'/null) is selected
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => onSettingChange('asdLevel', null)} // Clears to null
                        activeOpacity={0.7}
                        accessibilityLabel={t('parentalControls.childProfile.clearAccessibilityLabel')}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.clearButtonText, { color: theme.primary || '#007aff' }]}>
                            {t('parentalControls.childProfile.clearButtonText')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyFontSize = fonts.body || 16;
    const h2FontSize = fonts.h2 || 20;

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    // const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage); // Not directly used in this section's own elements

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
        defaultSectionTitle: { // This style is passed from ParentalControls, providing a fallback
            fontSize: fonts.label || 16,
            fontWeight: '600',
            color: theme.text || '#000',
            flex: 1,
        },
        infoText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            paddingVertical: 15,
            textAlign: 'left',
            paddingHorizontal: 18,
        },
        optionsList: {
            paddingHorizontal: 18,
            paddingBottom: 15,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border || '#ddd',
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background || '#f0f0f0',
            paddingVertical: 12,
            paddingHorizontal: 15,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.border || '#ccc',
            marginBottom: 10,
        },
        optionCardSelected: {
            borderColor: theme.primary || '#007aff',
            backgroundColor: theme.primaryMuted || '#e0f3ff', // Fallback for primaryMuted
        },
        optionIcon: {
            marginRight: 15,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        optionLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            fontWeight: '500',
            color: theme.text || '#000',
        },
        optionLabelSelected: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            fontWeight: '600',
            color: theme.primary || '#007aff',
        },
        radioOuter: {
            height: 22,
            width: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: theme.border || '#ccc',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },
        radioOuterSelected: {
            borderColor: theme.primary || '#007aff',
            // Duplicates definition, keep only one if identical
            // height: 22,
            // width: 22,
            // borderRadius: 11,
            // borderWidth: 2,
            // alignItems: 'center',
            // justifyContent: 'center',
            // marginLeft: 10,
        },
        radioInner: {
            height: 12,
            width: 12,
            borderRadius: 6,
            backgroundColor: theme.primary || '#007aff',
        },
        clearButton: {
            marginTop: 5,
            marginBottom: 5,
            alignSelf: 'flex-end',
            paddingVertical: 6,
            paddingHorizontal: 12,
        },
        clearButtonText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
        },
    });
};

export default ChildProfileSection;