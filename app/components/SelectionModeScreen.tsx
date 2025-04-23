// src/components/SelectionModeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faArrowsUpDown, faHandPointer, faCheckCircle, // Keep check circle or use radio style
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
// Removed GridContext import as this component manages its own state now
// import { useGrid, GridLayoutType } from '../context/GridContext';

// Define the possible selection modes
type Mode = 'drag' | 'longClick';

// --- Interface for the component's props ---
// --- REINSTATED onSave and initialMode ---
export interface SelectionModeScreenProps {
  initialMode?: Mode | null; // Starting mode value
  onSave: (mode: Mode | null) => Promise<void> | void; // Function to save the selection
  onClose: () => void; // Function to close the screen
}
// -----------------------------------------

// --- Component ---
const SelectionModeScreen: React.FC<SelectionModeScreenProps> = ({
  initialMode: initialPropMode = 'drag', // Default to 'drag' if null/undefined passed
  onSave, // Use the passed onSave function
  onClose,
}) => {
  // State
  const [selectedMode, setSelectedMode] = useState<Mode | null>(initialPropMode);
  const [originalMode, setOriginalMode] = useState<Mode | null>(initialPropMode);
  const [isSaving, setIsSaving] = useState(false);

  // Effects - Sync local state if initial prop changes
  useEffect(() => {
     setSelectedMode(initialPropMode);
     setOriginalMode(initialPropMode);
  }, [initialPropMode]);

  // Memos
  const hasChanged = useMemo(() => selectedMode !== originalMode, [selectedMode, originalMode]);

  // Handlers
  const handleSelectOption = (mode: Mode) => {
      setSelectedMode(mode);
  };
  const handleClearSelection = () => {
      setSelectedMode(null); // Allow clearing to null
  };

  const handleSave = async () => {
     if (!hasChanged) {
         onClose(); // Just close if no changes
         return;
     }
     setIsSaving(true);
     try {
        await onSave(selectedMode); // Call the parent's save function
        setOriginalMode(selectedMode); // Update original state after successful save
        onClose(); // Close after successful save
     } catch(error) {
        console.error("Failed to save selection mode:", error);
        Alert.alert("Error", "Could not save selection.");
        setIsSaving(false); // Reset saving state on error
     }
     // No finally needed if closing on success
  };

  const handleAttemptClose = useCallback(() => {
    if (hasChanged) {
      Alert.alert("Unsaved Changes", "Discard changes and go back?",
        [ { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onClose } ]
      );
    } else { onClose(); }
  }, [hasChanged, onClose]);

  const getHelperText = () => {
    switch (selectedMode) {
      case 'drag': return 'Tap and hold symbols, then drag them to the sentence bar.';
      case 'longClick': return 'Tap a symbol once to add it to the sentence bar.';
      default: return 'Choose how symbols are added to the sentence bar.';
    }
  };

  // Selection options data
  const selectionOptions: { type: Mode; label: string; icon: any; description: string }[] = [
      { type: 'drag', label: 'Drag and Drop', icon: faArrowsUpDown, description: 'Press, hold, and drag symbol.' },
      { type: 'longClick', label: 'Tap to Select', icon: faHandPointer, description: 'Single tap adds symbol instantly.' },
  ];


  // --- Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop}>
                <FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>Selection Method</Text>
              </View>
              <TouchableOpacity
                 style={styles.headerButton}
                 onPress={handleSave} // Use the corrected handleSave
                 disabled={!hasChanged || isSaving}
                 hitSlop={hitSlop}
                 accessibilityLabel="Save selection method"
                 accessibilityState={{disabled: !hasChanged || isSaving}}
               >
                 {isSaving
                    ? <ActivityIndicator size="small" color={whiteColor}/>
                     // Show Save Icon instead of text to match other screens
                    : <FontAwesomeIcon icon={faSave} size={20} color={hasChanged ? whiteColor : disabledButtonColor} />
                 }
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

                {/* Instruction Text */}
                <Text style={styles.instructionText}>
                    Select your preferred method:
                </Text>

                {/* Option Cards */}
                {selectionOptions.map((option) => {
                    const isSelected = selectedMode === option.type;
                    return (
                        <View key={option.type} style={[ styles.sectionCard, isSelected && styles.selectedOptionCard ]}>
                            <TouchableOpacity
                                style={styles.optionContentRow}
                                onPress={() => handleSelectOption(option.type)}
                                activeOpacity={0.7}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isSelected }}
                                accessibilityLabel={`Select ${option.label} method. ${option.description}`}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon
                                    icon={option.icon}
                                    size={24} // Slightly larger icon
                                    color={isSelected ? primaryColor : darkGrey}
                                    style={styles.optionIcon}
                                />
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>
                                        {option.label}
                                    </Text>
                                    <Text style={[styles.optionDescription, isSelected && styles.selectedOptionDescription]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {/* Radio button style indicator */}
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
                        style={styles.clearButton}
                        onPress={handleClearSelection}
                        hitSlop={hitSlop}
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Clear current selection"
                    >
                        <FontAwesomeIcon icon={faTimesCircle} size={14} color={darkGrey} style={styles.clearIcon}/>
                        <Text style={styles.clearButtonText}>Clear Selection</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    </SafeAreaView>
  );
};

// --- Constants & Styles ---
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const screenBackgroundColor = '#f4f7f9';
const cardBackgroundColor = '#ffffff';
const textColor = '#2d3436';
const darkGrey = '#636e72';
const mediumGrey = '#b2bec3';
const lightGrey = '#dfe6e9';
const lighterBlueBackground = '#e7f5ff';
const disabledButtonColor = '#a9d6e9';

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: primaryColor }, // Header color for notch area
  container: { flex: 1, backgroundColor: screenBackgroundColor },
  header: { backgroundColor: primaryColor, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', },
  titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
  title: { fontSize: 18, fontWeight: '600', color: whiteColor, textAlign: 'center', },
  headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }, // Style for potential text save button
  saveButtonTextDisabled: { color: 'rgba(255, 255, 255, 0.5)' }, // Style for potential disabled text save button
  scrollView: { flex: 1, },
  scrollContainer: { padding: 15, paddingBottom: 40, },
  instructionText: { fontSize: 16, color: darkGrey, marginBottom: 25, textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  sectionCard: { backgroundColor: cardBackgroundColor, borderRadius: 12, marginBottom: 15, borderWidth: 1.5, borderColor: lightGrey, overflow: 'hidden', },
  selectedOptionCard: { borderColor: primaryColor, backgroundColor: lighterBlueBackground, },
  optionContentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18, minHeight: 70, },
  optionIcon: { marginRight: 18, width: 25, textAlign: 'center', },
  optionTextContainer: { flex: 1, marginRight: 10, },
  optionLabel: { fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 3, }, // Increased boldness
  selectedOptionLabel: { color: primaryColor, },
  optionDescription: { fontSize: 13, color: darkGrey, lineHeight: 18 }, // Adjusted line height
  selectedOptionDescription: { color: darkGrey }, // Keep description color consistent maybe? Or change to primaryColor?
  radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: mediumGrey, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', backgroundColor: whiteColor }, // Push radio to right
  radioOuterSelected: { borderColor: primaryColor },
  radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: primaryColor },
  helperTextContainer: { marginTop: 15, paddingVertical: 15, paddingHorizontal: 10, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10, },
  helperText: { color: darkGrey, fontSize: 14, textAlign: 'center', lineHeight: 20, },
  clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 15, alignSelf: 'center', marginTop: 10, },
  clearButtonText: { fontSize: 14, color: darkGrey, fontWeight: '500', textDecorationLine: 'underline', },
  clearIcon: { marginRight: 6, color: darkGrey, },
});

export default SelectionModeScreen;