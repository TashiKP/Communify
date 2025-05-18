import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { FontSizes, ThemeColors } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';


interface HeaderProps {
  onClose: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  isSaveDisabled: boolean;
  theme: ThemeColors;
  fonts: FontSizes;
  currentLanguage: string;
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const Header: React.FC<HeaderProps> = ({
  onClose,
  onSave,
  isSaving,
  isSaveDisabled,
  theme,
  fonts,
  currentLanguage,
}) => {
  const { t } = useTranslation();
  const styles = createStyles(theme, fonts, currentLanguage);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onClose}
        hitSlop={hitSlop}
        accessibilityLabel={t('common.goBack')}
        accessibilityRole="button"
      >
        <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.7} color={theme.white} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.white }]}>{t('displayOptions.title')}</Text>
      </View>
      <TouchableOpacity
        style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isSaveDisabled}
        hitSlop={hitSlop}
        accessibilityLabel={t('common.saveSettings')}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSaveDisabled }}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={theme.white} />
        ) : (
          <FontAwesomeIcon
            icon={faSave}
            size={fonts.h2 * 0.7}
            color={isSaveDisabled ? theme.disabled : theme.white}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
    header: {
      backgroundColor: theme.primary,
      paddingTop: Platform.OS === 'android' ? 10 : 0,
      paddingBottom: 12,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    title: {
      ...getLanguageSpecificTextStyle('h2', fonts, currentLanguage),
      fontSize: fonts.h2 || 20,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.white,
    },
    headerButton: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });

export default Header;