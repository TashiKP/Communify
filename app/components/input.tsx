import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'; // Added ScrollView
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faVolumeUp,
  faBackspace,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

// --- Colors (Using the professional palette) ---
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const placeholderColor = '#6c757d'; // Placeholder grey
const lightGrey = '#e9ecef';      // Subtle borders or backgrounds
const mediumGrey = '#ced4da';    // Borders
const iconColorActive = whiteColor;
const iconColorInactive = 'rgba(255, 255, 255, 0.7)'; // Slightly muted icon if needed

// --- Props ---
interface IconInputComponentProps {
  /** Function to call when the speak button is pressed */
  onSpeakPress?: () => void;
  /** Function to call when the backspace button is pressed */
  onBackspacePress?: () => void;
  /** Function to call when the clear button is pressed */
  onClearPress?: () => void;
  /** The actual content (e.g., selected symbols/text) to display in the middle */
  children?: React.ReactNode; // Use children prop for content flexibility
  /** Optional: Disable speak button (e.g., if input is empty) */
  isSpeakDisabled?: boolean;
  /** Optional: Disable backspace button (e.g., if input is empty) */
  isBackspaceDisabled?: boolean;
   /** Optional: Disable clear button (e.g., if input is empty) */
  isClearDisabled?: boolean;
}

// --- Component ---
const IconInputComponent: React.FC<IconInputComponentProps> = ({
  onSpeakPress,
  onBackspacePress,
  onClearPress,
  children, // Receive content via children
  isSpeakDisabled = false,
  isBackspaceDisabled = false,
  isClearDisabled = false,
}) => {
  const speakIconColor = isSpeakDisabled ? iconColorInactive : iconColorActive;
  const backspaceIconColor = isBackspaceDisabled ? iconColorInactive : iconColorActive;
  const clearIconColor = isClearDisabled ? iconColorInactive : iconColorActive;

  return (
    <View style={styles.container}>
      {/* Left Action Button (Speak) */}
      <View style={styles.actionSection}>
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onSpeakPress}
            disabled={isSpeakDisabled}
            accessibilityLabel="Speak sentence"
            accessibilityState={{ disabled: isSpeakDisabled }}
            hitSlop={styles.hitSlop} // Use defined hitSlop
        >
          <FontAwesomeIcon icon={faVolumeUp} size={26} color={speakIconColor} />
        </TouchableOpacity>
      </View>

      {/* Central Input Area */}
      <View style={styles.inputArea}>
        {/* Render children passed to the component */}
        {/* Wrap children in ScrollView for horizontal scrolling if content overflows */}
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inputContentContainer}
            keyboardShouldPersistTaps="handled" // Good practice if text input is ever used here
        >
            {children ? children : <Text style={styles.placeholderText}>Selected items appear here</Text>}
        </ScrollView>
      </View>

      {/* Right Action Buttons (Backspace, Clear) */}
      <View style={[styles.actionSection, styles.actionSectionRight]}>
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onBackspacePress}
            disabled={isBackspaceDisabled}
            accessibilityLabel="Delete last item"
            accessibilityState={{ disabled: isBackspaceDisabled }}
            hitSlop={styles.hitSlop}
        >
          <FontAwesomeIcon icon={faBackspace} size={26} color={backspaceIconColor} />
        </TouchableOpacity>
        {/* Spacer View for consistent spacing */}
        <View style={styles.buttonSpacer} />
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onClearPress}
            disabled={isClearDisabled}
            accessibilityLabel="Clear all items"
            accessibilityState={{ disabled: isClearDisabled }}
            hitSlop={styles.hitSlop}
        >
          <FontAwesomeIcon icon={faTrash} size={24} color={clearIconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles --- (Refined Professional Look)
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch', // Ensure children fill height
    width: '100%',
    backgroundColor: primaryColor, // Primary color for the bar background
    minHeight: Platform.select({ ios: 70, default: 65 }), // Slightly taller on iOS potentially
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', // Subtle top border
    // No shadow for a flatter look, relies on background contrast
  },
  actionSection: {
    // Use padding to control width and center icon(s)
    paddingHorizontal: 18, // Slightly more padding for better spacing
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSectionRight: {
    flexDirection: 'row', // Align right icons horizontally
    paddingRight: 20, // Keep slightly more padding on the far right edge
  },
  inputArea: {
    flex: 1, // Take up the majority of the space
    backgroundColor: whiteColor, // Clear white background for input
    // No border needed, relies on background contrast
    marginVertical: 6, // Creates inset effect and vertical padding
    marginHorizontal: 0, // No horizontal margin needed usually
    borderRadius: 8, // Soft rounded corners for the inset area
    overflow: 'hidden', // Ensure ScrollView respects border radius
    justifyContent: 'center', // Center content vertically if it's shorter than the area
  },
  inputContentContainer: {
    flexGrow: 1, // Allows content to grow horizontally
    alignItems: 'center', // Vertically align items inside the ScrollView
    paddingHorizontal: 12, // Internal padding for the content
  },
  iconButton: {
    padding: 8, // Smaller internal padding, hitSlop provides larger tap area
    justifyContent: 'center',
    alignItems: 'center',
    // Icons themselves provide visual cue, no extra button styling needed
  },
  buttonSpacer: {
    width: 15, // Consistent spacing between right-side buttons
  },
  placeholderText: {
    color: placeholderColor,
    fontSize: 16,
    fontStyle: 'italic',
  },
  hitSlop: { // Define hitSlop centrally for consistency
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
});

export default IconInputComponent;