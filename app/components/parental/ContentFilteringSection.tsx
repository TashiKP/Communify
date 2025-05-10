// app/components/parental/ContentFilteringSection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShieldAlt, faBan, faEyeSlash, faGlobe, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography';

// --- Import Local Types ---
import { ParentalSettingsData } from './types';

// --- Component Props ---
interface ContentFilteringSectionProps {
    settings: ParentalSettingsData;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onConfigureWeb: () => void;
    t: TFunction<"translation", undefined>;
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
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faShieldAlt}
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.contentFiltering.sectionTitle')}</Text>
            </View>

            {/* Block Violence */}
            <View style={styles.settingRow}>
                <FontAwesomeIcon icon={faBan} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
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
                <FontAwesomeIcon icon={faEyeSlash} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.settingIcon}/>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
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
                    <FontAwesomeIcon icon={faGlobe} size={fonts.body} color={theme.textSecondary} style={styles.featureIcon}/>
                    <Text style={[styles.featureLabel, { color: theme.textSecondary }]}>
                        {t('parentalControls.contentFiltering.webFilteringLabel')}
                    </Text>
                    <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

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
            ...labelStyles,
            fontWeight: '600',
            color: theme.text,
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
            width: fonts.body * 1.1,
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles,
            flex: 1,
            marginRight: 10,
        },
        cardFooter: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
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
            width: fonts.body,
            textAlign: 'center',
        },
        featureLabel: {
            ...bodyStyles,
            flex: 1,
            marginRight: 10,
        },
    });
};

export default ContentFilteringSection;