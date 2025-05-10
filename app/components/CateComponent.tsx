// src/components/CateComponent.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform, TouchableOpacity
} from 'react-native';
import axios from 'axios'; // Ensure axios is installed
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path if needed

// --- Component Props Interface ---
interface CateComponentProps {
  keyword: string;                    // Display text (potentially translated name of the category)
  iconKeywordForArasaac: string;    // Original English keyword for Arasaac icon search
  languageForArasaac: string;       // Language to use for Arasaac API (e.g., 'en')
  isSelected?: boolean;
  onPress?: () => void;
}

// --- Component ---
const CateComponent: React.FC<CateComponentProps> = React.memo(({
    keyword, // This is the displayText
    iconKeywordForArasaac,
    languageForArasaac,
    isSelected = false,
    onPress
}) => {
  // --- Hooks ---
  const { theme, fonts } = useAppearance();
  const { t, i18n } = useTranslation(); // <-- Get t function and i18n instance
  const currentLanguage = i18n.language; // Get current language

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts, isSelected, currentLanguage), [theme, fonts, isSelected, currentLanguage]);

  // --- State for pictogram ---
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Effect to fetch pictogram (logic remains the same)
  useEffect(() => {
    if (!isMountedRef.current) return;
    setPictogramUrl(null); setLoading(true); setFetchAttempted(false);

    if (!iconKeywordForArasaac || iconKeywordForArasaac.toLowerCase() === 'contextual' || iconKeywordForArasaac.toLowerCase() === 'custom') {
        if (isMountedRef.current) setLoading(false);
        return;
    }

    let timer: NodeJS.Timeout | null = null;
    const fetchPictogram = async () => {
      if (!isMountedRef.current) return;
      setFetchAttempted(true);
      const searchUrl = `https://api.arasaac.org/api/pictograms/${languageForArasaac}/search/${encodeURIComponent(iconKeywordForArasaac)}`;
      try {
        const response = await axios.get(searchUrl);
        if (isMountedRef.current) {
            const pictogramId = response.data?.[0]?._id;
            if (pictogramId) {
              setPictogramUrl(`https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_300.png`);
            } else { setPictogramUrl(null); }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
            console.error(`CateComponent: Arasaac fetch error for '${iconKeywordForArasaac}':`, err.message);
            setPictogramUrl(null);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    timer = setTimeout(fetchPictogram, 50);
    return () => { if (timer) clearTimeout(timer); };
  }, [iconKeywordForArasaac, languageForArasaac]);

  // --- Press Handler (unchanged) ---
  const handlePress = () => {
    if (onPress) onPress();
  };

  // --- Determine Icon Color (unchanged) ---
  const iconColor = isSelected ? theme.primary : theme.textSecondary;

  // --- Accessibility Label ---
  const accessibilityLabelText = isSelected
    ? t('cateComponent.selectedAccessibilityLabel', { category: keyword })
    : t('cateComponent.accessibilityLabel', { category: keyword });

  return (
    <TouchableOpacity
        style={styles.cateComponent}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabelText}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
    >
        <View style={styles.iconContainer}>
            {loading && fetchAttempted && ( <ActivityIndicator size="small" color={theme.textSecondary} /> )}
            {!loading && pictogramUrl && ( <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} resizeMode="contain"/> )}
            {!loading && (!pictogramUrl || !fetchAttempted && (iconKeywordForArasaac.toLowerCase() === 'contextual' || iconKeywordForArasaac.toLowerCase() === 'custom')) && ( <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} /> )}
            {!loading && !pictogramUrl && fetchAttempted && iconKeywordForArasaac.toLowerCase() !== 'contextual' && iconKeywordForArasaac.toLowerCase() !== 'custom' && ( <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} /> )}
        </View>
        <Text style={styles.keywordText} numberOfLines={2} ellipsizeMode="tail">
            {keyword}
        </Text>
        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={iconColor} style={styles.chevronIcon} />
    </TouchableOpacity>
  );
});

// --- Styles ---
const createThemedStyles = (
    theme: ThemeColors,
    fonts: FontSizes,
    isSelected: boolean,
    currentLanguage: string // <-- Added currentLanguage
) => {
  // Get language-specific styles for the body text (used for keywordText)
  const bodyTextStyles = getLanguageSpecificTextStyle(
    'body', // Type of text (matches 'body' in DZONGKHA_TYPOGRAPHY_ADJUSTMENTS)
    fonts,  // Base font sizes from context
    currentLanguage
  );

  return StyleSheet.create({
    cateComponent: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isSelected ? theme.primaryMuted : theme.card,
      paddingVertical: 12,
      paddingHorizontal: 15,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      backgroundColor: isSelected ? theme.primaryMuted : theme.background,
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    symbolImage: {
      width: '85%',
      height: '85%',
    },
    keywordText: {
      flex: 1,
      ...bodyTextStyles, // Apply language-specific font family, size, and line height
      fontWeight: isSelected ? '600' : '500',
      color: isSelected ? theme.primary : theme.text,
      textAlign: 'left',
    },
    chevronIcon: {
      marginLeft: 10,
    },
  });
};

export default CateComponent;