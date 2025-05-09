// src/components/SelectionModeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faArrowsUpDown, faHandPointer,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Context Hooks ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// Define the possible selection modes
export type Mode = 'drag' | 'longClick';

// --- Interface for the component's props ---
export interface SelectionModeScreenProps {
  initialMode?: Mode | null;
  onSave: (mode: Mode | null) => Promise<void> | void;
  onClose: () => void;
}

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Component ---
const SelectionModeScreen: React.FC<SelectionModeScreenProps> = ({
  initialMode: initialPropMode = 'drag',
  onSave,
  onClose,
}) => {
  // --- Hooks ---
  const { theme, fonts, isLoadingAppearance } = useAppearance();
  const { t } = useTranslation(); // <-- Use the translation hook

  // --- State ---
  const [selectedMode, setSelectedMode] = useState<Mode | null>(initialPropMode);
  const [originalMode, setOriginalMode] = useState<Mode | null>(initialPropMode);
  const [isSaving, setIsSaving] = useState(false);

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

  // --- Effects ---
  useEffect(() => {
     setSelectedMode(initialPropMode);
     setOriginalMode(initialPropMode);
     setIsSaving(false);
  }, [initialPropMode]);

  // --- Memos ---
  const hasChanged = useMemo(() => selectedMode !== originalMode, [selectedMode, originalMode]);

  // --- Handlers ---
  const handleSelectOption = (mode: Mode) => {
      setSelectedMode(mode);
  };

  const handleClearSelection = () => {
      setSelectedMode(null);
  };

  const handleSave = async () => {
     if (!hasChanged || isSaving) {
         if (!hasChanged) onClose();
         return;
     }
     setIsSaving(true);
     try {
        await onSave(selectedMode);
        setOriginalMode(selectedMode);
        onClose();
     } catch(error) {
        console.error("Failed to save selection mode:", error);
        Alert.alert(t('common.error'), t('selectionMode.errors.saveFail')); // Use t()
        setIsSaving(false);
     }
  };

  const handleAttemptClose = useCallback(() => {
    if (hasChanged) {
      Alert.alert(
        t('selectionMode.unsavedChangesTitle'), // Use t()
        t('selectionMode.unsavedChangesMessage'), // Use t()
        [
            { text: t('common.cancel'), style: "cancel" }, // Use t()
            { text: t('common.discard'), style: "destructive", onPress: onClose } // Use t()
        ]
      );
    } else {
        onClose();
    }
  }, [hasChanged, onClose, t]); // Add t to dependencies

  // Get helper text based on the currently selected mode
  const getHelperText = () => {
    switch (selectedMode) {
      case 'drag': return t('selectionMode.helperDrag'); // Use t()
      case 'longClick': return t('selectionMode.helperTap'); // Use t()
      default: return t('selectionMode.helperDefault'); // Use t()
    }
  };

  // --- Data for Selection Options ---
  // Labels and descriptions will now use t()
  const selectionOptions = useMemo(() => [
      { type: 'drag' as Mode, labelKey: 'selectionMode.dragLabel', icon: faArrowsUpDown, descriptionKey: 'selectionMode.dragDescription' },
      { type: 'longClick' as Mode, labelKey: 'selectionMode.tapLabel', icon: faHandPointer, descriptionKey: 'selectionMode.tapDescription' },
  ], []); // Empty dependency array as keys are static

  // --- Determine Button States ---
  const isLoading = isLoadingAppearance || isSaving;
  const isSaveDisabled = !hasChanged || isLoading;
  const isClearDisabled = selectedMode === null || isLoading;

  // --- Render ---
   if (isLoadingAppearance) {
      return (
          <SafeAreaView style={styles.safeArea}>
              <View style={[styles.container, styles.loadingContainer]}>
                   <ActivityIndicator size="large" color={theme.primary} />
                   <Text style={[styles.instructionText, { marginTop: 15 }]}>{t('selectionMode.loading')}</Text>
               </View>
          </SafeAreaView>
       );
   }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop} accessibilityLabel={t('common.goBack')}>
                <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{t('selectionMode.title')}</Text>
              </View>
              <TouchableOpacity
                 style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                 onPress={handleSave}
                 disabled={isSaveDisabled}
                 hitSlop={hitSlop}
                 accessibilityLabel={t('common.save')}
                 accessibilityState={{disabled: isSaveDisabled}}
               >
                 {isSaving
                    ? <ActivityIndicator size="small" color={theme.white}/>
                    : <FontAwesomeIcon icon={faSave} size={fonts.h2 * 0.9} color={!isSaveDisabled ? theme.white : theme.disabled} />
                 }
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

                <Text style={styles.instructionText}>
                    {t('selectionMode.instruction')}
                </Text>

                {selectionOptions.map((option) => {
                    const isSelected = selectedMode === option.type;
                    const iconColor = isSelected ? theme.primary : theme.textSecondary;
                    const descriptionColor = isSelected ? theme.textSecondary : theme.disabled;
                    const label = t(option.labelKey); // Get translated label
                    const description = t(option.descriptionKey); // Get translated description

                    return (
                        <View key={option.type} style={[ styles.sectionCard, isSelected && styles.selectedOptionCard ]}>
                            <TouchableOpacity
                                style={styles.optionContentRow}
                                onPress={() => handleSelectOption(option.type)}
                                activeOpacity={0.7}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isSelected }}
                                // Use translated label and description for accessibility
                                accessibilityLabel={t('selectionMode.optionAccessibilityLabel', { label, description })}
                                disabled={isLoading}
                            >
                                <FontAwesomeIcon
                                    icon={option.icon}
                                    size={fonts.h1 * 0.9}
                                    color={iconColor}
                                    style={styles.optionIcon}
                                />
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>
                                        {label}
                                    </Text>
                                    <Text style={[styles.optionDescription, { color: descriptionColor }]}>
                                        {description}
                                    </Text>
                                </View>
                                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <View style={styles.helperTextContainer}>
                    <Text style={styles.helperText}>{getHelperText()}</Text>
                </View>

                {selectedMode !== null && (
                    <TouchableOpacity
                        style={[styles.clearButton, isClearDisabled && styles.buttonDisabled]}
                        onPress={handleClearSelection}
                        hitSlop={hitSlop}
                        disabled={isClearDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={t('selectionMode.clearAccessibilityLabel')}
                    >
                        <FontAwesomeIcon icon={faTimesCircle} size={fonts.caption * 1.1} color={theme.textSecondary} style={styles.clearIcon}/>
                        <Text style={styles.clearButtonText}>{t('selectionMode.clearButtonText')}</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    </SafeAreaView>
  );
};

// --- Styles (Unchanged) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.primary },
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, },
  header: { backgroundColor: theme.primary, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)', },
  titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
  title: { fontSize: fonts.h2, fontWeight: '600', color: theme.white, textAlign: 'center', },
  headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
  scrollView: { flex: 1, },
  scrollContainer: { padding: 15, paddingBottom: 40, },
  instructionText: { fontSize: fonts.body, color: theme.textSecondary, marginBottom: 25, textAlign: 'center', fontWeight: '500', lineHeight: fonts.body * 1.4, },
  sectionCard: { backgroundColor: theme.card, borderRadius: 12, marginBottom: 15, borderWidth: 1.5, borderColor: theme.border, overflow: 'hidden', },
  selectedOptionCard: { borderColor: theme.primary, backgroundColor: theme.primaryMuted, },
  optionContentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 18, minHeight: 70, },
  optionIcon: { marginRight: 18, width: fonts.h1 * 0.9, textAlign: 'center', },
  optionTextContainer: { flex: 1, marginRight: 10, },
  optionLabel: { fontSize: fonts.label, fontWeight: '600', color: theme.text, marginBottom: 3, },
  selectedOptionLabel: { color: theme.primary, },
  optionDescription: { fontSize: fonts.caption, lineHeight: fonts.caption * 1.4, },
  radioOuter: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', backgroundColor: theme.card },
  radioOuterSelected: { borderColor: theme.primary },
  radioInner: { height: 12, width: 12, borderRadius: 6, backgroundColor: theme.primary },
  helperTextContainer: { marginTop: 15, paddingVertical: 15, paddingHorizontal: 10, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10, },
  helperText: { color: theme.textSecondary, fontSize: fonts.caption, textAlign: 'center', lineHeight: fonts.caption * 1.4, },
  clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 15, alignSelf: 'center', marginTop: 10, },
  clearButtonText: { fontSize: fonts.label, color: theme.textSecondary, fontWeight: '500', textDecorationLine: 'underline', },
  clearIcon: { marginRight: 6, },
  buttonDisabled: { opacity: 0.5, },
});

export default SelectionModeScreen;