import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faArrowsUpDown, faHandPointer, faCheckCircle,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

// Define the possible selection modes
type Mode = 'drag' | 'longClick';

// Interface for the component's props
export interface SelectionModeScreenProps {
  initialMode?: Mode | null;
  onSave: (mode: Mode | null) => Promise<void> | void;
  onClose: () => void;
}

// --- Component ---
const SelectionModeScreen: React.FC<SelectionModeScreenProps> = ({
  initialMode: initialPropMode = null,
  onSave,
  onClose,
}) => {
  // State
  const [selectedMode, setSelectedMode] = useState<Mode | null>(initialPropMode);
  const [originalMode, setOriginalMode] = useState<Mode | null>(initialPropMode);
  const [isSaving, setIsSaving] = useState(false);

  // Effects
  useEffect(() => {
     setSelectedMode(initialPropMode);
     setOriginalMode(initialPropMode);
  }, [initialPropMode]);

  // Memos
  const hasChanged = useMemo(() => selectedMode !== originalMode, [selectedMode, originalMode]);

  // Handlers
  const handleSelectOption = (mode: Mode) => { setSelectedMode(mode); };
  const handleClearSelection = () => { setSelectedMode(null); };

  const handleSave = async () => {
     if (!hasChanged) return;
     setIsSaving(true);
     try {
        await onSave(selectedMode);
        setOriginalMode(selectedMode);
        onClose();
     } catch(error) {
        console.error("Failed to save selection mode:", error);
        Alert.alert("Error", "Could not save selection.");
        setIsSaving(false);
     }
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

  // --- Render ---
  return (
    <SafeAreaView style={styles.screenContainer}>
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
             onPress={handleSave}
             disabled={!hasChanged || isSaving}
             hitSlop={hitSlop}
           >
             {isSaving
                ? <ActivityIndicator size="small" color={whiteColor}/>
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

            {/* Option Card: Drag and Drop */}
            {/* Using a wrapper View to apply card style, TouchableOpacity is inside */}
            <View style={[ styles.sectionCard, selectedMode === 'drag' && styles.selectedOptionCard ]}>
                <TouchableOpacity
                    style={styles.optionContentRow} // Style for the touchable content row
                    onPress={() => handleSelectOption('drag')}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedMode === 'drag' }}
                    accessibilityLabel="Select Drag and Drop method"
                >
                    <FontAwesomeIcon
                        icon={faArrowsUpDown}
                        size={20} // Consistent icon size
                        color={selectedMode === 'drag' ? primaryColor : darkGrey}
                        style={styles.optionIcon}
                    />
                    <View style={styles.optionTextContainer}>
                        <Text style={[styles.optionLabel, selectedMode === 'drag' && styles.selectedOptionLabel]}>
                            Drag and Drop
                        </Text>
                        <Text style={styles.optionDescription}>
                            Press, hold, and drag symbol.
                        </Text>
                    </View>
                    {/* Use Radio button style from Parental Controls */}
                    <View style={[styles.radioOuter, selectedMode === 'drag' && styles.radioOuterSelected]}>
                        {selectedMode === 'drag' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
            </View>


            {/* Option Card: Tap to Select */}
             <View style={[ styles.sectionCard, selectedMode === 'longClick' && styles.selectedOptionCard ]}>
                <TouchableOpacity
                    style={styles.optionContentRow}
                    onPress={() => handleSelectOption('longClick')}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedMode === 'longClick' }}
                    accessibilityLabel="Select Tap to Select method"
                    >
                    <FontAwesomeIcon
                        icon={faHandPointer}
                        size={20} // Consistent icon size
                        color={selectedMode === 'longClick' ? primaryColor : darkGrey}
                        style={styles.optionIcon}
                    />
                    <View style={styles.optionTextContainer}>
                        <Text style={[styles.optionLabel, selectedMode === 'longClick' && styles.selectedOptionLabel]}>
                            Tap to Select
                        </Text>
                        <Text style={styles.optionDescription}>
                            Single tap adds symbol instantly.
                        </Text>
                    </View>
                     <View style={[styles.radioOuter, selectedMode === 'longClick' && styles.radioOuterSelected]}>
                        {selectedMode === 'longClick' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>
            </View>

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
                    accessibilityRole="button"
                    accessibilityLabel="Clear current selection"
                >
                    <FontAwesomeIcon icon={faTimesCircle} size={14} color={darkGrey} style={styles.clearIcon}/>
                    <Text style={styles.clearButtonText}>Clear Selection</Text>
                </TouchableOpacity>
            )}

        </ScrollView>
    </SafeAreaView>
  );
};

