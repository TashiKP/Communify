// src/components/PasscodePromptModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Modal, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faLock, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as KeychainService from '../services/keychainService'; // Adjust path

// --- Colors --- (Define or import from a central theme)
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const textColor = '#2d3436';
const errorColor = '#dc3545';
const placeholderColor = '#adb5bd';
const mediumGrey = '#b2bec3';
const darkGrey = '#6c757d';

interface PasscodePromptModalProps {
    visible: boolean;
    onClose: () => void; // Called when user cancels or after verification
    onVerified: () => void; // Called when passcode is correct
}

const PasscodePromptModal: React.FC<PasscodePromptModalProps> = ({
    visible,
    onClose,
    onVerified
}) => {
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);

    const handleVerify = async () => {
        if (!enteredPasscode) return;
        setError(null);
        setIsLoading(true);
        Keyboard.dismiss();

        const isCorrect = await KeychainService.verifyPasscode(enteredPasscode);
        setIsLoading(false);

        if (isCorrect) {
            setEnteredPasscode(''); // Clear on success
            onVerified(); // Notify parent
        } else {
            setError("Incorrect passcode. Please try again.");
            setEnteredPasscode(''); // Clear input on error
            inputRef.current?.focus(); // Re-focus input
        }
    };

    const handleCancel = () => {
        setEnteredPasscode('');
        setError(null);
        setIsLoading(false);
        onClose(); // Notify parent
    };

    // Focus input when modal becomes visible
    useEffect(() => {
        if (visible) {
            // Need a slight delay for modal animation and input rendering
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 200);
            return () => clearTimeout(timer);
        } else {
             // Clear state when hiding
             setEnteredPasscode('');
             setError(null);
             setIsLoading(false);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancel} // Handle back button on Android
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                             <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Enter Passcode</Text>
                                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                                    <FontAwesomeIcon icon={faTimes} size={20} color={darkGrey} />
                                </TouchableOpacity>
                             </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.promptText}>Please enter the parental passcode to continue.</Text>
                                <View style={styles.inputWrapper}>
                                    <FontAwesomeIcon icon={faLock} size={16} color={placeholderColor} style={styles.inputIcon}/>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={enteredPasscode}
                                        onChangeText={setEnteredPasscode}
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        maxLength={10} // Match SetPasscodeScreen max length
                                        placeholder="Enter passcode"
                                        placeholderTextColor={placeholderColor}
                                        returnKeyType="done"
                                        onSubmitEditing={handleVerify}
                                        autoFocus={false} // Let useEffect handle focus
                                    />
                                </View>

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <TouchableOpacity
                                    style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
                                    onPress={handleVerify}
                                    disabled={isLoading || !enteredPasscode}
                                >
                                    {isLoading
                                        ? <ActivityIndicator color={whiteColor} size="small"/>
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
const lightGrey = '#dfe6e9';

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', maxWidth: 350, backgroundColor: whiteColor, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: lightGrey, position: 'relative' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: textColor },
    closeButton: { position: 'absolute', right: 10, top: 10, padding: 8 },
    modalBody: { padding: 25 },
    promptText: { fontSize: 15, color: darkGrey, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, height: 50, paddingHorizontal: 12, marginBottom: 15, },
    inputIcon: { marginRight: 10, },
    input: { flex: 1, height: '100%', fontSize: 16, color: textColor, },
    errorText: { color: errorColor, textAlign: 'center', marginBottom: 15, fontSize: 14, fontWeight: '500' },
    verifyButton: { backgroundColor: primaryColor, paddingVertical: 14, borderRadius: 8, alignItems: 'center', minHeight: 48, justifyContent: 'center'},
    verifyButtonText: { color: whiteColor, fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { opacity: 0.6 },
});


export default PasscodePromptModal;