// src/components/KeyboardInputComponent.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Text,
    ScrollView
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Props ---
interface KeyboardInputProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    placeholder?: string;
    // Add getSuggestions prop type if you implement external suggestions
    // getSuggestions?: (currentBuffer: string) => Promise<string[]> | string[];
}

// --- Component ---
const KeyboardInputComponent: React.FC<KeyboardInputProps> = ({
    visible,
    onClose,
    onSubmit,
    placeholder = "Type message...",
    // getSuggestions,
}) => {
    // --- Appearance Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- State ---
    const [inputText, setInputText] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const textInputRef = useRef<TextInput>(null);

    // --- Effects ---
    useEffect(() => {
        if (visible) {
            // Delay focus slightly to allow modal animation and keyboard appearance
            const timer = setTimeout(() => { textInputRef.current?.focus(); }, 200);
            return () => clearTimeout(timer);
        } else {
             setInputText('');
             setSuggestions([]); // Clear state on close
        }
    }, [visible]);

    // --- Placeholder Suggestion Logic ---
    useEffect(() => {
        if (!inputText.trim()) { // Trim input before checking length
            setSuggestions([]);
            return;
        }
        // Simulate based on last word
        const words = inputText.trimEnd().split(' ');
        const currentWord = words[words.length - 1].toLowerCase();

        if (currentWord.length > 0) { // Start suggesting after 1 character
            // *** Replace with your actual suggestion fetching logic ***
            const dummySuggestions = ['hello', 'world', 'react', 'native', 'keyboard', 'component', 'awesome', 'test', 'suggestion']
                .filter(s => s.startsWith(currentWord))
                .slice(0, 7); // Show up to 7 suggestions
            setSuggestions(dummySuggestions);
        } else {
            setSuggestions([]);
        }

        // --- Example using getSuggestions prop ---
        // if (getSuggestions && inputText.trim()) {
        //     Promise.resolve(getSuggestions(inputText))
        //         .then(results => setSuggestions(results.slice(0, 7))) // Limit results
        //         .catch(err => console.error("Error getting suggestions:", err));
        // } else {
        //     setSuggestions([]);
        // }

    }, [inputText /*, getSuggestions */]);
    //------------------------------------

     const handleSubmit = () => {
        const trimmedText = inputText.trim();
        if (trimmedText) {
            onSubmit(trimmedText);
            setInputText(''); // Clear input after submit
            setSuggestions([]); // Clear suggestions
            // Optionally keep keyboard up or close modal via onClose()
        }
    };

    const handleSuggestionPress = (suggestion: string) => {
        const words = inputText.trimRight().split(' ');
        words[words.length - 1] = suggestion; // Replace the current word being typed
        const newText = words.join(' ') + ' '; // Add a space after suggestion for next word
        setInputText(newText);
        textInputRef.current?.focus();
        setSuggestions([]); // Clear suggestions
    };

    // Close modal and dismiss keyboard when tapping the overlay
    const handleOverlayPress = () => {
         Keyboard.dismiss();
         onClose();
    };

    // Determine send button active state
    const isSendActive = inputText.trim().length > 0;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide" // Keyboard slides up, makes sense for this component
            onRequestClose={onClose}
        >
            {/* Overlay to dismiss */}
            <TouchableWithoutFeedback onPress={handleOverlayPress}>
                <View style={styles.overlay}>
                    {/* KeyboardAvoidingView to push content up */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined} // Padding for iOS, rely on Android manifest for Android
                        style={styles.keyboardAvoidingContainer}
                        keyboardVerticalOffset={0} // Adjust if needed based on header/tab bar
                    >
                        {/* Prevent taps inside the container from closing the modal */}
                        <TouchableWithoutFeedback>
                             <View style={styles.container}>
                                 {/* --- Recommendation Bar --- */}
                                 {suggestions.length > 0 && (
                                    <View style={styles.recommendationBar}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyboardShouldPersistTaps="always" // Allow tapping suggestions without dismissing keyboard
                                        >
                                            {suggestions.map((suggestion, index) => (
                                                <TouchableOpacity
                                                    key={`${suggestion}-${index}`}
                                                    style={styles.suggestionButton}
                                                    onPress={() => handleSuggestionPress(suggestion)}
                                                >
                                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                 )}

                                {/* --- Input Row --- */}
                                <View style={styles.inputRow}>
                                    <TextInput
                                        ref={textInputRef}
                                        style={styles.inputField}
                                        placeholder={placeholder}
                                        placeholderTextColor={theme.disabled} // Use themed placeholder color
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline={false} // Keep as single line for this type of input
                                        returnKeyType="send" // Use 'send' key
                                        onSubmitEditing={handleSubmit} // Submit on return key press
                                        blurOnSubmit={false} // Keep keyboard up after submit
                                        selectionColor={theme.primary} // Use theme color for cursor/selection
                                        underlineColorAndroid="transparent"
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendButton, !isSendActive && styles.sendButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={!isSendActive}
                                        activeOpacity={0.7}
                                        accessibilityLabel="Send message"
                                        accessibilityState={{ disabled: !isSendActive }}
                                    >
                                        {/* Use theme color for active icon */}
                                        <FontAwesomeIcon icon={faPaperPlane} size={fonts.body * 1.1} color={theme.white} />
                                    </TouchableOpacity>
                                </View>
                             </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.15)', // Theme overlay
        justifyContent: 'flex-end', // Anchor to bottom
    },
    keyboardAvoidingContainer: {
       width: '100%',
    },
    container: {
        backgroundColor: theme.card, // Use theme card color for background
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border, // Use theme border color
    },
    recommendationBar: {
        height: 40,
        paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border, // Use theme border color
        justifyContent: 'center',
        backgroundColor: theme.background, // Slightly different bg for suggestions
    },
    suggestionButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
        borderRadius: 15,
        backgroundColor: theme.card, // Use theme card color for button background
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border, // Use theme border color
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: fonts.label, // Use font size
        color: theme.textSecondary, // Use theme secondary text color
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        // Background color inherited from container
    },
    inputField: {
        flex: 1,
        minHeight: 42,
        maxHeight: 100, // Allow some expansion if needed later, but keep single line focus
        backgroundColor: theme.background, // Use theme background for input field
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: fonts.body, // Use font size
        color: theme.text, // Use theme text color
        marginRight: 10,
        borderWidth: 1,
        borderColor: theme.border, // Use theme border color
    },
    sendButton: {
        backgroundColor: theme.primary, // Use theme primary color
        borderRadius: 21,
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 3, // Adjust icon alignment if needed
    },
    sendButtonDisabled: {
        backgroundColor: theme.disabled, // Use theme disabled color
    },
});

export default KeyboardInputComponent;