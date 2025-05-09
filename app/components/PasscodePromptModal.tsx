// src/components/PasscodePromptModal.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Modal, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as KeychainService from '../services/keychainService'; // Adjust path
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Local Constants ---
const errorColor = '#dc3545'; // Keep error color distinct or add to theme

// --- Component Props ---
interface PasscodePromptModalProps {
    visible: boolean;
    onClose: () => void; // Called when user cancels or after verification
    onVerified: () => void; // Called when passcode is correct
}

// --- Component ---
const PasscodePromptModal: React.FC<PasscodePromptModalProps> = ({
    visible,
    onClose,
    onVerified
}) => {
    // --- Hooks ---
    const { theme, fonts } = useAppearance();
    const { t } = useTranslation(); // <-- Use the translation hook

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- State ---
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);
    const isMountedRef = useRef(true);


    // --- Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // --- Handlers ---
    const handleVerify = async () => {
        if (!enteredPasscode || isLoading) return;
        if(isMountedRef.current) setError(null);
        if(isMountedRef.current) setIsLoading(true);
        Keyboard.dismiss();

        try {
            const isCorrect = await KeychainService.verifyPasscode(enteredPasscode);

            if (isMountedRef.current) {
                if (isCorrect) {
                    setEnteredPasscode('');
                    onVerified();
                } else {
                    setError(t('passcodePrompt.errors.incorrect')); // Use t()
                    setEnteredPasscode('');
                    inputRef.current?.focus();
                }
            }
        } catch (verificationError) {
            console.error("Passcode verification error:", verificationError);
            if (isMountedRef.current) {
                setError(t('passcodePrompt.errors.verificationFailed')); // Use t()
                setEnteredPasscode('');
            }
        } finally {
             if (isMountedRef.current) {
                setIsLoading(false);
             }
        }
    };

    const handleCancel = () => {
        setEnteredPasscode('');
        setError(null);
        setIsLoading(false);
        onClose();
    };

    // --- Effect for Focus and State Reset ---
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                if(isMountedRef.current) inputRef.current?.focus();
            }, 200);
            return () => clearTimeout(timer);
        } else {
             const clearTimer = setTimeout(() => {
                if(isMountedRef.current){
                    setEnteredPasscode('');
                    setError(null);
                    setIsLoading(false);
                }
             }, 300);
             return () => clearTimeout(clearTimer);
        }
    }, [visible]);

    // --- Render ---
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                             <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{t('passcodePrompt.title')}</Text>
                                <TouchableOpacity onPress={handleCancel} style={styles.closeButton} accessibilityLabel={t('passcodePrompt.closeAccessibilityLabel')}>
                                    <FontAwesomeIcon icon={faTimes} size={fonts.h2 * 0.9} color={theme.textSecondary} />
                                </TouchableOpacity>
                             </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.promptText}>{t('passcodePrompt.prompt')}</Text>
                                <View style={styles.inputWrapper}>
                                    <FontAwesomeIcon icon={faLock} size={fonts.body} color={theme.disabled} style={styles.inputIcon}/>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={enteredPasscode}
                                        onChangeText={setEnteredPasscode}
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        maxLength={10} // Keep a reasonable max length
                                        placeholder={t('passcodePrompt.placeholder')}
                                        placeholderTextColor={theme.disabled}
                                        returnKeyType="done"
                                        onSubmitEditing={handleVerify}
                                        autoFocus={false}
                                        selectionColor={theme.primary}
                                        keyboardAppearance={theme.isDark ? 'dark' : 'light'}
                                    />
                                </View>

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.verifyButton, (isLoading || !enteredPasscode) && styles.buttonDisabled]}
                                    onPress={handleVerify}
                                    disabled={isLoading || !enteredPasscode}
                                    accessibilityLabel={t('passcodePrompt.verifyAccessibilityLabel')}
                                    accessibilityState={{ disabled: isLoading || !enteredPasscode }}
                                >
                                    {isLoading
                                        ? <ActivityIndicator color={theme.white} size="small"/>
                                        : <Text style={styles.verifyButtonText}>{t('passcodePrompt.verifyButton')}</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// --- Styles (Unchanged) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', maxWidth: 350, backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, position: 'relative', backgroundColor: theme.background },
    modalTitle: { fontSize: fonts.h2, fontWeight: 'bold', color: theme.text },
    closeButton: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 10, },
    modalBody: { padding: 25 },
    promptText: { fontSize: fonts.body, color: theme.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: fonts.body * 1.4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 8, height: 50, paddingHorizontal: 12, marginBottom: 15, },
    inputIcon: { marginRight: 10, },
    input: { flex: 1, height: '100%', fontSize: fonts.body, color: theme.text, },
    errorText: { color: errorColor, textAlign: 'center', marginBottom: 15, fontSize: fonts.caption, fontWeight: '500' },
    verifyButton: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
    verifyButtonText: { color: theme.white, fontSize: fonts.button, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: theme.disabled, opacity: 0.7 },
});


export default PasscodePromptModal;