// src/components/IconInputComponent.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faVolumeUp,
  faBackspace,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Props ---
interface IconInputComponentProps {
  onSpeakPress?: () => void;
  onBackspacePress?: () => void;
  onClearPress?: () => void;
  children?: React.ReactNode;
  isSpeakDisabled?: boolean;
  isBackspaceDisabled?: boolean;
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
  // --- Hooks ---
  const { theme, fonts } = useAppearance();
  const { t } = useTranslation(); // <-- Use the translation hook

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

  // --- Determine Icon Colors Based on Theme and Disabled State ---
  const iconColorActive = theme.white;
  const iconColorInactive = theme.disabled;

  const speakIconColor = isSpeakDisabled ? iconColorInactive : iconColorActive;
  const backspaceIconColor = isBackspaceDisabled ? iconColorInactive : iconColorActive;
  const clearIconColor = isClearDisabled ? iconColorInactive : iconColorActive;

  const iconSize = fonts.h2 * 1.1;
  const smallIconSize = fonts.h2;

  return (
    <View style={styles.container}>
      {/* Left Action Button (Speak) */}
      <View style={styles.actionSection}>
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onSpeakPress}
            disabled={isSpeakDisabled}
            accessibilityLabel={t('iconInput.speakAccessibilityLabel')} // Use t()
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
            {children ? children : <Text style={styles.placeholderText}>{t('iconInput.placeholder')}</Text>} {/* Use t() */}
        </ScrollView>
      </View>

      {/* Right Action Buttons (Backspace, Clear) */}
      <View style={[styles.actionSection, styles.actionSectionRight]}>
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onBackspacePress}
            disabled={isBackspaceDisabled}
            accessibilityLabel={t('iconInput.backspaceAccessibilityLabel')} // Use t()
            accessibilityState={{ disabled: isBackspaceDisabled }}
            hitSlop={hitSlop}
        >
          <FontAwesomeIcon icon={faBackspace} size={iconSize} color={backspaceIconColor} />
        </TouchableOpacity>
        <View style={styles.buttonSpacer} />
        <TouchableOpacity
            style={styles.iconButton}
            onPress={onClearPress}
            disabled={isClearDisabled}
            accessibilityLabel={t('iconInput.clearAccessibilityLabel')} // Use t()
            accessibilityState={{ disabled: isClearDisabled }}
            hitSlop={hitSlop}
        >
          <FontAwesomeIcon icon={faTrash} size={smallIconSize} color={clearIconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles (Unchanged) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'stretch', width: '100%', backgroundColor: theme.primary, minHeight: Platform.select({ ios: 70, default: 65 }), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', },
  actionSection: { paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', },
  actionSectionRight: { flexDirection: 'row', paddingRight: 20, },
  inputArea: { flex: 1, backgroundColor: theme.card, marginVertical: 6, marginHorizontal: 0, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, },
  inputContentContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 12, },
  iconButton: { padding: 8, justifyContent: 'center', alignItems: 'center', },
  buttonSpacer: { width: 15, },
  placeholderText: { color: theme.disabled, fontSize: fonts.body, fontStyle: 'italic', },
});

export default IconInputComponent;