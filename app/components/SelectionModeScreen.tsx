// src/components/SelectionModeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faArrowsUpDown, faHandPointer, faCheckCircle,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

// --- Import Context Hooks ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// Define the possible selection modes
export type Mode = 'drag' | 'longClick'; // Export if needed elsewhere

// --- Interface for the component's props ---
export interface SelectionModeScreenProps {
  initialMode?: Mode | null; // Starting mode value from parent (e.g., Menu)
  onSave: (mode: Mode | null) => Promise<void> | void; // Function to save the selection back to parent
  onClose: () => void; // Function to close the screen
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const SelectionModeScreen: React.FC<SelectionModeScreenProps> = ({
  initialMode: initialPropMode = 'drag', // Default to 'drag' if null/undefined passed
  onSave,
  onClose,
}) => {
  // --- Consume Context ---
  const { theme, fonts, isLoadingAppearance } = useAppearance(); // Get theme/fonts/loading state

  // --- State ---
  // Local state to track the selection *during* editing on this screen
  const [selectedMode, setSelectedMode] = useState<Mode | null>(initialPropMode);
  // Store the initial mode passed in to compare for changes
  const [originalMode, setOriginalMode] = useState<Mode | null>(initialPropMode);
  // Saving indicator state
  const [isSaving, setIsSaving] = useState(false);

  // --- Dynamic Styles ---
  // Recalculate styles only when theme or fonts change
  const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

  // --- Effects ---
  // Sync local state if the initial mode prop changes after mount
  useEffect(() => {
     setSelectedMode(initialPropMode);
     setOriginalMode(initialPropMode);
     // Reset saving state if initial mode changes externally
     setIsSaving(false);
  }, [initialPropMode]);

  // --- Memos ---
  // Determine if the selected mode differs from the initial mode
  const hasChanged = useMemo(() => selectedMode !== originalMode, [selectedMode, originalMode]);

  // --- Handlers ---
  // Update the local selected mode when an option is tapped
  const handleSelectOption = (mode: Mode) => {
      setSelectedMode(mode);
  };

  // Clear the local selection (set to null)
  const handleClearSelection = () => {
      setSelectedMode(null);
  };

  // Handle saving the selection
  const handleSave = async () => {
     // Do nothing if no changes or already saving
     if (!hasChanged || isSaving) {
         // If no changes, just close the screen
         if (!hasChanged) onClose();
         return;
     }
     setIsSaving(true);
     try {
        await onSave(selectedMode); // Call the parent's async save function
        setOriginalMode(selectedMode); // Update the original state baseline after successful save
        onClose(); // Close the screen after successful save
     } catch(error) {
        console.error("Failed to save selection mode:", error);
        Alert.alert("Error", "Could not save selection method.");
        setIsSaving(false); // Ensure saving state is reset on error
     }
     // No finally block needed here as we close on success or handle error explicitly
  };

  // Handle attempting to close the screen (checks for unsaved changes)
  const handleAttemptClose = useCallback(() => {
    if (hasChanged) {
      Alert.alert(
        "Unsaved Changes",
        "Discard changes and go back?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: onClose }
        ]
      );
    } else {
        onClose(); // Close directly if no changes
    }
  }, [hasChanged, onClose]);

  // Get helper text based on the currently selected mode
  const getHelperText = () => {
    switch (selectedMode) {
      case 'drag': return 'Tap and hold symbols, then drag them to the sentence bar.';
      case 'longClick': return 'Tap a symbol once to add it to the sentence bar.';
      default: return 'Choose how symbols are added to the sentence bar.';
    }
  };

  // --- Data for Selection Options ---
  const selectionOptions: { type: Mode; label: string; icon: any; description: string }[] = [
      { type: 'drag', label: 'Drag and Drop', icon: faArrowsUpDown, description: 'Press, hold, and drag symbol.' },
      { type: 'longClick', label: 'Tap to Select', icon: faHandPointer, description: 'Single tap adds symbol instantly.' },
  ];

    // --- Determine Button States ---
    // Disable buttons if context is loading or if saving is in progress
    const isLoading = isLoadingAppearance || isSaving;
    const isSaveDisabled = !hasChanged || isLoading;
    const isClearDisabled = selectedMode === null || isLoading;

  // --- Render ---
  // Show loading indicator if appearance context is loading
   if (isLoadingAppearance) {
      return (
          <SafeAreaView style={styles.safeArea}>
              <View style={[styles.container, styles.loadingContainer]}>
                   <ActivityIndicator size="large" color={theme.primary} />
                   <Text style={[styles.instructionText, { marginTop: 15 }]}>Loading Settings...</Text>
               </View>
          </SafeAreaView>
       );
   }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel="Go back">
                <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>Selection Method</Text>
              </View>
              <TouchableOpacity
                 style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                 onPress={handleSave}
                 disabled={isSaveDisabled}
                 hitSlop={hitSlop}
                 accessibilityLabel="Save selection method"
                 accessibilityState={{disabled: isSaveDisabled}}
               >
                 {isSaving // Show indicator only during save operation
                    ? <ActivityIndicator size="small" color={theme.white}/>
                    : <FontAwesomeIcon icon={faSave} size={fonts.h2 * 0.9} color={!isSaveDisabled ? theme.white : theme.disabled} />
                 }
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

