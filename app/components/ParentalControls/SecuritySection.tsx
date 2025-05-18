// app/components/parental/SecuritySection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight, faKey } from '@fortawesome/free-solid-svg-icons'; // faKey could be an alternative
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Shared Types from apiService.ts ---
import { ParentalSettingsData } from '../../services/apiService';

// --- Component Props ---
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    isLoadingPasscodeStatus?: boolean;
    t: TFunction<"translation", undefined>;
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>;
}

// --- Component ---
const SecuritySection: React.FC<SecuritySectionProps> = ({
    settings,
    passcodeExists,
    onSettingChange,
    onTogglePasscodeSetup,
    isLoadingPasscodeStatus = false,
    t, // t prop is used
    sectionStyle,
    headerStyle,
    titleStyle,
    iconStyle,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();
    const { i18n } = useTranslation(); // Only need i18n if t is passed as prop
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' },
        thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined, // Thumb color for Android
        ios_backgroundColor: theme.disabled || '#767577', // Background for iOS track
    }), [theme]);

    // --- Logic ---
    const canEnablePasscodeRequirement = passcodeExists;

    const handleRequirePasscodeToggle = (value: boolean) => {
        if (value && !canEnablePasscodeRequirement) {
            Alert.alert(
                t('parentalControls.security.setPasscodeFirstTitle', 'Set Passcode First'),
                t('parentalControls.security.setPasscodeFirstMessage', 'Please set up a passcode before requiring it for settings changes.')
            );
            return; 
        }
        onSettingChange('requirePasscode', value);
    };

    const isSwitchDisabled =
        isLoadingPasscodeStatus ||
        (!settings.requirePasscode && !canEnablePasscodeRequirement);

    const isConfigureButtonDisabled = isLoadingPasscodeStatus;

    // Determine colors based on disabled state
    const switchRowTextColor = isSwitchDisabled ? (theme.disabled || '#aaa') : (theme.text || '#000');
    const switchRowIconColor = isSwitchDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');
    const configureButtonTextColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.text || '#000'); // Use theme.text for enabled
    const configureButtonIconColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');
    const chevronColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');

    const setOrChangePasscodeText = passcodeExists
        ? t('parentalControls.security.changePasscodeLabel', 'Change Passcode')
        : t('parentalControls.security.setPasscodeLabel', 'Set Passcode');

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faLock}
                    size={(fonts.h2 || 20) * 0.7}
                    color={theme.primary || '#007aff'}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.security.sectionTitle', 'Security & Passcode')}</Text>
                {isLoadingPasscodeStatus && (
                    <ActivityIndicator size="small" color={theme.primary || '#007aff'} style={styles.headerLoader} />
                )}
            </View>

            <View style={[styles.settingRow, isSwitchDisabled && styles.disabledVisual]}>
                <FontAwesomeIcon icon={faUserShield} size={(fonts.body || 16) * 1.1} color={switchRowIconColor} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: switchRowTextColor }]}>
                    {t('parentalControls.security.requirePasscodeLabel', 'Require Passcode for Settings')}
                </Text>
                <Switch
                    value={settings.requirePasscode}
                    onValueChange={handleRequirePasscodeToggle}
                    disabled={isSwitchDisabled}
                    trackColor={switchStyles.trackColor}
                    thumbColor={switchStyles.thumbColor}
                    ios_backgroundColor={switchStyles.ios_backgroundColor}
                    accessibilityLabel={t('parentalControls.security.requirePasscodeAccessibilityLabel', 'Toggle passcode requirement for settings')}
                    accessibilityState={{ disabled: isSwitchDisabled, checked: settings.requirePasscode }}
                />
            </View>

            <View style={[styles.cardFooter, isConfigureButtonDisabled && styles.disabledVisual]}>
                <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onTogglePasscodeSetup}
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.7} // No visual feedback if disabled
                    disabled={isConfigureButtonDisabled}
                    accessibilityLabel={setOrChangePasscodeText}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
                >
                    <FontAwesomeIcon
                        icon={passcodeExists ? faKey : faUserShield} // Different icon based on state
                        size={fonts.body || 16}
                        color={configureButtonIconColor}
                        style={styles.featureIcon}
                    />
                    <Text style={[styles.featureLabel, { color: configureButtonTextColor }]}>
                        {setOrChangePasscodeText}
                    </Text>
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        size={fonts.body || 16}
                        color={chevronColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const bodyFontSize = fonts.body || 16;
    // const h2FontSize = fonts.h2 || 20; // Not directly used, but good reference

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);


    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card || '#fff',
            borderRadius: 12,
            marginBottom: 20,
            // borderWidth: StyleSheet.hairlineWidth, // Kept from original
            // borderColor: theme.border || '#ddd', // Kept from original
            // Using shadow from ParentalControls.tsx for consistency if preferred:
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.3 : 0.1,
            shadowRadius: 3,
            elevation: 2, // Matched elevation from ParentalControls sections
            borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0, // Add this from ParentalControls
            borderColor: theme.border, // Add this from ParentalControls
            overflow: 'hidden',
        },
        defaultCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 15,
            paddingBottom: 10, // Reduced slightly for tighter look
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border || '#ddd',
        },
        defaultCardIcon: {
            marginRight: 12,
        },
        defaultSectionTitle: { 
            ...labelStyles, // Use label style as base
            fontWeight: '600',
            color: theme.text || '#000',
            flex: 1,
        },
        headerLoader: {
            marginLeft: 10,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12, // Standardized padding
            minHeight: 50, // Good minimum height
            paddingHorizontal: 18,
        },
        settingIcon: {
            marginRight: 15, // Slightly less margin
            width: (fonts.body || 16) * 1.1, // Relative to body font size
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            marginRight: 10,
        },
        cardFooter: { // This View wraps the TouchableOpacity
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border || '#ddd',
        },
        featureRow: { // This is the TouchableOpacity itself
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 15, // More padding for a better tap area
            minHeight: 50,
            paddingHorizontal: 18,
        },
        featureIcon: {
            marginRight: 15,
            width: bodyFontSize,
            textAlign: 'center',
        },
        featureLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            marginRight: 10,
        },
        disabledVisual: { // Renamed from disabledOverlay for clarity
            opacity: 0.6, 
        },
    });
};

export default SecuritySection;