// src/components/IconInputComponent.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faVolumeUp,
  faBackspace,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Props ---
interface IconInputComponentProps {
  /** Function to call when the speak button is pressed */
  onSpeakPress?: () => void;
  /** Function to call when the backspace button is pressed */
  onBackspacePress?: () => void;
  /** Function to call when the clear button is pressed */
  onClearPress?: () => void;
  /** The actual content (e.g., selected symbols/text) to display in the middle */
  children?: React.ReactNode;
  /** Optional: Disable speak button (e.g., if input is empty) */
  isSpeakDisabled?: boolean;
  /** Optional: Disable backspace button (e.g., if input is empty) */
  isBackspaceDisabled?: boolean;
   /** Optional: Disable clear button (e.g., if input is empty) */
  isClearDisabled?: boolean;
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const IconInputComponent: React.FC<IconInputComponentProps> = ({
  onSpeakPress,
  onBackspacePress,
  onClearPress,
  children,
  isSpeakDisabled = false,
  isBackspaceDisabled = false,
  isClearDisabled = false,
}) => {
  // --- Consume Appearance Context ---
  const { theme, fonts } = useAppearance();

  // --- Dynamic Styles ---
  // Recalculate styles only when theme or fonts change
  const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

  // --- Determine Icon Colors Based on Theme and Disabled State ---
  const iconColorActive = theme.white; // Active icons use theme's white color
  const iconColorInactive = theme.disabled; // Use theme's disabled color for inactive icons

  const speakIconColor = isSpeakDisabled ? iconColorInactive : iconColorActive;
  const backspaceIconColor = isBackspaceDisabled ? iconColorInactive : iconColorActive;
  const clearIconColor = isClearDisabled ? iconColorInactive : iconColorActive;

  // Calculate icon sizes based on theme fonts
  const iconSize = fonts.h2 * 1.1; // Example: Base size on h2 font size
  const smallIconSize = fonts.h2; // Slightly smaller for trash icon maybe

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
            hitSlop={hitSlop}
        >
          <FontAwesomeIcon icon={faVolumeUp} size={iconSize} color={speakIconColor} />
        </TouchableOpacity>
      </View>

      {/* Central Input Area */}
      <View style={styles.inputArea}>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inputContentContainer}
            keyboardShouldPersistTaps="handled"
        >
            {/* Render children or themed placeholder */}
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
            hitSlop={hitSlop}
        >
          <FontAwesomeIcon icon={faBackspace} size={iconSize} color={backspaceIconColor} />
        </TouchableOpacity>
        {/* Spacer */}
        <View style={styles.buttonSpacer} />
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onClearPress}
            disabled={isClearDisabled}
            accessibilityLabel="Clear all items"
            accessibilityState={{ disabled: isClearDisabled }}
            hitSlop={hitSlop}
        >
          <FontAwesomeIcon icon={faTrash} size={smallIconSize} color={clearIconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    backgroundColor: theme.primary, // Use theme primary for bar background
    minHeight: Platform.select({ ios: 70, default: 65 }),
    // Use theme border or a subtle overlay based on theme
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  actionSection: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSectionRight: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  inputArea: {
    flex: 1,
    backgroundColor: theme.card, // Use theme card color for input background
    marginVertical: 6,
    marginHorizontal: 0,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, // Add subtle border
    borderColor: theme.border,          // Use theme border color
  },
  inputContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 15,
  },
  placeholderText: {
    color: theme.disabled, // Use theme disabled color for placeholder
    fontSize: fonts.body,   // Use theme font size
    fontStyle: 'italic',
  },
  // hitSlop defined outside styles
});

export default IconInputComponent;