                {/* Instruction Text */}
                <Text style={styles.instructionText}>
                    Select your preferred method for adding symbols to the sentence bar:
                </Text>

                {/* Option Cards */}
                {selectionOptions.map((option) => {
                    const isSelected = selectedMode === option.type;
                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const descriptionColor = isSelected ? theme.textSecondary : theme.disabled;

                    return (
                        <View key={option.type} style={[ styles.sectionCard, isSelected && styles.selectedOptionCard ]}>
                            <TouchableOpacity
                                style={styles.optionContentRow}
                                onPress={() => handleSelectOption(option.type)}
                                activeOpacity={0.7}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isSelected }}
                                accessibilityLabel={`Select ${option.label} method. ${option.description}`}
                                disabled={isLoading} // Disable interaction while loading/saving
                            >
                                <FontAwesomeIcon
                                    icon={option.icon}
                                    size={fonts.h1 * 0.9}
                                    color={iconColor}
                                    style={styles.optionIcon}
                                />
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>
                                        {option.label}
                                    </Text>
                                    <Text style={[styles.optionDescription, { color: descriptionColor }]}>
                                        {option.description}
                                    </Text>
                                </View>
                                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Helper text area */}
                <View style={styles.helperTextContainer}>
                    <Text style={styles.helperText}>{getHelperText()}</Text>
                </View>

                {/* Clear Selection Button */}
                {selectedMode !== null && (
                    <TouchableOpacity
                        style={[styles.clearButton, isClearDisabled && styles.buttonDisabled]}
                        onPress={handleClearSelection}
                        hitSlop={hitSlop}
                        disabled={isClearDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Clear current selection"
                    >
                        <FontAwesomeIcon icon={faTimesCircle} size={fonts.caption * 1.1} color={theme.textSecondary} style={styles.clearIcon}/>
                        <Text style={styles.clearButtonText}>Clear Selection</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    </SafeAreaView>
  );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.primary },
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { // Style for loading state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  header: {
      backgroundColor: theme.primary,
      paddingTop: Platform.OS === 'android' ? 10 : 0,
      paddingBottom: 12,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
  title: { fontSize: fonts.h2, fontWeight: '600', color: theme.white, textAlign: 'center', },
  headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
  scrollView: { flex: 1, },
  scrollContainer: { padding: 15, paddingBottom: 40, },
  instructionText: {
      fontSize: fonts.body,
      color: theme.textSecondary,
      marginBottom: 25,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: fonts.body * 1.4,
  },
  sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 15,
      borderWidth: 1.5,
      borderColor: theme.border,
      overflow: 'hidden',
  },
  selectedOptionCard: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryMuted,
  },
  optionContentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 18,
      minHeight: 70,
  },
  optionIcon: {
      marginRight: 18,
      width: fonts.h1 * 0.9, // Width based on icon size
      textAlign: 'center',
  },
  optionTextContainer: { flex: 1, marginRight: 10, },
  optionLabel: {
      fontSize: fonts.label,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 3,
  },
  selectedOptionLabel: {
      color: theme.primary,
  },
  optionDescription: {
      fontSize: fonts.caption,
      lineHeight: fonts.caption * 1.4,
      // color set dynamically
  },
  radioOuter: {
      height: 22, width: 22, borderRadius: 11, borderWidth: 2,
      borderColor: theme.border, alignItems: 'center',
      justifyContent: 'center', marginLeft: 'auto',
      backgroundColor: theme.card // Match card bg
  },
  radioOuterSelected: { borderColor: theme.primary },
  radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: theme.primary },
  helperTextContainer: {
      marginTop: 15, paddingVertical: 15, paddingHorizontal: 10,
      minHeight: 50, alignItems: 'center', justifyContent: 'center',
      marginBottom: 10,
  },
  helperText: {
      color: theme.textSecondary,
      fontSize: fonts.caption,
      textAlign: 'center',
      lineHeight: fonts.caption * 1.4,
  },
  clearButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 10, paddingHorizontal: 15, alignSelf: 'center',
      marginTop: 10,
  },
  clearButtonText: {
      fontSize: fonts.label, color: theme.textSecondary,
      fontWeight: '500', textDecorationLine: 'underline',
  },
  clearIcon: { marginRight: 6, },
  buttonDisabled: { // General disabled style
    opacity: 0.5,
  },
});

export default SelectionModeScreen;