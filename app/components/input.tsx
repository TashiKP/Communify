import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Animated, Easing } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faVolumeUp, faBackspace, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';

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
const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

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
  const { t } = useTranslation();

  // --- Animation States ---
  const speakScale = React.useRef(new Animated.Value(1)).current;
  const backspaceScale = React.useRef(new Animated.Value(1)).current;
  const clearScale = React.useRef(new Animated.Value(1)).current;

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

  // --- Determine Icon Colors Based on Theme and Disabled State ---
  const iconColorActive = theme.white;
  const iconColorInactive = theme.disabled;

  const speakIconColor = isSpeakDisabled ? iconColorInactive : iconColorActive;
  const backspaceIconColor = isBackspaceDisabled ? iconColorInactive : iconColorActive;
  const clearIconColor = isClearDisabled ? iconColorInactive : iconColorActive;

  const iconSize = fonts.h2 * 1.2;
  const smallIconSize = fonts.h2 * 0.9;

  // --- Animation Handler ---
  const animatePress = (scale: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => callback && callback());
  };

  // --- Render Children Safely ---
  const renderInputContent = () => {
    if (!children) {
      return <Text style={styles.placeholderText}>{t('iconInput.placeholder')}</Text>;
    }
    if (typeof children === 'string') {
      return <Text style={styles.inputText}>{children}</Text>;
    }
    return children;
  };

  return (
    <View style={styles.container}>
      {/* Left Action Button (Speak) */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => animatePress(speakScale, onSpeakPress)}
          disabled={isSpeakDisabled}
          accessibilityLabel={t('iconInput.speakAccessibilityLabel')}
          accessibilityHint={t('iconInput.speakAccessibilityHint')}
          accessibilityState={{ disabled: isSpeakDisabled }}
          hitSlop={hitSlop}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: speakScale }] }}>
            <FontAwesomeIcon icon={faVolumeUp} size={iconSize} color={speakIconColor} />
          </Animated.View>
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
          {renderInputContent()}
        </ScrollView>
      </View>

      {/* Right Action Buttons (Backspace, Clear) */}
      <View style={[styles.actionSection, styles.actionSectionRight]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => animatePress(backspaceScale, onBackspacePress)}
          disabled={isBackspaceDisabled}
          accessibilityLabel={t('iconInput.backspaceAccessibilityLabel')}
          accessibilityHint={t('iconInput.backspaceAccessibilityHint')}
          accessibilityState={{ disabled: isBackspaceDisabled }}
          hitSlop={hitSlop}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: backspaceScale }] }}>
            <FontAwesomeIcon icon={faBackspace} size={iconSize} color={backspaceIconColor} />
          </Animated.View>
        </TouchableOpacity>
        <View style={styles.buttonSpacer} />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => animatePress(clearScale, onClearPress)}
          disabled={isClearDisabled}
          accessibilityLabel={t('iconInput.clearAccessibilityLabel')}
          accessibilityHint={t('iconInput.clearAccessibilityHint')}
          accessibilityState={{ disabled: isClearDisabled }}
          hitSlop={hitSlop}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: clearScale }] }}>
            <FontAwesomeIcon icon={faTrash} size={smallIconSize} color={clearIconColor} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: theme.primary,
      minHeight: Platform.select({ ios: 72, default: 68 }),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
      paddingVertical: 8,
    },
    actionSection: {
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionSectionRight: {
      flexDirection: 'row',
      paddingRight: 18,
    },
    inputArea: {
      flex: 1,
      backgroundColor: theme.card,
      marginVertical: 8,
      marginHorizontal: 8,
      borderRadius: 10,
      overflow: 'hidden',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      elevation: 3,
      shadowColor: theme.isDark ? '#000' : '#333',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    inputContentContainer: {
      flexGrow: 1,
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    iconButton: {
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    buttonSpacer: {
      width: 12,
    },
    placeholderText: {
      color: theme.disabled,
      fontSize: fonts.body,
      fontStyle: 'italic',
      lineHeight: fonts.body * 1.4,
    },
    inputText: {
      color: theme.text,
      fontSize: fonts.body,
      lineHeight: fonts.body * 1.4,
    },
  });

export default IconInputComponent;