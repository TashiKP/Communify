// src/components/parental/SecuritySection.tsx
import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faUserShield, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types';

// --- Component Props ---
interface SecuritySectionProps {
    settings: ParentalSettingsData;
    passcodeExists: boolean;
    onSettingChange: <K extends keyof ParentalSettingsData>(key: K, value: ParentalSettingsData[K]) => void;
    onTogglePasscodeSetup: () => void;
    isLoadingPasscodeStatus?: boolean;
    // switchStyles and styles props are no longer needed
}

// --- Component ---
const SecuritySection: React.FC<SecuritySectionProps> = ({
    settings,
    passcodeExists,
    onSettingChange,
    onTogglePasscodeSetup,
    isLoadingPasscodeStatus = false,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);
    const switchStyles = useMemo(() => ({ // Generate switch styles from theme
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);

    // --- Logic ---
    const canEnablePasscodeRequirement = passcodeExists;

    const handleRequirePasscodeToggle = (value: boolean) => {
        if (value && !canEnablePasscodeRequirement) {
             Alert.alert(
                 "Set Passcode First",
                 "Please set a passcode using the option below before requiring it."
             );
             return; // Prevent toggle ON if no passcode exists
        }
         onSettingChange('requirePasscode', value);
    };

    // Combined disabled state logic
    const isSwitchDisabled =
        isLoadingPasscodeStatus ||
        (!settings.requirePasscode && !canEnablePasscodeRequirement);

    const isConfigureButtonDisabled = isLoadingPasscodeStatus;

    // Determine colors based on disabled state and theme
    const switchRowTextColor = isSwitchDisabled ? theme.disabled : theme.text;
    const switchRowIconColor = isSwitchDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonTextColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const configureButtonIconColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;
    const chevronColor = isConfigureButtonDisabled ? theme.disabled : theme.textSecondary;

    return (
        <View style={styles.sectionCard}>
             {/* Card Header */}
             <View style={styles.cardHeader}>
               <FontAwesomeIcon icon={faLock} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
               <Text style={styles.sectionTitle}>Security</Text>
               {isLoadingPasscodeStatus && (
                    <ActivityIndicator size="small" color={theme.primary} style={styles.headerLoader} />
               )}
             </View>

            {/* --- Require Passcode Switch Row --- */}
            {/* Apply opacity directly if needed, or rely on color changes */}
            <View style={[styles.settingRow, isSwitchDisabled && styles.disabledOverlay]}>
               <FontAwesomeIcon icon={faUserShield} size={fonts.body * 1.1} color={switchRowIconColor} style={styles.settingIcon}/>
               <Text style={[styles.settingLabel, { color: switchRowTextColor }]}>
                   Require Parent Passcode
                </Text>
               <Switch
                   value={settings.requirePasscode}
                   onValueChange={handleRequirePasscodeToggle}
                   disabled={isSwitchDisabled}
                   // Use themed switchStyles, disabled state handled by the component
                   trackColor={switchStyles.trackColor}
                   thumbColor={switchStyles.thumbColor}
                   ios_backgroundColor={switchStyles.ios_backgroundColor}
                   accessibilityLabel="Require Parent Passcode"
                   accessibilityState={{ disabled: isSwitchDisabled, checked: settings.requirePasscode }}
               />
           </View>

            {/* --- Set/Change Passcode Link Row --- */}
            <View style={[styles.cardFooter, isConfigureButtonDisabled && styles.disabledOverlay]}>
               <TouchableOpacity
                    style={styles.featureRow}
                    onPress={onTogglePasscodeSetup}
                    activeOpacity={isConfigureButtonDisabled ? 1 : 0.7} // Adjust opacity
                    disabled={isConfigureButtonDisabled}
                    accessibilityLabel={passcodeExists ? 'Change Passcode' : 'Set Passcode'}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isConfigureButtonDisabled }}
               >
                   <FontAwesomeIcon
                        icon={faUserShield}
                        size={fonts.body} // Adjust size based on fonts
                        color={configureButtonIconColor}
                        style={styles.featureIcon}
                    />
                   <Text style={[styles.featureLabel, { color: configureButtonTextColor }]}>
                       {passcodeExists ? 'Change Passcode' : 'Set Passcode'}
                   </Text>
                   <FontAwesomeIcon
                        icon={faChevronRight}
                        size={fonts.label} // Adjust size based on fonts
                        color={chevronColor}
                    />
               </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    sectionCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
        overflow: 'hidden', // Keep overflow hidden
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    cardIcon: {
        marginRight: 12,
        // size/color set dynamically
    },
    sectionTitle: {
        fontSize: fonts.h2 * 0.9,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
    },
    headerLoader: { // Style for loader in header
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
        width: fonts.body * 1.1,
        textAlign: 'center',
        // color set dynamically
    },
    settingLabel: {
        flex: 1,
        fontSize: fonts.body,
        // color set dynamically based on disabled state
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
         // color set dynamically
    },
    featureLabel: {
        flex: 1,
        fontSize: fonts.body,
        // color set dynamically based on disabled state
        marginRight: 10,
    },
    // Chevron color set dynamically
    disabledOverlay: { // Optional style for disabled rows
        opacity: 0.6,
    },
    // disabledText style removed - handled inline with {color: ...}
});

export default SecuritySection;