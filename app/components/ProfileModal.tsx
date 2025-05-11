import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Image, TextInput,
    Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform, ScrollView,
    Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faSignOutAlt, faPen, faCheck, faCamera, faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography'; 

const AVATAR_LIBRARY = [
    { id: 'avatar1', uri: 'https://ui-avatars.com/api/?name=T+D&background=0077b6&color=fff&size=128&bold=true' },
];
const FALLBACK_AVATAR_ICON = faUserCircle;
const screenWidth = Dimensions.get('window').width;
const modalWidth = Math.min(screenWidth * 0.9, 400);
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545';
const successColor = '#198754';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userProfile?: {
        name: string;
        email: string;
        avatar?: string;
    };
    onLogout?: () => void;
    onSave?: (name: string, avatarUri?: string | null) => Promise<void> | void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    visible,
    onClose,
    userProfile,
    onLogout,
    onSave,
}) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation(); 
    const currentLanguage = i18n.language; 

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    const defaultUserName = t('profile.defaultUserName');
    const profile = userProfile || { name: defaultUserName, email: 'user@example.com', avatar: undefined };

    const [currentName, setCurrentName] = useState(profile.name);
    const [currentAvatarUri, setCurrentAvatarUri] = useState<string | undefined>(profile.avatar);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAvatarOptions, setShowAvatarOptions] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
      if (visible) {
        setCurrentName(profile.name);
        setCurrentAvatarUri(profile.avatar);
        setIsEditingName(false);
        setIsSaving(false);
        setShowAvatarOptions(false);
        setSaveError(null);
      } else {
        setShowAvatarOptions(false);
      }
    }, [visible, profile]);

    const handleSave = async () => {
        const trimmedName = currentName.trim();
        if (trimmedName === '') {
            setSaveError(t('profile.errors.nameEmpty'));
            return;
        }
        setSaveError(null);
        setIsSaving(true);
        Keyboard.dismiss();
        try {
            if (onSave) { await onSave(trimmedName, currentAvatarUri); }
            setIsEditingName(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            setSaveError(t('profile.errors.saveFail'));
        }
        finally { setIsSaving(false); }
    };

    const dismissKeyboardAndReset = () => {
        Keyboard.dismiss();
        if (isEditingName) {
            setIsEditingName(false);
            setCurrentName(profile.name);
            setSaveError(null);
        }
    };

    const handleInternalLogout = () => { if (onLogout) { onLogout(); } };
    const handleAvatarSelect = (avatarUri: string) => { setCurrentAvatarUri(avatarUri); setShowAvatarOptions(false); setSaveError(null); };

    const hasNameChanged = currentName.trim() !== profile.name.trim();
    const hasAvatarChanged = currentAvatarUri !== profile.avatar;
    const canSaveChanges = (hasNameChanged || hasAvatarChanged) && currentName.trim() !== '';

    return (
        <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose} >
            <TouchableWithoutFeedback onPress={dismissKeyboardAndReset} accessible={false}>
                <SafeAreaView style={styles.modalBackground}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <View style={styles.headerButtonPlaceholder} />
                                <Text style={styles.title}>{t('profile.title')}</Text>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={onClose}
                                    hitSlop={hitSlop}
                                    accessibilityLabel={t('profile.closeAccessibilityLabel')}>
                                    <FontAwesomeIcon icon={faTimes} size={fonts.h2 * 0.9} color={theme.white} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                                <View style={styles.avatarSection}>
                                    <TouchableOpacity style={styles.avatarTouchable} onPress={() => setShowAvatarOptions(true)} activeOpacity={0.8} accessibilityLabel={t('profile.changeAvatarAccessibilityLabel')}>
                                        {currentAvatarUri ? (
                                            <Image source={{ uri: currentAvatarUri }} style={styles.avatarImage} />
                                        ) : (
                                            <View style={styles.avatarPlaceholderIcon}>
                                                <FontAwesomeIcon icon={FALLBACK_AVATAR_ICON} size={50} color={theme.textSecondary} />
                                            </View>
                                        )}
                                        <View style={styles.avatarEditBadge}>
                                            <FontAwesomeIcon icon={faPen} size={fonts.caption * 0.9} color={theme.primary} />
                                        </View>
                                    </TouchableOpacity>
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
                                            onSubmitEditing={handleSave}
                                            onFocus={() => setIsEditingName(true)}
                                            selectionColor={theme.primary}
                                            editable={!isSaving}
                                            keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                                        />
                                        {isEditingName ? (
                                             <TouchableOpacity style={styles.inlineEditButton} onPress={handleSave} disabled={!canSaveChanges || isSaving} accessibilityLabel={t('profile.saveNameAccessibilityLabel')}>
                                                {isSaving ? <ActivityIndicator size="small" color={theme.primary} /> : <FontAwesomeIcon icon={faCheck} size={fonts.body * 1.1} color={canSaveChanges ? successColor : theme.disabled} />}
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditingName(true)} accessibilityLabel={t('profile.editNameAccessibilityLabel')}>
                                                <FontAwesomeIcon icon={faPen} size={fonts.body * 0.9} color={theme.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>{t('profile.emailLabel')}</Text>
                                    <Text style={styles.emailText}>{profile.email}</Text>
                                </View>

                                {saveError && <Text style={styles.errorText}>{saveError}</Text>}

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.logoutButton]}
                                    onPress={handleInternalLogout}
                                    activeOpacity={0.8}
                                    disabled={isSaving}
                                    accessibilityLabel={t('profile.logout')}
                                >
                                    <FontAwesomeIcon icon={faSignOutAlt} size={fonts.button} color={errorColor} style={styles.buttonIcon} />
                                    <Text style={[styles.buttonText, styles.logoutText]}>{t('profile.logout')}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>

                    {showAvatarOptions && (
                         <TouchableWithoutFeedback onPress={() => setShowAvatarOptions(false)} accessible={false}>
                            <View style={styles.avatarOptionsOverlay}>
                                <TouchableWithoutFeedback accessible={false}>
                                    <View style={styles.avatarOptionsContainer}>
                                        <Text style={styles.avatarOptionsTitle}>{t('profile.selectAvatarTitle')}</Text>
                                        <View style={styles.avatarGrid}>
                                            {AVATAR_LIBRARY.map((avatar) => (
                                                <TouchableOpacity
                                                    key={avatar.id}
                                                    style={[styles.avatarOption, currentAvatarUri === avatar.uri && styles.avatarOptionSelected]}
                                                    onPress={() => handleAvatarSelect(avatar.uri)}
                                                    activeOpacity={0.7}
                                                    accessibilityLabel={t('profile.selectAvatarAccessibilityLabel', { id: avatar.id })}
                                                    accessibilityState={{selected: currentAvatarUri === avatar.uri}}
                                                >
                                                    <Image source={{ uri: avatar.uri }} style={styles.avatarOptionImage} />
                                                </TouchableOpacity>
                                            ))}
                                            <TouchableOpacity
                                                style={styles.avatarUploadOption}
                                                activeOpacity={0.7}
                                                onPress={() => Alert.alert(t('profile.uploadAvatarTitle'), t('profile.uploadAvatarMessage'))}
                                                accessibilityLabel={t('profile.uploadAvatarAccessibilityLabel')}
                                            >
                                                <FontAwesomeIcon icon={faCamera} size={fonts.h1 * 0.9} color={theme.disabled} />
                                                <Text style={styles.uploadText}>{t('profile.uploadAvatarPlaceholder')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <TouchableOpacity style={styles.closeAvatarOptionsButton} onPress={() => setShowAvatarOptions(false)} accessibilityLabel={t('common.cancel')}>
                                            <Text style={styles.closeAvatarOptionsText}>{t('common.cancel')}</Text>
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

const createThemedStyles = (
    theme: ThemeColors,
    fonts: FontSizes,
    currentLanguage: string 
) => {
    const titleStyles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const captionStyles = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);
    const buttonStyles = getLanguageSpecificTextStyle('button', fonts, currentLanguage);

    return StyleSheet.create({
        modalBackground: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)',
        },
        modalContainer: {
            width: modalWidth,
            backgroundColor: theme.background,
            borderRadius: 16,
            overflow: 'hidden',
            maxHeight: '90%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 18,
            elevation: 15,
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.border,
        },
        header: {
            paddingVertical: 15,
            paddingHorizontal: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.primary,
        },
        title: {
            ...titleStyles, 
            fontWeight: '600',
            color: theme.white,
        },
        headerButton: { padding: 6, minWidth: 35, alignItems: 'center' },
        headerButtonPlaceholder: { minWidth: 35 },
        contentContainer: { paddingVertical: 30, paddingHorizontal: 25, },
        avatarSection: { alignItems: 'center', marginBottom: 25, },
        avatarTouchable: { position: 'relative', width: 90, height: 90, },
        avatarImage: { width: '100%', height: '100%', borderRadius: 45, borderWidth: 3, borderColor: theme.white, backgroundColor: theme.disabled, },
        avatarPlaceholderIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.white, },
        avatarEditBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: theme.card, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, borderWidth: 1, borderColor: theme.border, },
        fieldContainer: { marginBottom: 20, },
        fieldLabel: {
            ...captionStyles, 
            fontWeight: '500',
            color: theme.textSecondary,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        nameInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border, },
        textInput: {
            flex: 1,
            ...bodyStyles, 
            fontWeight: '500',
            color: theme.text,
            paddingVertical: Platform.OS === 'ios' ? 12 : 10,
            height: 46, 
        },
        textInputEditing: { /* Optional focus style */ },
        inlineEditButton: { paddingLeft: 10, paddingVertical: 5, },
        emailText: {
            ...bodyStyles, 
            color: theme.textSecondary,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        errorText: {
            ...captionStyles, 
            color: errorColor,
            fontWeight: '500',
            textAlign: 'center',
            marginTop: -10,
            marginBottom: 15,
        },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginVertical: 25, },
        actionButton: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5, },
        logoutButton: { backgroundColor: theme.card, borderWidth: 1.5, borderColor: errorColor, },
        buttonText: { 
            ...buttonStyles, 
            fontWeight: 'bold',
            textAlign: 'center',
        },
        logoutText: {
            color: errorColor,
        },
        buttonIcon: { marginRight: 10, },
        avatarOptionsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20, },
        avatarOptionsContainer: { width: '100%', maxWidth: modalWidth, backgroundColor: theme.card, borderRadius: 16, paddingVertical: 25, paddingHorizontal: 20, maxHeight: '80%', borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border, },
        avatarOptionsTitle: {
            ...titleStyles, 
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 25,
            textAlign: 'center',
        },
        avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, marginBottom: 25, },
        avatarOption: { width: (modalWidth * 0.9 - 40 - 30) / 3, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent', backgroundColor: theme.disabled, },
        avatarOptionSelected: { borderColor: theme.primary, },
        avatarOptionImage: { width: '100%', height: '100%', },
        avatarUploadOption: { width: (modalWidth * 0.9 - 40 - 30) / 3, aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.border, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, },
        uploadText: {
            ...captionStyles, 
            color: theme.textSecondary,
            marginTop: 5,
            fontWeight: '500',
        },
        closeAvatarOptionsButton: { marginTop: 15, paddingVertical: 12, borderRadius: 10, backgroundColor: theme.border, alignItems: 'center', },
        closeAvatarOptionsText: {
            ...buttonStyles, 
            color: theme.textSecondary,
            fontWeight: '600',
        },
    });
};

export default ProfileModal;