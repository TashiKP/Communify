// app/components/parental/SecuritySection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Or remove if using useTranslation directly
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Shared Types from apiService.ts ---
import { ParentalSettingsData } from '../../services/apiService'; // MODIFIED IMPORT

// --- Component Props ---
interface SecuritySectionProps {
    settings: ParentalSettingsData; // Now uses the type from apiService
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    isLoadingPasscodeStatus?: boolean;
    t: TFunction<"translation", undefined>; // Or remove
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
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' },
        thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined,
        ios_backgroundColor: theme.disabled || '#767577',
    }), [theme]);

    // --- Logic ---
    // User can enable "Require Passcode" only if a passcode already exists.
    const canEnablePasscodeRequirement = passcodeExists;

    const handleRequirePasscodeToggle = (value: boolean) => {
        if (value && !canEnablePasscodeRequirement) {
            // This alert should ideally prompt to set up a passcode or explain why it can't be enabled.
            Alert.alert(
                t('parentalControls.security.setPasscodeFirstTitle', 'Set Passcode First'),
                t('parentalControls.security.setPasscodeFirstMessage', 'Please set up a passcode before requiring it for settings changes.')
            );
            // Optionally, trigger onTogglePasscodeSetup() here if desired.
            // onTogglePasscodeSetup();
            return; // Prevent toggling if a passcode isn't set
        }
        onSettingChange('requirePasscode', value);
    };

    // The switch is disabled if still loading passcode status,
    // OR if trying to enable the requirement but no passcode is set yet.
    const isSwitchDisabled =
        isLoadingPasscodeStatus ||
        (!settings.requirePasscode && !canEnablePasscodeRequirement); // Disabled if trying to turn ON without passcode

    const isConfigureButtonDisabled = isLoadingPasscodeStatus;

    // Determine colors based on disabled state for dynamic styling within render
    const switchRowTextColor = isSwitchDisabled ? (theme.disabled || '#aaa') : (theme.text || '#000');
    const switchRowIconColor = isSwitchDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');
    const configureButtonTextColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');
    const configureButtonIconColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');
    const chevronColor = isConfigureButtonDisabled ? (theme.disabled || '#aaa') : (theme.textSecondary || '#555');

    const setOrChangePasscodeText = passcodeExists
        ? t('parentalControls.security.changePasscodeLabel')
        : t('parentalControls.security.setPasscodeLabel');

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
            {/* Card Header */}
            <View style={[styles.defaultCardHeader, headerStyle]}>
                <FontAwesomeIcon
                    icon={faLock}
                    size={(fonts.h2 || 20) * 0.7}
                    color={theme.primary || '#007aff'}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
                <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.security.sectionTitle')}</Text>
                {isLoadingPasscodeStatus && (
                    <ActivityIndicator size="small" color={theme.primary || '#007aff'} style={styles.headerLoader} />
                )}
            </View>

            {/* Require Passcode Switch Row */}
            <View style={[styles.settingRow, isSwitchDisabled && styles.disabledOverlay]}>
                <FontAwesomeIcon icon={faUserShield} size={(fonts.body || 16) * 1.1} color={switchRowIconColor} style={styles.settingIcon} />
                <Text style={[styles.settingLabel, { color: switchRowTextColor }]}>
                    {t('parentalControls.security.requirePasscodeLabel')}
                </Text>
                <Switch
                    value={settings.requirePasscode}
                    onValueChange={handleRequirePasscodeToggle}
                    disabled={isSwitchDisabled}
                    {...switchStyles} // Already has fallbacks
                    accessibilityLabel={t('parentalControls.security.requirePasscodeAccessibilityLabel')}
                    accessibilityState={{ disabled: isSwitchDisabled, checked: settings.requirePasscode }}
                />
            </View>

            {/* Set/Change Passcode Link Row */}
            <View style={[styles.cardFooter, isConfigureButtonDisabled && styles.disabledOverlay]}>
                <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onTogglePasscodeSetup}
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.7}
                    disabled={isConfigureButtonDisabled}
                    accessibilityLabel={setOrChangePasscodeText}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
                >
                    <FontAwesomeIcon
                        icon={faUserShield} // Can use faKey or faUserShield
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
    const h2FontSize = fonts.h2 || 20;

    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    // const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage); // If used directly for section title

    return StyleSheet.create({
        defaultSectionCard: {
            backgroundColor: theme.card || '#fff',
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border || '#ddd',
            overflow: 'hidden', // Important for borderRadius on children if any
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
        defaultSectionTitle: { // Style passed from parent, but good to have a fallback
            fontSize: fonts.label || 16,
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
            paddingVertical: 10,
            minHeight: 44, // Good for tap targets
            paddingHorizontal: 18,
        },
        settingIcon: {
            marginRight: 18,
            width: bodyFontSize * 1.1, // Relative to body font size
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
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
            minHeight: 44, // Good for tap targets
            paddingHorizontal: 18,
        },
        featureIcon: {
            marginRight: 18,
            width: bodyFontSize, // Relative to body font size
            textAlign: 'center',
        },
        featureLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            flex: 1,
            marginRight: 10,
        },
        disabledOverlay: {
            opacity: 0.6, // Visual cue for disabled state
        },
    });
};

export default SecuritySection;