// src/components/ParentalControls/ParentalControlsHeader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft, faSave} from '@fortawesome/free-solid-svg-icons';
import {
  FontSizes,
  ThemeColors,
  useAppearance,
} from '../../context/AppearanceContext'; // Adjust path
import {getLanguageSpecificTextStyle} from '../../styles/typography'; // Adjust path
import {TFunction} from 'i18next';
import {useTranslation} from 'react-i18next'; // <--- CORRECTED IMPORT

const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};

interface ParentalControlsHeaderProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSaveDisabled: boolean;
  isSaving: boolean;
  t: TFunction;
}

const ParentalControlsHeader: React.FC<ParentalControlsHeaderProps> = ({
  title,
  onClose,
  onSave,
  isSaveDisabled,
  isSaving,
  t,
}) => {
  const {theme, fonts} = useAppearance();
  const {i18n} = useTranslation(); // This hook is now correctly imported
  const currentLanguage = i18n.language;

  const styles = React.useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage],
  );

  // ... rest of the component remains the same
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onClose}
        hitSlop={hitSlop}
        accessibilityLabel={t('common.goBack')}>
        <FontAwesomeIcon
          icon={faArrowLeft}
          size={(fonts.h2 || 20) * 0.9}
          color={theme.white}
        />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity
        style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isSaveDisabled}
        hitSlop={hitSlop}
        accessibilityLabel={t('common.saveSettings')}
        accessibilityState={{disabled: isSaveDisabled}}>
        {isSaving ? (
          <ActivityIndicator size="small" color={theme.white} />
        ) : (
          <FontAwesomeIcon
            icon={faSave}
            size={(fonts.h2 || 20) * 0.9}
            color={!isSaveDisabled ? theme.white : theme.disabled || '#ccc'}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) => {
  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
  const h2FontSize = fonts.h2 || 20;
  return StyleSheet.create({
    header: {
      backgroundColor: theme.primary,
      paddingTop: Platform.OS === 'android' ? 10 : 0,
      paddingBottom: 12,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    titleContainer: {flex: 1, alignItems: 'center', marginHorizontal: 5},
    title: {
      ...h2Styles,
      fontSize: h2FontSize,
      fontWeight: '600',
      color: theme.white,
      textAlign: 'center',
    },
    headerButton: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {opacity: 0.5},
  });
};

export default ParentalControlsHeader;
