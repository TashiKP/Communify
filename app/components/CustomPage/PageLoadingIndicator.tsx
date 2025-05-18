// src/components/CustomPage/PageLoadingIndicator.tsx
import React, {useMemo} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {ThemeColors, FontSizes} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';
import {useTranslation} from 'react-i18next';

interface PageLoadingIndicatorProps {
  message: string;
  theme: ThemeColors;
  fonts: FontSizes;
}

const createStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  language: string,
) => {
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, language);
  return StyleSheet.create({
    loadingOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background, // Use page background
    },
    loadingText: {
      ...bodyStyles,
      fontWeight: '500',
      marginTop: 12,
      textAlign: 'center',
      color: theme.textSecondary,
    },
  });
};

const PageLoadingIndicator: React.FC<PageLoadingIndicatorProps> = ({
  message,
  theme,
  fonts,
}) => {
  const {i18n} = useTranslation(); // Only for language, message is passed directly
  const styles = useMemo(
    () => createStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language],
  );

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

export default PageLoadingIndicator;