// --- Constants & Styles - Adapted from ParentalControls Simple ---
const primaryColor = '#0077b6';
const secondaryColor = '#90e0ef'; // Used for radio button selected state potentially
const screenBackgroundColor = '#f4f7f9';
const cardBackgroundColor = '#ffffff';
const whiteColor = '#ffffff';
const textColor = '#2d3436';
const darkGrey = '#636e72'; // Use for inactive icons/text
const mediumGrey = '#b2bec3'; // Use for borders, disabled text
const lightGrey = '#dfe6e9'; // Use for lighter borders/dividers
const lighterBlueBackground = '#e7f5ff'; // Background for selected card
const disabledButtonColor = '#a9d6e9';

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: screenBackgroundColor
  },  
  header: {
    backgroundColor: primaryColor,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: whiteColor,
    textAlign: 'center',
  },
  headerButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { // Style for the ScrollView component itself
      flex: 1,
  },
  scrollContainer: { // Style for the CONTENT *inside* the ScrollView
      padding: 15,
      paddingBottom: 20, // Consistent padding
  },
  instructionText: {
    fontSize: 16,
    color: darkGrey, // Use darker grey for instructions
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionCard: { // Simplified Card Style (Wrapper View)
    backgroundColor: cardBackgroundColor,
    borderRadius: 12,
    marginBottom: 15, // Consistent spacing
    borderWidth: 1.5, // Use border for selection indication primarily
    borderColor: lightGrey, // Default border color
    overflow: 'hidden', // Clip content
    // NO SHADOW
  },
  selectedOptionCard: { // Style applied to the card View when selected
    borderColor: primaryColor,
    backgroundColor: lighterBlueBackground, // Highlight background
  },
  optionContentRow: { // The TouchableOpacity content inside the card
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Internal padding for content row
    paddingHorizontal: 18,
    minHeight: 70,
  },
  optionIcon: {
    marginRight: 18,
    width: 25, // Keep consistent size
    textAlign: 'center',
  },
  optionTextContainer: {
       flex: 1,
       marginRight: 10,
   },
  optionLabel: {
    fontSize: 16, // Standard label size
    fontWeight: '500',
    color: textColor,
    marginBottom: 3,
  },
  selectedOptionLabel: {
      fontWeight: '600', // Make selected label bolder
      color: primaryColor, // Use primary color for selected text
  },
  optionDescription: {
      fontSize: 13, // Slightly smaller description
      color: darkGrey, // Use darker grey
  },
  // Radio Button Styles (like Parental Controls ASD selection)
  radioOuter: {
      height: 22, width: 22, borderRadius: 11,
      borderWidth: 2, borderColor: mediumGrey, // Use medium grey border
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 'auto', // Push to the right
   },
  radioOuterSelected: { borderColor: primaryColor },
  radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: primaryColor },
  // Removed checkIcon style

  helperTextContainer: {
    marginTop: 15, // Space above helper
    paddingVertical: 15,
    paddingHorizontal: 10,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed borders, simpler design
    marginBottom: 10, // Space below helper text before clear button
  },
  helperText: {
    color: darkGrey, // Use darker grey
    fontSize: 14, // Standard helper text size
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      alignSelf: 'center',
      marginTop: 10, // Margin above clear button
  },
  clearButtonText: {
      fontSize: 14,
      color: darkGrey, // Use darker grey
      fontWeight: '500', // Match reset button style
      textDecorationLine: 'underline',
  },
  clearIcon: {
      marginRight: 6,
      color: darkGrey, // Match text color
  },
   buttonDisabled: { // Style for disabled elements (like reset/clear button text)
       // Applied via textDisabled style
   },
   textDisabled: { // Style for text within a disabled element (e.g., reset button)
       color: mediumGrey,
       textDecorationLine: 'none',
   }
});

export default SelectionModeScreen;