// src/components/ProfileModal.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView,
    TextInput, Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
    Platform, ScrollView, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faSignOutAlt, faPen, faCheck, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// --- App Imports ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { getLanguageSpecificTextStyle } from '../styles/typography';
import AvatarPicker from './AvatarPicker';

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
const modalWidth = Math.min(screenWidth * 0.9, 400);
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545';
const successColor = '#198754';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onLogout?: () => void; // Parent handles actual logout logic (e.g., calling auth.signOut)
    onSave?: ( // Parent handles API calls and AuthContext updates
        name: string,
        newLocalAvatarUriToSave?: string | null // string: new local URI, null: remove, undefined: no change requested by user
    ) => Promise<void> | void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    visible,
    onClose,
    onLogout,
    onSave,
}) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const { user: authUser } = useAuth(); // Only need authUser for display and initial values

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const defaultUserName = t('profile.defaultUserName', 'User');

    const [currentName, setCurrentName] = useState(authUser?.name || defaultUserName);
    const [avatarChangeAction, setAvatarChangeAction] = useState<'keep' | { newUri: string } | 'remove'>('keep');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (visible) {
            setCurrentName(authUser?.name || defaultUserName);
            setAvatarChangeAction('keep');
            setIsEditingName(false);
            setIsSaving(false);
            setSaveError(null);
        }
    }, [visible, authUser, defaultUserName]);

    const handleSave = async () => {
        const trimmedName = currentName.trim();
        if (trimmedName === '') {
            if (isMountedRef.current) setSaveError(t('profile.errors.nameEmpty', 'Name cannot be empty.'));
            return;
        }
        if (!authUser) { // Should not happen if modal is shown for an authenticated user
            if (isMountedRef.current) setSaveError(t('profile.errors.userNotAuthenticated', 'User not authenticated.'));
            return;
        }

        if (isMountedRef.current) {
            setSaveError(null);
            setIsSaving(true);
        }
        Keyboard.dismiss();

        let avatarUriToPassToParent: string | null | undefined = undefined;
        if (avatarChangeAction === 'remove') {
            avatarUriToPassToParent = null;
        } else if (avatarChangeAction !== 'keep' && avatarChangeAction.newUri) {
            avatarUriToPassToParent = avatarChangeAction.newUri;
        }

        try {
            if (onSave) {
                // Parent component is responsible for API calls (name, avatar backend notification if any)
                // and updating AuthContext (name and localAvatarPath via updateUserAvatarInContextAndStorage)
                await onSave(trimmedName, avatarUriToPassToParent);
            }
            if (isMountedRef.current) {
                setIsEditingName(false); // Exit name editing mode on successful save call
                // Parent should call onClose after its async onSave logic completes.
                // If onSave is synchronous or doesn't handle closing, onClose can be called here.
            }
        } catch (error) { // Catch errors re-thrown by the parent's onSave
            console.error("ProfileModal: Error during onSave callback:", error);
            if (isMountedRef.current) {
                setSaveError( (error as Error)?.message || t('profile.errors.saveFail', 'Failed to save profile. Please try again.'));
            }
        } finally {
            if (isMountedRef.current) {
                setIsSaving(false);
            }
        }
    };

    const dismissKeyboardAndResetName = () => {
        Keyboard.dismiss();
        if (isEditingName) {
            setIsEditingName(false);
            setCurrentName(authUser?.name || defaultUserName); // Reset to original name from context
            setSaveError(null);
        }
    };

    const handleAvatarPickerChange = (newLocalUri: string | undefined) => {
        if (isMountedRef.current) {
            if (newLocalUri) {
                setAvatarChangeAction({ newUri: newLocalUri });
            } else {
                if (avatarChangeAction !== 'remove') { // Don't revert if already marked for removal
                     setAvatarChangeAction('keep');
                }
            }
            setSaveError(null); // Clear any previous save errors when avatar changes
        }
    };

    const handleExplicitRemoveAvatar = () => {
        if (isMountedRef.current) {
            setAvatarChangeAction('remove');
            setSaveError(null);
        }
    };

    const nameChanged = currentName.trim() !== (authUser?.name || defaultUserName).trim();
    const avatarChangedByUserInModal = avatarChangeAction !== 'keep';
    const canSaveChanges = (nameChanged || avatarChangedByUserInModal) && currentName.trim() !== '';

    const avatarUriForPickerDisplay = useMemo(() => {
        if (avatarChangeAction === 'remove') return undefined;
        if (avatarChangeAction !== 'keep' && avatarChangeAction.newUri) return avatarChangeAction.newUri;
        return authUser?.localAvatarPath || undefined;
    }, [avatarChangeAction, authUser?.localAvatarPath]);

    return (
        <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={dismissKeyboardAndResetName} accessible={false}>
                <SafeAreaView style={styles.modalBackground}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <View style={styles.headerButtonPlaceholder} />
                                <Text style={styles.title}>{t('profile.title')}</Text>
                                <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={hitSlop} accessibilityLabel={t('profile.closeAccessibilityLabel')}>
                                    <FontAwesomeIcon icon={faTimes} size={(fonts.h2 || 20) * 0.9} color={theme.white} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                                <View style={styles.avatarSection}>
                                    <AvatarPicker
                                        initialUri={avatarUriForPickerDisplay}
                                        onAvatarChange={handleAvatarPickerChange}
                                        size={90}
                                        disabled={isSaving}
                                    />
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>{t('profile.nameLabel')}</Text>
                                    <View style={styles.nameInputContainer}>
                                        <TextInput
                                            style={[styles.textInput, isEditingName && styles.textInputEditing]}
                                            value={currentName}
                                            onChangeText={(text) => { setCurrentName(text); if (saveError) setSaveError(null); }}
                                            placeholder={t('profile.namePlaceholder')}
                                            placeholderTextColor={theme.disabled}
                                            maxLength={40}
                                            returnKeyType="done"
                                            onSubmitEditing={isEditingName ? handleSave : undefined} // Only submit from here if in edit mode
                                            onFocus={() => setIsEditingName(true)}
                                            selectionColor={theme.primary}
                                            editable={!isSaving}
                                            keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                                        />
                                        {isEditingName ? (
                                             <TouchableOpacity style={styles.inlineEditButton} onPress={handleSave} disabled={!canSaveChanges || isSaving} accessibilityLabel={t('profile.saveNameAccessibilityLabel')}>
                                                {isSaving && (!avatarChangedByUserInModal && nameChanged) ? // Show loader only if saving due to name change
                                                    <ActivityIndicator size="small" color={theme.primary} /> :
                                                    <FontAwesomeIcon icon={faCheck} size={(fonts.body || 16) * 1.1} color={canSaveChanges ? successColor : theme.disabled} />
                                                }
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditingName(true)} disabled={isSaving} accessibilityLabel={t('profile.editNameAccessibilityLabel')}>
                                                <FontAwesomeIcon icon={faPen} size={(fonts.body || 16) * 0.9} color={theme.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>{t('profile.emailLabel')}</Text>
                                    <Text style={styles.emailText}>{authUser?.email || t('profile.defaultEmail', 'user@example.com')}</Text>
                                </View>

                                {saveError && <Text style={styles.errorText}>{saveError}</Text>}
                                
                                {/* Show main "Save Changes" button only if there are changes and name is not being inline-edited */}
                                {canSaveChanges && !isEditingName && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.saveButton, isSaving && styles.buttonDisabled]}
                                        onPress={handleSave}
                                        disabled={isSaving}
                                        activeOpacity={0.8}
                                    >
                                        {isSaving ? <ActivityIndicator color={theme.white} /> : <Text style={[styles.buttonText, styles.saveButtonText]}>{t('profile.saveChanges')}</Text>}
                                    </TouchableOpacity>
                                )}
                                
                                {avatarUriForPickerDisplay && avatarChangeAction !== 'remove' && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.removeAvatarButtonInternal, isSaving && styles.buttonDisabled]}
                                        onPress={handleExplicitRemoveAvatar}
                                        disabled={isSaving}
                                    >
                                        <FontAwesomeIcon icon={faTrash} size={(fonts.body || 16) * 0.9} color={theme.textSecondary} style={styles.buttonIcon} />
                                        <Text style={[styles.buttonText, styles.removeAvatarTextInternal]}>{t('profile.removeAvatar')}</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.logoutButton, isSaving && styles.buttonDisabled]}
                                    onPress={() => { if (onLogout) onLogout();}}
                                    activeOpacity={0.8}
                                    disabled={isSaving}
                                    accessibilityLabel={t('profile.logout')}
                                >
                                    <FontAwesomeIcon icon={faSignOutAlt} size={fonts.button || 16} color={errorColor} style={styles.buttonIcon} />
                                    <Text style={[styles.buttonText, styles.logoutText]}>{t('profile.logout')}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const createThemedStyles = (
    theme: ThemeColors,
    fonts: FontSizes,
    currentLanguage: string
) => {
    const titleStyles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
    const buttonStyles = getLanguageSpecificTextStyle('button', fonts, currentLanguage);
    const bodyFontSize = fonts.body || 16; // For icon sizing fallback

    return StyleSheet.create({
        modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' },
        modalContainer: { width: modalWidth, backgroundColor: theme.background, borderRadius: 16, overflow: 'hidden', maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 15, borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0, borderColor: theme.border },
        header: { paddingVertical: 15, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.primary, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.isDark ? theme.border : 'transparent' },
        title: { ...titleStyles, fontWeight: '600', color: theme.white },
        headerButton: { padding: 6, minWidth: 35, minHeight: 35, justifyContent: 'center', alignItems: 'center' },
        headerButtonPlaceholder: { minWidth: 35 },
        contentContainer: { paddingVertical: 25, paddingHorizontal: 20 },
        avatarSection: { alignItems: 'center', marginBottom: 25 },
        fieldContainer: { marginBottom: 20 },
        fieldLabel: { ...captionStyles, fontWeight: '500', color: theme.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
        nameInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border },
        textInput: { flex: 1, ...bodyStyles, fontWeight: '500', color: theme.text, paddingVertical: Platform.OS === 'ios' ? 12 : 10, height: 46 },
        textInputEditing: { borderColor: theme.primary },
        inlineEditButton: { paddingLeft: 10, paddingVertical: 5, minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
        emailText: { ...bodyStyles, color: theme.textSecondary, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: theme.isDark ? theme.card : theme.background, borderRadius: 8, borderWidth: 1, borderColor: theme.border, opacity: 0.8, minHeight: 46, textAlignVertical: 'center'},
        errorText: { ...captionStyles, color: errorColor, fontWeight: '500', textAlign: 'center', marginTop: 5, marginBottom: 10 },
        saveButton: { backgroundColor: successColor, marginTop: 10, marginBottom: 15},
        saveButtonText: { color: theme.white },
        buttonDisabled: { opacity: 0.5 },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginVertical: 25 },
        actionButton: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5, minHeight: 48 },
        logoutButton: { backgroundColor: theme.card, borderWidth: 1.5, borderColor: errorColor },
        buttonText: { ...buttonStyles, fontWeight: 'bold', textAlign: 'center' },
        logoutText: { color: errorColor },
        buttonIcon: { marginRight: 10 },
        removeAvatarButtonInternal: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginTop: 10},
        removeAvatarTextInternal: { color: theme.textSecondary, fontWeight: '500'},
    });
};

export default React.memo(ProfileModal);