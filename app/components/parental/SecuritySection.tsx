// src/components/parental/SecuritySection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import {TFunction} from 'i18next';
import { useTranslation } from 'react-i18next'; // Corrected import

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../../styles/typography'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types'; // Ensure this path is correct

// --- Component Props ---
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    isLoadingPasscodeStatus?: boolean;
    t: TFunction<"translation", undefined>;
    // Style props passed from parent
    sectionStyle?: StyleProp<ViewStyle>;
    headerStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<TextStyle>; // For the main section icon
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
    const { i18n } = useTranslation(); // Get i18n instance for currentLanguage
    const currentLanguage = i18n.language;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    // --- Logic ---
    const canEnablePasscodeRequirement = passcodeExists;

    const handleRequirePasscodeToggle = (value: boolean) => {
        if (value && !canEnablePasscodeRequirement) {
             Alert.alert(
                 t('parentalControls.security.setPasscodeFirstTitle'),
                 t('parentalControls.security.setPasscodeFirstMessage')
             );
             return;
        }
         onSettingChange('requirePasscode', value);
    };

    const isSwitchDisabled =
        isLoadingPasscodeStatus ||
        (!settings.requirePasscode && !canEnablePasscodeRequirement);

    const isConfigureButtonDisabled = isLoadingPasscodeStatus;

    // Determine colors based on disabled state for dynamic styling within render
    const switchRowTextColor = isSwitchDisabled ? theme.disabled : theme.text;
    const switchRowIconColor = isSwitchDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonTextColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonIconColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const chevronColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;

    const setOrChangePasscodeText = passcodeExists
        ? t('parentalControls.security.changePasscodeLabel')
        : t('parentalControls.security.setPasscodeLabel');

    return (
        <View style={[styles.defaultSectionCard, sectionStyle]}>
             {/* Card Header */}
             <View style={[styles.defaultCardHeader, headerStyle]}>
               <FontAwesomeIcon
                    icon={faLock} // Icon for this section
                    size={fonts.h2 * 0.7}
                    color={theme.primary}
                    style={[styles.defaultCardIcon, iconStyle]}
                />
               <Text style={[styles.defaultSectionTitle, titleStyle]}>{t('parentalControls.security.sectionTitle')}</Text>
               {isLoadingPasscodeStatus && (
                    <ActivityIndicator size="small" color={theme.primary} style={styles.headerLoader} />
               )}
             </View>

            {/* --- Require Passcode Switch Row --- */}
            <View style={[styles.settingRow, isSwitchDisabled && styles.disabledOverlay]}>
               <FontAwesomeIcon icon={faUserShield} size={fonts.body * 1.1} color={switchRowIconColor} style={styles.settingIcon}/>
               <Text style={[styles.settingLabel, { color: switchRowTextColor }]}>
                   {t('parentalControls.security.requirePasscodeLabel')}
                </Text>
               <Switch
                   value={settings.requirePasscode}
                   onValueChange={handleRequirePasscodeToggle}
                   disabled={isSwitchDisabled}
                   trackColor={switchStyles.trackColor}
                   thumbColor={switchStyles.thumbColor}
                   ios_backgroundColor={switchStyles.ios_backgroundColor}
                   accessibilityLabel={t('parentalControls.security.requirePasscodeAccessibilityLabel')}
                   accessibilityState={{ disabled: isSwitchDisabled, checked: settings.requirePasscode }}
               />
           </View>

            {/* --- Set/Change Passcode Link Row --- */}
            <View style={[styles.cardFooter, isConfigureButtonDisabled && styles.disabledOverlay]}>
               <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onTogglePasscodeSetup}
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.7} // Use 1 for disabled to prevent visual feedback
                    disabled={isConfigureButtonDisabled}
                    accessibilityLabel={setOrChangePasscodeText}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
               >
                   <FontAwesomeIcon
                        icon={faUserShield} // Consistent icon for passcode actions
                        size={fonts.body} // Standard icon size
                        color={configureButtonIconColor}
                        style={styles.featureIcon}
                    />
                   <Text style={[styles.featureLabel, { color: configureButtonTextColor }]}>
                       {setOrChangePasscodeText}
                   </Text>
                   <FontAwesomeIcon
                        icon={faChevronRight}
                        size={fonts.label}
                        color={chevronColor}
                    />
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
            ...labelStyles, // Using label for section titles
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        headerLoader: {
            marginLeft: 10,
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
            width: fonts.body * 1.1, // Base width on font size
            textAlign: 'center',
        },
        settingLabel: {
            ...bodyStyles, // Typography for setting labels
            flex: 1,
            // color is set dynamically in component render
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
            width: fonts.body, // Standard icon width
            textAlign: 'center',
        },
        featureLabel: {
            ...bodyStyles, // Typography for feature labels
            flex: 1,
            // color is set dynamically in component render
            marginRight: 10,
        },
        disabledOverlay: { // Apply this to rows when they are disabled
            opacity: 0.6, // Visual cue for disabled state
        },
    });
};

export default SecuritySection;