// src/components/parental/SecuritySection.tsx
import React, { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { TFunction } from 'i18next'; // Import TFunction type

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types'; // Ensure this path is correct

// --- Component Props ---
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    isLoadingPasscodeStatus?: boolean;
    t: TFunction<"translation", undefined>; // <-- ADDED: t function prop
}

// --- Component ---
const SecuritySection: React.FC<SecuritySectionProps> = ({
    settings,
    passcodeExists,
    onSettingChange,
    onTogglePasscodeSetup,
    isLoadingPasscodeStatus = false,
    t, // <-- Destructure t function
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
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
                 t('parentalControls.security.setPasscodeFirstTitle'), // Use t()
                 t('parentalControls.security.setPasscodeFirstMessage') // Use t()
             );
             return;
        }
         onSettingChange('requirePasscode', value);
    };

    const isSwitchDisabled =
        isLoadingPasscodeStatus ||
        (!settings.requirePasscode && !canEnablePasscodeRequirement);

    const isConfigureButtonDisabled = isLoadingPasscodeStatus;

    const switchRowTextColor = isSwitchDisabled ? theme.disabled : theme.text;
    const switchRowIconColor = isSwitchDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonTextColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonIconColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const chevronColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;

    const setOrChangePasscodeText = passcodeExists
        ? t('parentalControls.security.changePasscodeLabel')
        : t('parentalControls.security.setPasscodeLabel');

    return (
        <View style={styles.sectionCard}>
             {/* Card Header */}
             <View style={styles.cardHeader}>
               <FontAwesomeIcon icon={faLock} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>{t('parentalControls.security.sectionTitle')}</Text>
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
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.7}
                    disabled={isConfigureButtonDisabled}
                    accessibilityLabel={setOrChangePasscodeText} // Already translated
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
               >
                   <FontAwesomeIcon
                        icon={faUserShield}
                        size={fonts.body}
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

// --- Styles (Unchanged from your previous version) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: { backgroundColor: theme.card, borderRadius: 12, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, overflow: 'hidden', },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 15, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, },
    cardIcon: { marginRight: 12, },
    sectionTitle: { fontSize: fonts.h2 * 0.9, fontWeight: '600', color: theme.text, flex: 1, },
    headerLoader: { marginLeft: 10, },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 44, paddingHorizontal: 18, },
    settingIcon: { marginRight: 18, width: fonts.body * 1.1, textAlign: 'center', },
    settingLabel: { flex: 1, fontSize: fonts.body, marginRight: 10, },
    cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, },
    featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 44, paddingHorizontal: 18, },
    featureIcon: { marginRight: 18, width: fonts.body, textAlign: 'center', },
    featureLabel: { flex: 1, fontSize: fonts.body, marginRight: 10, },
    disabledOverlay: { opacity: 0.6, },
});

export default SecuritySection;