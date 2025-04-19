import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Image, TextInput,
    Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform, ScrollView
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faSignOutAlt, faPen, faCheck, faCamera, faUserCircle
} from '@fortawesome/free-solid-svg-icons';

// --- Dummy Data & Constants ---
const AVATAR_LIBRARY = [
    { id: 'avatar1', uri: 'https://ui-avatars.com/api/?name=T+D&background=0077b6&color=fff&size=128&bold=true' },
    { id: 'avatar2', uri: 'https://ui-avatars.com/api/?name=TD&background=ade8f4&color=0077b6&size=128&bold=true' },
    { id: 'avatar3', uri: 'https://ui-avatars.com/api/?name=T+D&background=03045e&color=fff&size=128&bold=true' },
    { id: 'avatar4', uri: 'https://ui-avatars.com/api/?name=TD&background=90e0ef&color=03045e&size=128&bold=true' },
];
const FALLBACK_AVATAR_ICON = faUserCircle;
const screenWidth = Dimensions.get('window').width;
const modalWidth = Math.min(screenWidth * 0.9, 400);

// --- Colors (Professional Palette) ---
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const backgroundColorLight = '#f8f9fa';
const textColorDark = '#212529';
const textColorGrey = '#6c757d';
const placeholderColor = '#adb5bd';
const borderColor = '#dee2e6';
const errorColor = '#dc3545';
const successColor = '#198754';
const overlayColor = 'rgba(0, 0, 0, 0.6)';
const lightGrey = '#e9ecef';
const blueTint = '#e7f5ff';

// --- Component Props Interface ---
interface ProfileModalProps {
    visible: boolean;
    onClose: () => void; // For 'X' button and background tap
    userProfile?: {
        name: string;
        email: string;
        avatar?: string; // URI string
    };
    /** Callback function executed when the user presses the logout button */
    onLogout?: () => void; // Provided by Navbar
    /** Callback function executed when the user saves changes */
    onSave?: (name: string, avatarUri?: string) => Promise<void> | void;
    // *** No navigation prop needed here ***
}

