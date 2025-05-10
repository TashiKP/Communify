import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChild, faHeart, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography';

// --- Import Local Types ---
import { ParentalSettingsData, AsdLevel } from './types';

// --- Component Props ---
interface ChildProfileSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    t: TFunction<"translation", undefined>;
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
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // --- Profile Options Data ---
    const profileOptions: { level: AsdLevel | 'noAsd'; labelKey: string; icon: any }[] = [
        { level: 'high', labelKey: "parentalControls.childProfile.level3Label", icon: faHeart },
        { level: 'medium', labelKey: "parentalControls.childProfile.level2Label", icon: faChild },
        { level: 'low', labelKey: "parentalControls.childProfile.level1Label", icon: faUserShield },
        { level: 'noAsd', labelKey: "parentalControls.childProfile.noNeedsLabel", icon: faUserShield }
    ];

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faChild}
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.childProfile.sectionTitle')}</Text>
            </View>

            {/* Info Text */}
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('parentalControls.childProfile.infoText')}
            </Text>

            {/* Options List */}
            <View style={styles.optionsList}>
                {profileOptions.map(({ level, labelKey, icon }) => {
                    const currentLevelToCompare = level === 'noAsd' ? null : level;
                    const isSelected = settings.asdLevel === currentLevelToCompare;

                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const labelStyle = isSelected ? styles.optionLabelSelected : styles.optionLabel;
                    const radioOuterStyle = isSelected ? styles.radioOuterSelected : styles.radioOuter;
                    const label = t(labelKey);

                    return (
                        <TouchableOpacity
                            key={level}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => onSettingChange('asdLevel', currentLevelToCompare as AsdLevel | null)}
                            activeOpacity={0.7}
                            accessibilityLabel={t('parentalControls.childProfile.optionAccessibilityLabel', { profile: label })}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                        >
                            <FontAwesomeIcon icon={icon} size={fonts.body * 1.1} color={iconColor} style={styles.optionIcon} />
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
                        activeOpacity={0.7}
                        accessibilityLabel={t('parentalControls.childProfile.clearAccessibilityLabel')}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.clearButtonText, { color: theme.primary }]}>
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
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);

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
        },
        defaultSectionTitle: {
            ...h2Styles,
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        infoText: {
            ...bodyStyles,
            color: theme.textSecondary,
            paddingVertical: 15,
            textAlign: 'left',
            paddingHorizontal: 18,
        },
        optionsList: {
            paddingHorizontal: 18,
            paddingBottom: 15,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background,
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
            width: fonts.body * 1.1,
            textAlign: 'center',
        },
        optionLabel: {
            ...bodyStyles,
            flex: 1,
            fontWeight: '500',
            color: theme.text,
        },
        optionLabelSelected: {
            ...bodyStyles,
            flex: 1,
            fontWeight: '600',
            color: theme.primary,
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
        radioOuterSelected: {
            height: 22,
            width: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
        },
        radioInner: {
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
            ...bodyStyles,
            fontWeight: '500',
        },
    });
};

export default ChildProfileSection;