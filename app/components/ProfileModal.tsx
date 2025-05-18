import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView,
  TextInput, Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  Platform, ScrollView, Alert, Animated
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTimes, faSignOutAlt, faPen, faCheck, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// --- App Imports ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';
import AvatarPicker from './AvatarPicker';

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
const modalWidth = Math.min(screenWidth * 0.9, 400);
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545';
const successColor = '#198754';
const fadeAnim = new Animated.Value(0); // For animation

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onSave?: (
    name: string,
    newLocalAvatarUriToSave?: string | null
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
  const { user: authUser } = useAuth();

  const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
  const defaultUserName = t('profile.defaultUserName', 'User');

  const [currentName, setCurrentName] = useState(authUser?.name || defaultUserName);
  const [avatarChangeAction, setAvatarChangeAction] = useState<'keep' | { newUri: string } | 'remove'>('keep');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false); // New state for success feedback
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => { isMountedRef.current = false; };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setCurrentName(authUser?.name || defaultUserName);
      setAvatarChangeAction('keep');
      setIsEditingName(false);
      setIsSaving(false);
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [visible, authUser, defaultUserName]);

  const handleSave = async () => {
    const trimmedName = currentName.trim();
    if (trimmedName === '') {
      if (isMountedRef.current) setSaveError(t('profile.errors.nameEmpty', 'Name cannot be empty.'));
      return;
    }
    if (!authUser) {
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
        await onSave(trimmedName, avatarUriToPassToParent);
      }
      if (isMountedRef.current) {
        setIsEditingName(false);
        setSaveSuccess(true); // Show success feedback
        setTimeout(() => setSaveSuccess(false), 2000); // Hide after 2 seconds
        // Parent should call onClose if needed; otherwise, it can be called here after a delay
      }
    } catch (error) {
      console.error("ProfileModal: Error during onSave callback:", error);
      if (isMountedRef.current) {
        setSaveError((error as Error)?.message || t('profile.errors.saveFail', 'Failed to save profile. Please try again.'));
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
      setCurrentName(authUser?.name || defaultUserName);
      setSaveError(null);
    }
  };

  const handleAvatarPickerChange = (newLocalUri: string | undefined) => {
    if (isMountedRef.current) {
      if (newLocalUri) {
        setAvatarChangeAction({ newUri: newLocalUri });
      } else {
        if (avatarChangeAction !== 'remove') {
          setAvatarChangeAction('keep');
        }
      }
      setSaveError(null);
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
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback accessible={false}>
              <View>
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
                      size={100} // Increased size for better visibility
                      disabled={isSaving}
                      style={styles.avatarPicker}
                    />
                    {avatarUriForPickerDisplay && avatarChangeAction !== 'remove' && (
                      <TouchableOpacity
                        style={styles.removeAvatarButton}
                        onPress={handleExplicitRemoveAvatar}
                        disabled={isSaving}
                      >
                        <FontAwesomeIcon icon={faTrash} size={(fonts.body || 16) * 0.9} color={theme.textSecondary} />
                        <Text style={styles.removeAvatarText}>{t('profile.removeAvatar')}</Text>
                      </TouchableOpacity>
                    )}
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
                        onSubmitEditing={isEditingName ? handleSave : undefined}
                        onFocus={() => setIsEditingName(true)}
                        selectionColor={theme.primary}
                        editable={!isSaving}
                        keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                      />
                      {isEditingName ? (
                        <TouchableOpacity
                          style={styles.inlineEditButton}
                          onPress={handleSave}
                          disabled={!canSaveChanges || isSaving}
                          accessibilityLabel={t('profile.saveNameAccessibilityLabel')}
                        >
                          {isSaving && (!avatarChangedByUserInModal && nameChanged) ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : (
                            <FontAwesomeIcon icon={faCheck} size={(fonts.body || 16) * 1.1} color={canSaveChanges ? successColor : theme.disabled} />
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.inlineEditButton}
                          onPress={() => setIsEditingName(true)}
                          disabled={isSaving}
                          accessibilityLabel={t('profile.editNameAccessibilityLabel')}
                        >
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
                  {saveSuccess && <Text style={styles.successText}>{t('profile.saveSuccess', 'Profile saved successfully!')}</Text>}

                  {canSaveChanges && !isEditingName && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton, isSaving && styles.buttonDisabled]}
                      onPress={handleSave}
                      disabled={isSaving}
                      activeOpacity={0.7}
                    >
                      {isSaving ? <ActivityIndicator color={theme.white} /> : <Text style={styles.buttonText}>{t('profile.saveChanges')}</Text>}
                    </TouchableOpacity>
                  )}

                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton, isSaving && styles.buttonDisabled]}
                    onPress={() => { if (onLogout) onLogout(); }}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} size={fonts.button || 16} color={errorColor} />
                    <Text style={styles.buttonText}>{t('profile.logout')}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
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
  const bodyFontSize = fonts.body || 16;

  return StyleSheet.create({
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
      padding: 20, // Added padding for better spacing
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
      borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: theme.border,
    },
    header: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.isDark ? theme.border : 'transparent',
    },
    title: {
      ...titleStyles,
      fontWeight: '600',
      color: theme.white,
      textAlign: 'center',
      flex: 1, // Center the title
    },
    headerButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    headerButtonPlaceholder: {
      width: 40, // Match headerButton size for symmetry
    },
    contentContainer: {
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 30,
      padding: 10,
      backgroundColor: theme.card,
      borderRadius: 12,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    avatarPicker: {
      marginBottom: 10,
    },
    removeAvatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: theme.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    removeAvatarText: {
      ...captionStyles,
      color: theme.textSecondary,
      marginLeft: 8,
      fontWeight: '500',
    },
    fieldContainer: {
      marginBottom: 25,
    },
    fieldLabel: {
      ...captionStyles,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    nameInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    textInput: {
      flex: 1,
      ...bodyStyles,
      fontWeight: '500',
      color: theme.text,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
      height: 50,
    },
    textInputEditing: {
      borderColor: theme.primary,
      shadowOpacity: 0.2,
    },
    inlineEditButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emailText: {
      ...bodyStyles,
      color: theme.textSecondary,
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: theme.isDark ? theme.card : theme.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      opacity: 0.9,
      minHeight: 50,
      textAlignVertical: 'center',
    },
    errorText: {
      ...captionStyles,
      color: errorColor,
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: 10,
      paddingHorizontal: 10,
    },
    successText: {
      ...captionStyles,
      color: successColor,
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: 10,
      paddingHorizontal: 10,
    },
    saveButton: {
      backgroundColor: successColor,
      marginVertical: 20,
      paddingVertical: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
      backgroundColor: theme.isDark ? 'rgba(25, 135, 84, 0.6)' : 'rgba(25, 135, 84, 0.6)',
    },
    divider: {
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.border,
      marginVertical: 30,
    },
    actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      marginBottom: 15,
    },
    logoutButton: {
      backgroundColor: theme.card,
      borderWidth: 2,
      borderColor: errorColor,
    },
    buttonText: {
      ...buttonStyles,
      fontWeight: '600',
      color: theme.white,
      textAlign: 'center',
      marginLeft: 10,
    },
    buttonIcon: {
      marginRight: 12,
    },
  });
};

export default React.memo(ProfileModal);