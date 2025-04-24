// src/components/CateComponent.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform, TouchableOpacity
} from 'react-native';
import axios from 'axios'; // Ensure axios is installed: npm install axios
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Component Props Interface ---
interface CateComponentProps {
  keyword: string; // The category name to display and fetch icon for
  language: string;
  isSelected?: boolean; // Optional: to highlight if selected
  onPress?: (categoryKeyword: string) => void; // Callback when pressed
}

// --- Component ---
const CateComponent: React.FC<CateComponentProps> = ({
    keyword,
    language,
    isSelected = false,
    onPress
}) => {
  // --- Appearance Context ---
  const { theme, fonts } = useAppearance();

  // --- Dynamic Styles ---
  // Memoize styles to recalculate only when theme, fonts, or isSelected changes
  const styles = useMemo(() => createThemedStyles(theme, fonts, isSelected), [theme, fonts, isSelected]);

  // --- State for pictogram ---
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false); // Track if fetch was tried

  // --- Effect to fetch pictogram ---
  useEffect(() => {
    // Reset state when keyword or language changes
    setPictogramUrl(null);
    setLoading(true);
    setFetchAttempted(false); // Reset fetch attempt flag

    // Skip fetch for special keywords or if keyword is empty
    if (!keyword || keyword.toLowerCase() === 'contextual') {
        setLoading(false);
        return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchPictogram = async () => {
      setFetchAttempted(true); // Mark that we are attempting the fetch
      const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
      try {
        const response = await axios.get(searchUrl);
        if (isMounted) {
            const pictogramId = response.data?.[0]?._id;
            if (pictogramId) {
              const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_300.png`;
              setPictogramUrl(generatedUrl);
            } else {
               setPictogramUrl(null); // Explicitly set to null if not found
            }
        }
      } catch (err: any) {
        if (isMounted) {
            setPictogramUrl(null); // Set to null on error
        }
      } finally {
        if (isMounted) {
            setLoading(false); // Stop loading indicator
        }
      }
    };

    // Debounce or delay fetch slightly? Not strictly necessary here.
    fetchPictogram();

    // Cleanup function
    return () => {
        isMounted = false;
    };
  }, [keyword, language]); // Rerun effect if keyword or language changes

  // --- Press Handler ---
  const handlePress = () => {
    if (onPress) {
      onPress(keyword);
    }
  };

  // --- Determine Icon Color ---
  // Use theme colors based on selection state
  const iconColor = isSelected ? theme.primary : theme.textSecondary;

  return (
    <TouchableOpacity
        style={styles.cateComponent} // Apply themed styles
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Category: ${keyword}${isSelected ? ', selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
    >
        <View style={styles.iconContainer}>
            {loading && fetchAttempted && ( // Show loader only while loading AND fetch was attempted
                <ActivityIndicator size="small" color={theme.textSecondary} />
            )}
            {!loading && pictogramUrl && ( // Show image if loaded and URL exists
                <Image source={{ uri: pictogramUrl }} style={styles.symbolImage}/>
            )}
            {/* Show folder icon if NOT loading AND (no URL OR fetch wasn't needed/attempted) */}
            {!loading && (!pictogramUrl || !fetchAttempted) && (
                <FontAwesomeIcon icon={faFolder} size={fonts.h2} color={iconColor} />
            )}
        </View>
        <Text style={styles.keywordText} numberOfLines={2} ellipsizeMode="tail">
            {keyword}
        </Text>
        {/* Use theme color for chevron */}
        <FontAwesomeIcon icon={faChevronRight} size={fonts.label} color={iconColor} style={styles.chevronIcon} />
    </TouchableOpacity>
  );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, isSelected: boolean) => StyleSheet.create({
  cateComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isSelected ? theme.primaryMuted : theme.card, // Use theme colors based on selection
    paddingVertical: 12,
    paddingHorizontal: 15,
    // Border handled by separator in parent list usually
  },
  // selectedCateComponent style merged into cateComponent now
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: isSelected ? theme.primaryMuted : theme.background, // Use theme background/muted color
    borderRadius: 6,
    overflow: 'hidden', // Keep image contained
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border, // Add subtle border
  },
  symbolImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  keywordText: {
    flex: 1,
    fontSize: fonts.body, // Use font size from context
    fontWeight: isSelected ? '600' : '500', // Adjust weight based on selection
    color: isSelected ? theme.primary : theme.text, // Use theme colors based on selection
    textAlign: 'left',
  },
  // selectedKeywordText styles merged into keywordText now
  chevronIcon: {
    marginLeft: 10,
  },
});

export default React.memo(CateComponent);