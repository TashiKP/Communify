// src/components/parental/UsageReportingSection.tsx
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelopeCircleCheck, faTrash, faPlusCircle, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ParentalSettingsData } from './types';

// Props specific to this section
interface UsageReportingSectionProps {
    settings: ParentalSettingsData;
    showAddEmailInput: boolean;
    newNotifyEmail: string;
    onNewEmailChange: (text: string) => void;
    onToggleAddEmail: () => void;
    onAddEmail: () => void;
    onDeleteEmail: (emailToDelete: string) => void;
    styles: any; // Shared styles object passed from parent
}

const UsageReportingSection: React.FC<UsageReportingSectionProps> = ({
    settings,
    showAddEmailInput,
    newNotifyEmail,
    onNewEmailChange,
    onToggleAddEmail,
    onAddEmail,
    onDeleteEmail,
    styles // Use passed styles object directly
}) => {

    return (
        // Use styles from the passed 'styles' prop for shared elements
        <View style={styles.sectionCard}>
            {/* Section Header */}
            <View style={styles.cardHeader}>
                <FontAwesomeIcon icon={faEnvelopeCircleCheck} size={18} color={styles._primaryColor} style={styles.cardIcon}/>
                <Text style={styles.sectionTitle}>Usage Reporting</Text>
            </View>

            {/* Description */}
            <Text style={styles.infoText}>
                Add email addresses to receive notifications about app usage.
            </Text>

            {/* List of Added Emails */}
            {/* Use local styles for elements specific to this section */}
            <View style={localStyles.emailListContainer}>
                {settings.notifyEmails.length === 0 && !showAddEmailInput && (
                    <Text style={[localStyles.noEmailsText, { color: styles._darkGrey }]}>No notification emails added yet.</Text>
                )}
                {settings.notifyEmails.map((email, index) => (
                    <View key={index} style={localStyles.emailRow}>
                        <Text style={[localStyles.emailText, { color: styles._textColor }]} numberOfLines={1} ellipsizeMode="tail">{email}</Text>
                        <TouchableOpacity onPress={() => onDeleteEmail(email)} style={localStyles.deleteEmailButton} hitSlop={styles.hitSlop}>
                            <FontAwesomeIcon icon={faTrash} size={16} color={styles._errorColor || '#dc3545'} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Add Email Input Area (Conditional) */}
            {showAddEmailInput && (
                <View style={localStyles.addEmailContainer}>
                    <TextInput
                        style={[localStyles.addEmailInput, { borderColor: styles._mediumGrey, backgroundColor: styles._whiteColor, color: styles._textColor }]} // Use colors from parent styles
                        placeholder="Enter email address"
                        placeholderTextColor={styles._placeholderColor}
                        value={newNotifyEmail}
                        onChangeText={onNewEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={onAddEmail} // Attempt add on submit
                        autoFocus={true}
                        selectionColor={styles._primaryColor} // Use theme color for cursor/selection
                    />
                    <TouchableOpacity
                        style={[localStyles.addEmailConfirmButton, { backgroundColor: styles._primaryColor }, !newNotifyEmail.trim() && styles.modalButtonDisabled]} // Use parent styles
                        onPress={onAddEmail}
                        disabled={!newNotifyEmail.trim()}
                    >
                        <FontAwesomeIcon icon={faCheck} size={16} color={styles._whiteColor} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Add/Cancel Email Button */}
            {/* Use cardFooter style from parent */}
            <View style={[styles.cardFooter, localStyles.toggleButtonFooter]}>
                 <TouchableOpacity style={localStyles.addEmailToggleButton} onPress={onToggleAddEmail}>
                      {/* Use buttonIcon from parent styles */}
                     <FontAwesomeIcon icon={showAddEmailInput ? faTimes : faPlusCircle} size={16} color={styles._primaryColor} style={styles.buttonIcon}/>
                     <Text style={[localStyles.addEmailToggleText, { color: styles._primaryColor }]}>
                         {showAddEmailInput ? 'Cancel Adding Email' : 'Add Notification Email'}
                     </Text>
                 </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Define only STYLES UNIQUE to this component ---
const localStyles = StyleSheet.create({
    emailListContainer: {
        paddingHorizontal: 18,
        paddingBottom: 10, // Space before footer if list is present
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        marginTop: 0, // Remove top margin, rely on infoText bottom margin
        paddingTop: 10,
    },
    emailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee', // Lighter separator
    },
    emailText: {
        flex: 1,
        fontSize: 15,
        // color set inline
        marginRight: 10,
    },
    deleteEmailButton: {
        padding: 5, // Tap area
    },
    noEmailsText: {
        fontStyle: 'italic',
        // color set inline
        textAlign: 'center',
        paddingVertical: 15,
    },
    addEmailContainer: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingTop: 15, // More space above input
        paddingBottom: 15, // Space below input
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth, // Separator when shown
        borderTopColor: '#eee',
    },
    addEmailInput: {
        flex: 1,
        height: 44,
        // borderColor and backgroundColor applied inline using parent styles
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        fontSize: 15,
        // color applied inline
    },
    addEmailConfirmButton: {
        // backgroundColor applied inline using parent styles
        padding: 10,
        height: 44,
        width: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleButtonFooter: { // Specific style for the footer containing the toggle button
        marginTop: 0, // Remove margin if only toggle button is there
        paddingTop: 5, // Adjust padding if needed
        paddingBottom: 5,
    },
    addEmailToggleButton: {
         flexDirection: 'row',
         alignItems: 'center',
         paddingVertical: 8, // Reduced padding for footer button
         justifyContent: 'center', // Center toggle button within footer
     },
     addEmailToggleText: {
         fontSize: 15,
         // color applied inline using parent styles
         fontWeight: '500',
     },
});

export default UsageReportingSection;