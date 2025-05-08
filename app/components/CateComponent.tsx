// src/components/CateComponent.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform, TouchableOpacity
} from 'react-native';
import axios from 'axios'; // Ensure axios is installed
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Component Props Interface ---
interface CateComponentProps {
  keyword: string;                    // Display text (potentially translated name of the category)
  iconKeywordForArasaac: string;    // Original English keyword for Arasaac icon search (e.g., "Food", "Animals")
  languageForArasaac: string;       // Language to use for Arasaac API (e.g., 'en')
  isSelected?: boolean;             // Optional: to highlight if selected
  onPress?: () => void;             // Callback when pressed (SymbolGrid passes original name via closure)
}

// --- Component ---
const CateComponent: React.FC<CateComponentProps> = React.memo(({
    keyword, // This is the displayText (e.g., "Food" or its Dzongkha translation)
    iconKeywordForArasaac,    // Original English keyword for Arasaac icon (e.g., "Food")
    languageForArasaac,       // Language for Arasaac API (e.g., "en")
    isSelected = false,
    onPress
}) => {
  // --- Appearance Context ---
  const { theme, fonts } = useAppearance();

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts, isSelected), [theme, fonts, isSelected]);

  // --- State for pictogram ---
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false); // Track if fetch was tried

  // Ref to track mounted status
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; // Set true on mount
    return () => {
      isMountedRef.current = false; // Set false on unmount
    };
  }, []); // Empty dependency array, runs only on mount and unmount


  // --- Effect to fetch pictogram ---
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Reset state when keyword or language changes
    setPictogramUrl(null);
    setLoading(true);
    setFetchAttempted(false);

    // Skip fetch for special keywords (use iconKeywordForArasaac for this logic as it's the stable English term)
    // or if iconKeywordForArasaac is empty
    if (!iconKeywordForArasaac ||
        iconKeywordForArasaac.toLowerCase() === 'contextual' ||
        iconKeywordForArasaac.toLowerCase() === 'custom') {
        if (isMountedRef.current) setLoading(false); // Stop loading as no fetch will occur
        return;
    }

    let timer: NodeJS.Timeout | null = null;

    const fetchPictogram = async () => {
      if (!isMountedRef.current) return; // Check before async operation

      setFetchAttempted(true); // Mark that we are attempting the fetch
      // Use languageForArasaac and iconKeywordForArasaac for the Arasaac API call
      const searchUrl = `https://api.arasaac.org/api/pictograms/${languageForArasaac}/search/${encodeURIComponent(iconKeywordForArasaac)}`;
      try {
        const response = await axios.get(searchUrl);
        if (isMountedRef.current) {
            const pictogramId = response.data?.[0]?._id;
            if (pictogramId) {
              const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_300.png`;
              setPictogramUrl(generatedUrl);
            } else {
               setPictogramUrl(null); // Explicitly set to null if not found
            }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
            console.error(`CateComponent: Arasaac fetch error for '${iconKeywordForArasaac}':`, err.message);
            setPictogramUrl(null); // Set to null on error
        }
      } finally {
        if (isMountedRef.current) {
            setLoading(false); // Stop loading indicator
        }
      }
    };

    // Debounce fetch slightly
    timer = setTimeout(fetchPictogram, 50);

    // Cleanup function
    return () => {
        if (timer) clearTimeout(timer); // Clear timer if component unmounts
    };
  }, [iconKeywordForArasaac, languageForArasaac]); // Rerun effect if these specific props change

  // --- Press Handler ---
  const handlePress = () => {
    if (onPress) {
      onPress(); // The onPress from SymbolGrid already knows the original category name
    }
  };

  // --- Determine Icon Color ---
  const iconColor = isSelected ? theme.primary : theme.textSecondary;

  return (
    <TouchableOpacity
        style={styles.cateComponent}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Category: ${keyword}${isSelected ? ', selected' : ''}`} // 'keyword' is the display text
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
    >
        <View style={styles.iconContainer}>
            {loading && fetchAttempted && ( // Show loader only while loading AND fetch was attempted
                <ActivityIndicator size="small" color={theme.textSecondary} />
            )}
            {!loading && pictogramUrl && ( // Show image if loaded and URL exists
                <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} resizeMode="contain"/>
            )}
            {/* Show folder icon if NOT loading AND (no URL OR fetch wasn't needed/attempted for special keywords) */}
            {!loading && (!pictogramUrl || !fetchAttempted && (iconKeywordForArasaac.toLowerCase() === 'contextual' || iconKeywordForArasaac.toLowerCase() === 'custom')) && (
                <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />
            )}
             {/* Show folder icon if NOT loading AND (no URL after an attempted fetch failed for regular keywords) */}
            {!loading && !pictogramUrl && fetchAttempted && iconKeywordForArasaac.toLowerCase() !== 'contextual' && iconKeywordForArasaac.toLowerCase() !== 'custom' && (
                <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />
            )}
        </View>
        <Text style={styles.keywordText} numberOfLines={2} ellipsizeMode="tail">
            {keyword} {/* This 'keyword' prop is the display text (e.g., "Food" or its translation) */}
        </Text>
        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={iconColor} style={styles.chevronIcon} />
    </TouchableOpacity>
  );
});

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, isSelected: boolean) => StyleSheet.create({
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
    width: '85%', // Relative to iconContainer
    height: '85%', // Relative to iconContainer
  },
  keywordText: {
    flex: 1,
    fontSize: fonts.body,
    fontWeight: isSelected ? '600' : '500',
    color: isSelected ? theme.primary : theme.text,
    textAlign: 'left',
  },
  chevronIcon: {
    marginLeft: 10,
  },
});

export default CateComponent;