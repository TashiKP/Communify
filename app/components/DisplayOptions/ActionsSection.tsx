import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { FontSizes, ThemeColors } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';


interface ActionsSectionProps {
  onReset: () => void;
  isResetDisabled: boolean;
  theme: ThemeColors;
  fonts: FontSizes;
  currentLanguage: string;
}

const ActionsSection: React.FC<ActionsSectionProps> = ({
  onReset,
  isResetDisabled,
  theme,
  fonts,
  currentLanguage,
}) => {
  const { t } = useTranslation();
  const styles = createStyles(theme, fonts, currentLanguage);

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
        onPress={onReset}
        disabled={isResetDisabled}
        accessibilityRole="button"
        accessibilityLabel={t('common.resetChanges')}
        accessibilityState={{ disabled: isResetDisabled }}
      >
        <FontAwesomeIcon
          icon={faUndo}
          size={fonts.body * 1.1}
          color={isResetDisabled ? theme.disabled : theme.textSecondary}
          style={styles.buttonIcon}
        />
        <Text
          style={[
            styles.resetButtonText,
            { color: isResetDisabled ? theme.disabled : theme.textSecondary },
            isResetDisabled && styles.textDisabled,
          ]}
        >
          {t('common.resetChanges')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
    actionsContainer: {
      marginTop: 25,
      alignItems: 'center',
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    resetButtonText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '500',
      textDecorationLine: 'underline',
      color: theme.textSecondary,
    },
    buttonIcon: {
      marginRight: 6,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    textDisabled: {
      textDecorationLine: 'none',
    },
  });

export default ActionsSection;