// --- Component ---
const ProfileModal: React.FC<ProfileModalProps> = ({
    visible,
    onClose, // Used for 'X' and background tap dismissal
    userProfile,
    onLogout, // Called when logout button is pressed
    onSave,
}) => {
    const profile = userProfile || { name: 'User', email: 'user@example.com', avatar: undefined };

    // State
    const [currentName, setCurrentName] = useState(profile.name);
    const [currentAvatarUri, setCurrentAvatarUri] = useState(profile.avatar);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarOptions, setShowAvatarOptions] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Effects
    useEffect(() => {
        if (visible) {
            setCurrentName(profile.name);
            setCurrentAvatarUri(profile.avatar);
            setIsEditingName(false);
            setIsSaving(false);
            setShowAvatarOptions(false);
            setSaveError(null);
        }
    }, [visible, profile]);

    // Handlers
    const handleSave = async () => {
        const trimmedName = currentName.trim();
        if (trimmedName === '') {
            setSaveError('Name cannot be empty.');
            return;
        }
        setSaveError(null);
        setIsSaving(true);
        Keyboard.dismiss();
        try {
            if (onSave) {
                const savedAvatarUri = currentAvatarUri !== profile.avatar ? currentAvatarUri : undefined;
                await onSave(trimmedName, savedAvatarUri);
            }
            setIsEditingName(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            setSaveError("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const dismissKeyboardAndReset = () => {
        Keyboard.dismiss();
        if (isEditingName) {
            setIsEditingName(false);
            setCurrentName(profile.name);
            setSaveError(null);
        }
    };

    /**
     * Internal handler for the logout button press.
     * It only calls the onLogout prop passed from the parent (Navbar).
     */
    const handleInternalLogout = () => {
        // *** FIX APPLIED HERE: Only call the onLogout prop ***
        if (onLogout) {
            onLogout(); // Let Navbar handle the cleanup and navigation
        }
        // Do NOT call onClose() here for the logout button action.
    };

    const handleAvatarSelect = (avatarUri: string) => {
        setCurrentAvatarUri(avatarUri);
        setShowAvatarOptions(false);
        setSaveError(null);
    };

    // Derived State
    const hasNameChanged = currentName.trim() !== profile.name.trim();
    const hasAvatarChanged = currentAvatarUri !== profile.avatar;
    const canSaveChanges = (hasNameChanged || hasAvatarChanged) && currentName.trim() !== '';

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose} // Android back button uses onClose
        >
            <TouchableWithoutFeedback onPress={dismissKeyboardAndReset} accessible={false}>
                <SafeAreaView style={styles.modalBackground}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalContainer}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerButtonPlaceholder} />
                                <Text style={styles.title}>User Profile</Text>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={onClose} // 'X' button uses onClose
                                    hitSlop={styles.hitSlop}>
                                    <FontAwesomeIcon icon={faTimes} size={20} color={whiteColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Scrollable Content */}
                            <ScrollView contentContainerStyle={styles.contentContainer}>
                                {/* Avatar Area */}
                                <View style={styles.avatarSection}>
                                    <TouchableOpacity style={styles.avatarTouchable} onPress={() => setShowAvatarOptions(true)} activeOpacity={0.8}>
                                        {currentAvatarUri ? (
                                            <Image source={{ uri: currentAvatarUri }} style={styles.avatarImage} />
                                        ) : (
                                            <View style={styles.avatarPlaceholderIcon}>
                                                <FontAwesomeIcon icon={FALLBACK_AVATAR_ICON} size={50} color={textColorGrey} />
                                            </View>
                                        )}
                                        <View style={styles.avatarEditBadge}>
                                            <FontAwesomeIcon icon={faPen} size={10} color={primaryColor} />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Name Edit Section */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>Name</Text>
                                    <View style={styles.nameInputContainer}>
                                        <TextInput
                                            style={[styles.textInput, isEditingName && styles.textInputEditing]}
                                            value={currentName}
                                            onChangeText={(text) => { setCurrentName(text); if (saveError) setSaveError(null); }}
                                            placeholder="Enter your name"
                                            placeholderTextColor={placeholderColor}
                                            maxLength={40}
                                            returnKeyType="done"
                                            onSubmitEditing={handleSave}
                                            onFocus={() => setIsEditingName(true)}
                                            selectionColor={primaryColor}
                                            editable={!isSaving}
                                        />
                                        {!isEditingName ? (
                                            <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditingName(true)}>
                                                <FontAwesomeIcon icon={faPen} size={15} color={primaryColor} />
                                            </TouchableOpacity>
                                        ) : (
                                             <TouchableOpacity style={styles.inlineEditButton} onPress={handleSave} disabled={!canSaveChanges || isSaving}>
                                                {isSaving ? <ActivityIndicator size="small" color={primaryColor} /> : <FontAwesomeIcon icon={faCheck} size={18} color={canSaveChanges ? successColor : placeholderColor} />}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Email Display Section */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>Email</Text>
                                    <Text style={styles.emailText}>{profile.email}</Text>
                                </View>

                                {/* Error Display */}
                                {saveError && <Text style={styles.errorText}>{saveError}</Text>}

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Logout Button */}
                                <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleInternalLogout} activeOpacity={0.8} disabled={isSaving}>
                                    <FontAwesomeIcon icon={faSignOutAlt} size={16} color={errorColor} style={styles.buttonIcon} />
                                    <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>

                    {/* --- Avatar Selection Overlay --- */}
                    {showAvatarOptions && (
                         <TouchableWithoutFeedback onPress={() => setShowAvatarOptions(false)} accessible={false}>
                            <View style={styles.avatarOptionsOverlay}>
                                <TouchableWithoutFeedback accessible={false}>
                                    <View style={styles.avatarOptionsContainer}>
                                        <Text style={styles.avatarOptionsTitle}>Select Avatar</Text>
                                        <View style={styles.avatarGrid}>
                                            {AVATAR_LIBRARY.map((avatar) => (
                                                <TouchableOpacity
                                                    key={avatar.id}
                                                    style={[styles.avatarOption, currentAvatarUri === avatar.uri && styles.avatarOptionSelected]}
                                                    onPress={() => handleAvatarSelect(avatar.uri)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Image source={{ uri: avatar.uri }} style={styles.avatarOptionImage} />
                                                </TouchableOpacity>
                                            ))}
                                            <TouchableOpacity style={styles.avatarUploadOption} activeOpacity={0.7} disabled={true}>
                                                <FontAwesomeIcon icon={faCamera} size={28} color={placeholderColor} />
                                                <Text style={styles.uploadText}>(Upload)</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity style={styles.closeAvatarOptionsButton} onPress={() => setShowAvatarOptions(false)}>
                                            <Text style={styles.closeAvatarOptionsText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// --- Styles --- (Copied from previous refined version)
const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: overlayColor,
    },
    modalContainer: {
        width: modalWidth,
        backgroundColor: backgroundColorLight, // Use light background for the main area
        borderRadius: 16,
        overflow: 'hidden',
        maxHeight: '90%', // Allow slightly more height if needed
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
        elevation: 15,
    },
    // Standard Header
    header: {
        backgroundColor: primaryColor,
        paddingVertical: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: whiteColor,
    },
    headerButton: { padding: 6, minWidth: 35, alignItems: 'center' },
    headerButtonPlaceholder: { minWidth: 35 },
    // Content Area
    contentContainer: {
        paddingVertical: 30, // More vertical padding
        paddingHorizontal: 25, // More horizontal padding
    },
    // Avatar Section (Centered)
    avatarSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarTouchable: {
        position: 'relative',
        width: 90, // Larger Avatar
        height: 90,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 45, // Keep circular
        borderWidth: 3,
        borderColor: whiteColor, // White border pops against light background
        backgroundColor: lightGrey, // BG for loading/fallback image view
    },
    avatarPlaceholderIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: lightGrey, // Placeholder background
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: whiteColor,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: whiteColor,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    // Field Styling
    fieldContainer: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: textColorGrey,
        marginBottom: 6,
        textTransform: 'uppercase', // Uppercase label
        letterSpacing: 0.5,
    },
    nameInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: whiteColor, // White input background
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: borderColor, // Default border
    },
    textInput: {
        flex: 1,
        fontSize: 17,
        fontWeight: '500',
        color: textColorDark,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10, // Adjust vertical padding
        height: 46, // Explicit height
    },
    textInputEditing: {
        // Optional: change text color slightly?
    },
    inlineEditButton: {
        paddingLeft: 10, // Space before icon
        paddingVertical: 5,
    },
    emailText: {
        fontSize: 16,
        color: textColorDark, // Make email readable
        paddingVertical: 12, // Align height roughly with input
        paddingHorizontal: 12,
        backgroundColor: lightGrey, // Subtle background for read-only field
        borderRadius: 8,
    },
    errorText: { // Combined error text style
        color: errorColor,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: -10, // Pull up slightly
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: borderColor,
        marginVertical: 25, // Space around divider
    },
    // Buttons
    actionButton: {
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    logoutButton: {
        backgroundColor: whiteColor,
        borderWidth: 1.5, // Make border slightly bolder
        borderColor: errorColor, // Red border for destructive action
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    logoutText: {
        color: errorColor,
    },
    buttonIcon: {
        marginRight: 10,
    },
    // Avatar Selection Overlay Styles
    avatarOptionsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: overlayColor,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    avatarOptionsContainer: {
        width: '100%',
        maxWidth: modalWidth,
        backgroundColor: whiteColor,
        borderRadius: 16,
        paddingVertical: 25,
        paddingHorizontal: 20,
        maxHeight: '80%',
    },
    avatarOptionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: textColorDark,
        marginBottom: 25,
        textAlign: 'center',
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 25,
    },
    avatarOption: {
        width: (modalWidth * 0.9 - 40 - 30) / 3, // Adjust calculation based on actual padding/gap
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'transparent',
        backgroundColor: lightGrey, // BG for loading state
    },
    avatarOptionSelected: {
        borderColor: primaryColor,
    },
    avatarOptionImage: {
        width: '100%',
        height: '100%',
    },
    avatarUploadOption: {
        width: (modalWidth * 0.9 - 40 - 30) / 3, // Adjust calculation
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: borderColor,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: backgroundColorLight,
    },
    uploadText: {
        fontSize: 12,
        color: textColorGrey,
        marginTop: 5,
        fontWeight: '500',
    },
    closeAvatarOptionsButton: {
        marginTop: 15,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: lightGrey,
        alignItems: 'center',
    },
    closeAvatarOptionsText: {
        fontSize: 16,
        color: textColorGrey,
        fontWeight: '600',
    },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }
});

export default ProfileModal;