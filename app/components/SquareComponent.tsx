// src/components/SquareComponent.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform,
    TouchableOpacity
} from 'react-native';
import axios from 'axios'; // Ensure installed
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Component Props Interface ---
interface SquareComponentProps {
  keyword: string;         // Original keyword (for Arasaac, onPress payload etc.)
  displayText: string;   // The text to actually display on the square (pre-translated or original)
  language: string;        // Language for Arasaac API call (e.g., 'en') - This is the language Arasaac expects for its API
  imageUri?: string;      // Optional URI for custom symbols
  onPress: (keyword: string) => void; // Should still send the original keyword
  size: number;            // Prop to determine component size
}

// --- Component ---
const SquareComponent: React.FC<SquareComponentProps> = React.memo(({
  keyword,
  displayText, // Use pre-translated or original text provided by parent
  language,   // For Arasaac API call, expected to be 'en' or similar
  imageUri,
  onPress,
  size,
}) => {
  // --- Hooks ---
  const { theme, fonts } = useAppearance();
  const { t } = useTranslation(); // <-- Get t function

  // --- Dynamic Styles ---
  const styles = useMemo(() => createThemedStyles(theme, fonts, size), [theme, fonts, size]);

  // --- State ---
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!imageUri); // Start loading only if fetching from Arasaac
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>(theme.border); // Default to theme border color

  // Ref to track mounted status
  const isMountedRef = useRef(true);

  // --- Effects ---
  useEffect(() => {
    isMountedRef.current = true; // Set true on mount
    return () => {
      isMountedRef.current = false; // Set false on unmount
    };
  }, []); // Empty dependency array, runs only on mount and unmount

  useEffect(() => {
    // Reset state for Arasaac fetch if needed
    if (!imageUri) {
        if (isMountedRef.current) {
            setPictogramUrl(null);
            setError(null);
            setLoading(true);
        }
    } else {
        if (isMountedRef.current) {
            setLoading(false);
            setError(null);
            setPictogramUrl(null); // Clear any old Arasaac URL if custom image is now provided
        }
    }

    // Generate top bar color based on original keyword hash (consistent)
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) { hash = keyword.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; }
    const colorVal = Math.abs(hash % 16777215);
    const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
    if (isMountedRef.current) {
        setTopBarColor(randomColor);
    }

    // Fetch pictogram only if imageUri is NOT provided
    let timer: NodeJS.Timeout | null = null;
    if (!imageUri) {
        const fetchPictogram = async () => {
            if (!isMountedRef.current) return; // Check before async operation

            const imageSize = 300; // Arasaac image size request
            // Use the 'language' prop for Arasaac API (expected to be 'en' from SymbolGrid)
            // And use 'keyword' (original English keyword) for the search term
            const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
            try {
                const response = await axios.get(searchUrl);
                if (isMountedRef.current) {
                    const pictogramId = response.data?.[0]?._id;
                    if (pictogramId) {
                        const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
                        setPictogramUrl(generatedUrl);
                        setError(null);
                    } else {
                        setError(t('squareComponent.arasaacErrorNotFound')); // Use t() for error message
                        setPictogramUrl(null);
                    }
                }
            } catch (err: any) {
                 if (isMountedRef.current) {
                    setError(err.response?.status === 404 ? t('squareComponent.arasaacErrorNotFound') : t('squareComponent.arasaacErrorLoad')); // Use t()
                    setPictogramUrl(null);
                 }
            } finally {
                 if (isMountedRef.current) {
                    setLoading(false);
                 }
            }
        };
        // Debounce fetch slightly
        timer = setTimeout(fetchPictogram, 50);
    }

    // Cleanup timer if component unmounts before fetch completes or timer fires
    return () => {
        if (timer) clearTimeout(timer);
    };

  }, [keyword, language, imageUri, theme.border, t]); // Added 't' to dependencies for error messages

  // --- Press Handler ---
  const handlePress = () => {
      onPress(keyword); // Send the original keyword
  };

  // --- Accessibility Label ---
  // Use t() for the format string and interpolate displayText
  const accessibilityLabelText = t('squareComponent.accessibilityLabel', { symbol: displayText });


  return (
    <TouchableOpacity
        style={styles.squareContainer}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabelText} // <-- Use translated label format
        accessibilityRole="button"
    >
        <View style={styles.square}>
            {/* Top Bar with dynamic color */}
            <View style={[styles.topBar, { backgroundColor: topBarColor }]} />

            {/* Content Area */}
            <View style={styles.contentArea}>
                {/* Loading Indicator */}
                {loading && (
                    <ActivityIndicator size="small" color={theme.primary} />
                )}
                {/* Custom Image */}
                {!loading && imageUri && !error && (
                     <Image
                        source={{ uri: imageUri }}
                        style={styles.symbolImage}
                        resizeMode="contain"
                        accessibilityLabel="" // Decorative if text label present
                        onError={(e) => {
                            console.warn(`Failed load custom image: ${keyword}`, e.nativeEvent.error);
                            if (isMountedRef.current) setError(t('squareComponent.customImageError')); // Use t()
                        }}
                    />
                )}
                {/* Arasaac Image */}
                {!loading && !imageUri && pictogramUrl && !error && (
                     <Image
                        source={{ uri: pictogramUrl }}
                        style={styles.symbolImage}
                        resizeMode="contain"
                        accessibilityLabel="" // Decorative if text label present
                        onError={() => { if (isMountedRef.current) setError(t('squareComponent.arasaacImageError')); }} // Use t()
                    />
                )}
                {/* Fallback Text/Icon */}
                {!loading && (error || (!imageUri && !pictogramUrl)) && (
                     <View style={styles.fallbackContainer}>
                         {/* If 'error' state contains a translated string, display it. Otherwise, display 'displayText'. */}
                         <Text style={styles.fallbackText} numberOfLines={2} ellipsizeMode="tail">
                            {error && typeof error === 'string' ? error : displayText}
                         </Text>
                     </View>
                )}
            </View>

            {/* Keyword Text Area */}
            <View style={styles.textContainer}>
                {/* displayText is already translated or is the correct English */}
                <Text style={styles.keywordText} numberOfLines={1} ellipsizeMode="tail">
                    {displayText}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
  );
});

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, size: number) => {
    // Calculate dynamic sizes based on the 'size' prop and theme fonts
    const dynamicFontSize = Math.max(fonts.caption * 0.9, Math.min(fonts.label, Math.floor(size * 0.12)));
    const dynamicTextContainerHeight = Math.max(20, size * 0.18);

    return StyleSheet.create({
        squareContainer: {
           // No outer style needed, margin applied by parent (e.g., SymbolGrid)
        },
        square: {
            width: size,
            height: size,
            backgroundColor: theme.card,
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: 'hidden',
            flexDirection: 'column',
        },
        topBar: {
            height: 5,
            width: '100%',
            // backgroundColor set dynamically inline via state
        },
        contentArea: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: size * 0.05, // Padding relative to size
        },
        symbolImage: {
            width: '90%', // Fill most of the content area
            height: '90%',
            // resizeMode applied inline
        },
        fallbackContainer: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
        },
        fallbackText: {
            fontSize: dynamicFontSize,
            fontWeight: '500',
            color: theme.textSecondary, // Fallback text can be secondary
            textAlign: 'center',
        },
        textContainer: {
            height: dynamicTextContainerHeight,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            width: '100%',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            backgroundColor: theme.isDark ? theme.background : theme.card,
        },
        keywordText: {
            fontSize: dynamicFontSize,
            fontWeight: '500',
            color: theme.text,
            textAlign: 'center',
        },
    });
};

export default SquareComponent;