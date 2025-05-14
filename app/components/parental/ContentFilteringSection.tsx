// app/components/parental/ContentFilteringSection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShieldAlt, faBan, faEyeSlash, faGlobe, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Keep this if t prop is strictly typed this way
import { useTranslation } from 'react-i18next'; // Can use this directly if t prop is not needed

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Shared Types from apiService.ts ---
import { ParentalSettingsData } from '../../services/apiService'; // MODIFIED IMPORT

// --- Component Props ---
interface ContentFilteringSectionProps {
    settings: ParentalSettingsData; // Now uses the type from apiService
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigureWeb: () => void;
    t: TFunction<"translation", undefined>; // Or just use useTranslation hook below
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
}

// --- Component ---
const ContentFilteringSection: React.FC<ContentFilteringSectionProps> = ({
    settings,
    onSettingChange,
    onConfigureWeb,
    t, // Can be removed if useTranslation is used directly for all t() calls
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();
    // const { t, i18n } = useTranslation(); // If t prop is removed, uncomment this
    const { i18n } = useTranslation(); // Only need i18n if t is passed as prop
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' }, // Added fallbacks
        thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined, // Added fallback
        ios_backgroundColor: theme.disabled || '#767577', // Added fallback
    }), [theme]);

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faShieldAlt}
                    size={(fonts.h2 || 20) * 0.7} // Added fallback for fonts.h2
                    color={theme.primary || '#007aff'} // Added fallback
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.contentFiltering.sectionTitle')}</Text>
            </View>

            {/* Block Violence */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBan} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.settingIcon}/>
                <Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>
                    {t('parentalControls.contentFiltering.blockViolenceLabel')}
                </Text>
                <Switch
                    value={settings.blockViolence}
                    onValueChange={(v) => onSettingChange('blockViolence', v)}
                    {...switchStyles}
                    accessibilityLabel={t('parentalControls.contentFiltering.blockViolenceAccessibilityLabel')}
                    accessibilityState={{ checked: settings.blockViolence }}
                />
            </View>

            {/* Block Inappropriate */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faEyeSlash} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.settingIcon}/>
                <Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>
                    {t('parentalControls.contentFiltering.blockInappropriateLabel')}
                </Text>
                <Switch
                    value={settings.blockInappropriate}
                    onValueChange={(v) => onSettingChange('blockInappropriate', v)}
                    {...switchStyles}
                    accessibilityLabel={t('parentalControls.contentFiltering.blockInappropriateAccessibilityLabel')}
                    accessibilityState={{ checked: settings.blockInappropriate }}
                />
            </View>

            {/* Web Filtering Link */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onConfigureWeb}
                    activeOpacity={0.7}
                    accessibilityLabel={t('parentalControls.contentFiltering.webFilteringAccessibilityLabel')}
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faGlobe} size={fonts.body || 16} color={theme.textSecondary || '#555'} style={styles.featureIcon}/>
                    <Text style={[styles.featureLabel, { color: theme.textSecondary || '#555' }]}>
                        {t('parentalControls.contentFiltering.webFilteringLabel')}
                    </Text>
                    <FontAwesomeIcon icon={faChevronRight} size={fonts.label || 14} color={theme.textSecondary || '#555'} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyFontSize = fonts.body || 16; // Fallback
    const labelFontSize = fonts.label || 14; // Fallback
    const h2FontSize = fonts.h2 || 20; // Fallback

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

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
        defaultSectionTitle: {
            ...labelStyles,
            fontSize: labelFontSize, // Use defined or fallback
            fontWeight: '600',
            color: theme.text || '#000',
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
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize, // Use defined or fallback
            flex: 1,
            marginRight: 10,
        },
        cardFooter: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border || '#ddd',
        },
        featureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            minHeight: 44,
            paddingHorizontal: 18,
        },
        featureIcon: {
            marginRight: 18,
            width: bodyFontSize,
            textAlign: 'center',
        },
        featureLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize, // Use defined or fallback
            flex: 1,
            marginRight: 10,
        },
    });
};

export default ContentFilteringSection;