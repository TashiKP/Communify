// src/components/PasscodePromptModal.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Modal, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as KeychainService from '../services/keychainService'; // Adjust path

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
    // --- Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- State ---
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);

    // --- Handlers ---
    const handleVerify = async () => {
        if (!enteredPasscode || isLoading) return; // Prevent multiple attempts
        setError(null);
        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const isCorrect = await KeychainService.verifyPasscode(enteredPasscode);

            if (isCorrect) {
                setEnteredPasscode(''); // Clear on success
                onVerified(); // Notify parent (parent handles closing)
            } else {
                setError("Incorrect passcode. Please try again.");
                setEnteredPasscode(''); // Clear input on error
                inputRef.current?.focus(); // Re-focus input
            }
        } catch (verificationError) {
            console.error("Passcode verification error:", verificationError);
            setError("An error occurred during verification.");
            setEnteredPasscode('');
        } finally {
             // Ensure loading state is reset even if component unmounted during async op?
             // Let useEffect handle reset on visibility change instead for cleaner logic.
             setIsLoading(false); // Reset loading state
        }
    };

    const handleCancel = () => {
        // Reset state immediately before calling onClose
        setEnteredPasscode('');
        setError(null);
        setIsLoading(false);
        onClose(); // Notify parent
    };

    // --- Effect for Focus and State Reset ---
    useEffect(() => {
        if (visible) {
            // Focus input when modal becomes visible
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 200); // Delay allows modal animation to settle
            return () => clearTimeout(timer);
        } else {
             // Clear state when hiding (after potential animation)
             const clearTimer = setTimeout(() => {
                 setEnteredPasscode('');
                 setError(null);
                 setIsLoading(false);
             }, 300); // Match typical modal fade duration
             return () => clearTimeout(clearTimer);
        }
    }, [visible]);

    // --- Render ---
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade" // Fade looks good for overlays
            onRequestClose={handleCancel} // Handle hardware back button on Android
        >
            {/* Dismiss keyboard on overlay tap */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    {/* Prevent taps inside the modal content from dismissing */}
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                             <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Enter Passcode</Text>
                                <TouchableOpacity onPress={handleCancel} style={styles.closeButton} accessibilityLabel='Close passcode prompt'>
                                    <FontAwesomeIcon icon={faTimes} size={fonts.h2 * 0.9} color={theme.textSecondary} />
                                </TouchableOpacity>
                             </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.promptText}>Please enter the parental passcode to continue.</Text>
                                <View style={styles.inputWrapper}>
                                    {/* Use themed icon */}
                                    <FontAwesomeIcon icon={faLock} size={fonts.body} color={theme.disabled} style={styles.inputIcon}/>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={enteredPasscode}
                                        onChangeText={setEnteredPasscode}
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        maxLength={10}
                                        placeholder="Enter passcode"
                                        placeholderTextColor={theme.disabled} // Themed placeholder
                                        returnKeyType="done"
                                        onSubmitEditing={handleVerify}
                                        autoFocus={false} // Rely on useEffect
                                        selectionColor={theme.primary} // Themed cursor/selection
                                        keyboardAppearance={theme.isDark ? 'dark' : 'light'} // Match keyboard to theme
                                    />
                                </View>

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.verifyButton, (isLoading || !enteredPasscode) && styles.buttonDisabled]} // Disable based on loading or empty input
                                    onPress={handleVerify}
                                    disabled={isLoading || !enteredPasscode}
                                    accessibilityLabel="Verify passcode"
                                    accessibilityState={{ disabled: isLoading || !enteredPasscode }}
                                >
                                    {isLoading
                                        ? <ActivityIndicator color={theme.white} size="small"/>
                                        : <Text style={styles.verifyButtonText}>Verify</Text>
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

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)', // Themed overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: theme.card, // Use theme card color
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border, // Use theme border
        position: 'relative',
        backgroundColor: theme.background // Slightly different bg for header
    },
    modalTitle: {
        fontSize: fonts.h2, // Use font size
        fontWeight: 'bold',
        color: theme.text // Use theme text color
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 0,
        bottom: 0, // Make touchable area full height of header
        justifyContent: 'center', // Center icon vertically
        paddingHorizontal: 10, // Add horizontal padding
    },
    modalBody: {
        padding: 25
    },
    promptText: {
        fontSize: fonts.body, // Use font size
        color: theme.textSecondary, // Use theme secondary text
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: fonts.body * 1.4 // Dynamic line height
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background, // Use theme background
        borderWidth: 1,
        borderColor: theme.border, // Use theme border
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: fonts.body, // Use font size
        color: theme.text, // Use theme text
    },
    errorText: {
        color: errorColor, // Keep distinct error color
        textAlign: 'center',
        marginBottom: 15,
        fontSize: fonts.caption, // Use font size
        fontWeight: '500'
    },
    verifyButton: {
        backgroundColor: theme.primary, // Use theme primary
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        minHeight: 48,
        justifyContent: 'center'
    },
    verifyButtonText: {
        color: theme.white, // Use theme white
        fontSize: fonts.button, // Use font size
        fontWeight: 'bold'
    },
    buttonDisabled: {
        backgroundColor: theme.disabled, // Use theme disabled color
        opacity: 0.7
    },
});


export default PasscodePromptModal;