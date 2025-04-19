import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Text, // Need Text for suggestions
    ScrollView // For horizontal suggestions
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';

// --- Colors (Consistent Palette) ---
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const textColor = '#343a40';
const placeholderColor = '#adb5bd';
const lightGrey = '#f8f9fa'; // Backgrounds
const mediumGrey = '#dee2e6'; // Borders / Disabled states
const suggestionTextColor = '#495057'; // Slightly lighter text for suggestions

// --- Props ---
interface KeyboardInputProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    placeholder?: string;
    // --- Suggestion Logic (Requires Implementation) ---
    // Function to get suggestions based on current input buffer
    // getSuggestions?: (currentBuffer: string) => Promise<string[]> | string[];
}

// --- Component ---
const KeyboardInputComponent: React.FC<KeyboardInputProps> = ({
    visible,
    onClose,
    onSubmit,
    placeholder = "Type message...",
    // getSuggestions, // Use this prop if implementing suggestion logic
}) => {
    const [inputText, setInputText] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]); // State for suggestions
    const textInputRef = useRef<TextInput>(null);

    // Focus input when modal becomes visible
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => { textInputRef.current?.focus(); }, 150); // Slightly longer delay might help
            return () => clearTimeout(timer);
        } else {
             setInputText('');
             setSuggestions([]); // Clear suggestions on close
        }
    }, [visible]);

    // --- Placeholder Suggestion Logic ---
    // Replace this with your actual suggestion fetching/generation
    useEffect(() => {
        if (!inputText) {
            setSuggestions([]);
            return;
        }
        // Simulate getting suggestions based on the last word
        const words = inputText.split(' ');
        const currentWord = words[words.length - 1].toLowerCase();

        if (currentWord.length > 1) {
            // *** Dummy Suggestions - Replace with real logic ***
            const dummySuggestions = ['hello', 'world', 'react', 'native', 'keyboard', 'component', 'awesome']
                .filter(s => s.startsWith(currentWord))
                .slice(0, 5); // Limit suggestions shown
            setSuggestions(dummySuggestions);
        } else {
            setSuggestions([]);
        }

        // --- Example using a prop function (if provided) ---
        // if (getSuggestions) {
        //     Promise.resolve(getSuggestions(inputText)) // Ensure it's a promise
        //         .then(setSuggestions)
        //         .catch(err => console.error("Error getting suggestions:", err));
        // }

    }, [inputText /*, getSuggestions */]);
    //------------------------------------

     const handleSubmit = () => {
        const trimmedText = inputText.trim();
        if (trimmedText) {
            onSubmit(trimmedText);
            setInputText('');
            setSuggestions([]);
            // Keep keyboard up - onClose(); // Optionally close modal
        }
    };

    const handleSuggestionPress = (suggestion: string) => {
        const words = inputText.trimRight().split(' '); // Trim trailing space before split
        words[words.length - 1] = suggestion; // Replace last word
        const newText = words.join(' ') + ' '; // Rejoin and add space
        setInputText(newText);
        textInputRef.current?.focus(); // Keep focus
        setSuggestions([]); // Clear suggestions after selection
    };

    const handleOverlayPress = () => {
         Keyboard.dismiss();
         onClose();
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={handleOverlayPress}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined} // Use undefined for Android if height isn't needed
                        style={styles.keyboardAvoidingContainer}
                        // Adjust offset if needed, especially if bar height changes
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        {/* Container for the input bar and recommendations */}
                        {/* Prevent overlay tap from dismissing when tapping controls */}
                        <TouchableWithoutFeedback>
                             <View style={styles.container}>
                                 {/* --- Recommendation Bar --- */}
                                 {suggestions.length > 0 && (
                                    <View style={styles.recommendationBar}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                                        placeholderTextColor={placeholderColor}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline={false}
                                        returnKeyType="send"
                                        onSubmitEditing={handleSubmit}
                                        blurOnSubmit={false} // Keep keyboard focused generally
                                        autoFocus={false} // Rely on useEffect for focus after animation
                                        underlineColorAndroid="transparent" // Clean Android underline
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={!inputText.trim()}
                                        activeOpacity={0.7}
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} size={18} color={whiteColor} />
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

// --- Styles ---
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.15)', // Lighter overlay
        justifyContent: 'flex-end', // Anchor to bottom
    },
    keyboardAvoidingContainer: {
       width: '100%',
    },
    container: { // Holds recommendations and input bar
        backgroundColor: lightGrey, // Background for the whole area above keyboard
        borderTopWidth: 1,
        borderTopColor: mediumGrey,
    },
    recommendationBar: {
        height: 40, // Fixed height for suggestion bar
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: mediumGrey,
        justifyContent: 'center',
    },
    suggestionButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
        borderRadius: 15,
        backgroundColor: whiteColor, // Subtle background for suggestions
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: 15,
        color: suggestionTextColor,
    },
    inputRow: { // Contains text input and send button
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        // Background color inherited from container
    },
    inputField: { // The TextInput itself
        flex: 1,
        minHeight: 42, // Consistent height
        maxHeight: 100,
        backgroundColor: whiteColor, // White background for input
        borderRadius: 21, // Fully rounded ends
        paddingHorizontal: 16, // More horizontal padding
        paddingVertical: Platform.OS === 'ios' ? 10 : 8, // Adjust vertical padding per platform
        fontSize: 16,
        color: textColor,
        marginRight: 10,
        borderWidth: 1, // Subtle border for the input field
        borderColor: mediumGrey,
    },
    sendButton: {
        backgroundColor: primaryColor,
        borderRadius: 21, // Match input field rounding
        width: 42, // Match height for circle
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 3, // Center plane icon
    },
    sendButtonDisabled: {
        backgroundColor: mediumGrey,
    },
});

export default KeyboardInputComponent;