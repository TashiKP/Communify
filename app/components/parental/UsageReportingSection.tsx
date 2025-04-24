// src/components/parental/UsageReportingSection.tsx
import React, { useMemo } from 'react'; // Added useMemo
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelopeCircleCheck, faTrash, faPlusCircle, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext'; // Adjust path

// --- Import Local Types ---
import { ParentalSettingsData } from './types';

// --- Component Props ---
interface UsageReportingSectionProps {
    settings: ParentalSettingsData;
    showAddEmailInput: boolean;
    newNotifyEmail: string;
    onNewEmailChange: (text: string) => void;
    onToggleAddEmail: () => void;
    onAddEmail: () => void;
    onDeleteEmail: (emailToDelete: string) => void;
    // styles prop no longer needed
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545'; // Keep distinct error color or add to theme

// --- Component ---
const UsageReportingSection: React.FC<UsageReportingSectionProps> = ({
    settings,
    showAddEmailInput,
    newNotifyEmail,
    onNewEmailChange,
    onToggleAddEmail,
    onAddEmail,
    onDeleteEmail,
}) => {
    // --- Consume Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    return (
        <View style={styles.sectionCard}>
            {/* Section Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faEnvelopeCircleCheck} size={fonts.h2 * 0.9} color={theme.primary} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Usage Reporting</Text>
            </View>

            {/* Description */}
            <Text style={styles.infoText}>
                Add email addresses to receive notifications about app usage.
            </Text>

            {/* List of Added Emails */}
            <View style={styles.emailListContainer}>
                {settings.notifyEmails.length === 0 && !showAddEmailInput && (
                    <Text style={styles.noEmailsText}>No notification emails added yet.</Text>
                )}
                {settings.notifyEmails.map((email, index) => (
                    <View key={index} style={styles.emailRow}>
                        <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">{email}</Text>
                        <TouchableOpacity
                            onPress={() => onDeleteEmail(email)}
                            style={styles.deleteEmailButton}
                            hitSlop={hitSlop}
                            accessibilityLabel={`Delete email address ${email}`}
                        >
                            <FontAwesomeIcon icon={faTrash} size={fonts.label * 1.1} color={errorColor} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Add Email Input Area (Conditional) */}
            {showAddEmailInput && (
                <View style={styles.addEmailContainer}>
                    <TextInput
                        style={styles.addEmailInput}
                        placeholder="Enter email address"
                        placeholderTextColor={theme.disabled} // Use theme color
                        value={newNotifyEmail}
                        onChangeText={onNewEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={onAddEmail} // Attempt add on submit
                        autoFocus={true}
                        selectionColor={theme.primary} // Use theme color
                        keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                    />
                    <TouchableOpacity
                        style={[styles.addEmailConfirmButton, !newNotifyEmail.trim() && styles.buttonDisabled]} // Use themed disabled style
                        onPress={onAddEmail}
                        disabled={!newNotifyEmail.trim()}
                        accessibilityLabel="Confirm adding email"
                        accessibilityState={{ disabled: !newNotifyEmail.trim() }}
                    >
                        <FontAwesomeIcon icon={faCheck} size={fonts.body} color={theme.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Add/Cancel Email Button */}
            <View style={styles.cardFooter}>
                 <TouchableOpacity style={styles.addEmailToggleButton} onPress={onToggleAddEmail}>
                     <FontAwesomeIcon
                        icon={showAddEmailInput ? faTimes : faPlusCircle}
                        size={fonts.label * 1.1}
                        color={theme.primary}
                        style={styles.buttonIcon}
                    />
                     <Text style={styles.addEmailToggleText}>
                         {showAddEmailInput ? 'Cancel Adding Email' : 'Add Notification Email'}
                     </Text>
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
        overflow: 'hidden',
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
    infoText: {
        fontSize: fonts.caption,
        color: theme.textSecondary,
        paddingVertical: 15,
        textAlign: 'left',
        paddingHorizontal: 18,
    },
    emailListContainer: {
        paddingHorizontal: 18,
        paddingBottom: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border, // Use theme border
        marginTop: 0, // No margin needed if infoText provides space
        paddingTop: 10,
    },
    emailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border, // Use theme border
    },
    emailText: {
        flex: 1,
        fontSize: fonts.body,
        color: theme.text, // Use theme text color
        marginRight: 10,
    },
    deleteEmailButton: {
        padding: 5, // Keep padding for tap area
    },
    noEmailsText: {
        fontStyle: 'italic',
        color: theme.textSecondary, // Use theme secondary text color
        textAlign: 'center',
        paddingVertical: 15,
        fontSize: fonts.body, // Use theme font size
    },
    addEmailContainer: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 15,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth, // Separator when shown
        borderTopColor: theme.border, // Use theme border
    },
    addEmailInput: {
        flex: 1,
        height: 44,
        borderColor: theme.border, // Use theme border
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        fontSize: fonts.body, // Use theme font size
        backgroundColor: theme.background, // Use theme background
        color: theme.text, // Use theme text
    },
    addEmailConfirmButton: {
        backgroundColor: theme.primary, // Use theme primary
        padding: 10,
        height: 44,
        width: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: { // General disabled style
        opacity: 0.5,
    },
    cardFooter: { // Inherited style, ensure border is themed
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        paddingVertical: 5, // Adjust padding as needed
    },
    addEmailToggleButton: {
         flexDirection: 'row',
         alignItems: 'center',
         paddingVertical: 8,
         justifyContent: 'center', // Center toggle button
     },
     buttonIcon: { // Inherited style for icon margin
        marginRight: 8,
    },
     addEmailToggleText: {
         fontSize: fonts.label, // Use theme font size
         color: theme.primary, // Use theme primary color
         fontWeight: '500',
     },
});

export default UsageReportingSection;