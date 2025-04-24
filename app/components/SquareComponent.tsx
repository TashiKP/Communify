// src/components/SquareComponent.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform,
    TouchableOpacity
} from 'react-native';
import axios from 'axios'; // Ensure installed

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Component Props Interface ---
interface SquareComponentProps {
  keyword: string;
  language: string;
  imageUri?: string; // Optional URI for custom symbols
  onPress: (keyword: string) => void;
  size: number; // Prop to determine component size
}

// --- Component ---
const SquareComponent: React.FC<SquareComponentProps> = React.memo(({
  keyword,
  language,
  imageUri,
  onPress,
  size, // Use the size prop
}) => {
  // --- Context ---
  const { theme, fonts } = useAppearance();

  // --- Dynamic Styles ---
  // Memoize styles based on theme, fonts, and size prop (for dynamic font/icon sizes)
  const styles = useMemo(() => createThemedStyles(theme, fonts, size), [theme, fonts, size]);

  // --- State ---
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!imageUri); // Start loading only if fetching from Arasaac
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>(theme.border); // Default to theme border color
  const isMountedRef = useRef(true);

  // --- Effect for Top Bar Color and Fetching ---
  useEffect(() => {
    isMountedRef.current = true;
    // Reset state for Arasaac fetch if needed
    if (!imageUri) {
        setPictogramUrl(null);
        setError(null);
        setLoading(true); // Start loading only if fetching
    } else {
        setLoading(false); // No loading needed for custom image
        setError(null);
        setPictogramUrl(null);
    }

    // Generate top bar color based on keyword hash (consistent)
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) { hash = keyword.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; }
    const colorVal = Math.abs(hash % 16777215); // Generate a number within hex range
    const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
    setTopBarColor(randomColor); // Use generated color

    // Fetch pictogram only if imageUri is NOT provided
    let timer: NodeJS.Timeout | null = null;
    if (!imageUri) {
        const fetchPictogram = async () => {
            const imageSize = 300; // Arasaac image size request
            const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
            try {
                const response = await axios.get(searchUrl);
                if (isMountedRef.current) { // Check mount status before setting state
                    const pictogramId = response.data?.[0]?._id;
                    if (pictogramId) {
                        const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
                        setPictogramUrl(generatedUrl);
                        setError(null);
                    } else {
                        setError('Not found'); // Symbol not found on Arasaac
                        setPictogramUrl(null);
                    }
                }
            } catch (err: any) {
                 if (isMountedRef.current) {
                    // Set error based on status or provide generic message
                    setError(err.response?.status === 404 ? 'Not found' : 'Load error');
                    setPictogramUrl(null);
                 }
            } finally {
                 if (isMountedRef.current) {
                    setLoading(false); // Stop loading indicator
                 }
            }
        };
        // Debounce fetch slightly to avoid rapid requests if props change quickly
        timer = setTimeout(fetchPictogram, 50);
    }
    // else { setLoading(false); } // Handled above

    // Cleanup function
    return () => {
        isMountedRef.current = false; // Set false on unmount
        if (timer) clearTimeout(timer); // Clear timer if component unmounts
    };

  }, [keyword, language, imageUri, theme]); // Rerun effect if these change (added theme for default color)

  // --- Press Handler ---
  const handlePress = () => {
      onPress(keyword);
  };

  return (
    <TouchableOpacity
        style={styles.squareContainer} // Styles applied dynamically
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Symbol for ${keyword}, press to add`}
        accessibilityRole="button"
    >
        {/* Apply dynamic size here */}
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
                {!loading && imageUri && !error && ( // Show custom if not loading, URI exists, and no load error
                     <Image
                        source={{ uri: imageUri }}
                        style={styles.symbolImage}
                        resizeMode="contain"
                        accessibilityLabel="" // Decorative
                        onError={(e) => {
                            console.warn(`Failed load custom image: ${keyword}`, e.nativeEvent.error);
                            if (isMountedRef.current) setError('Img Error'); // Set error state on failure
                        }}
                    />
                )}
                {/* Arasaac Image */}
                {!loading && !imageUri && pictogramUrl && !error && ( // Show Arasaac if no custom, URL exists, and no error
                     <Image
                        source={{ uri: pictogramUrl }}
                        style={styles.symbolImage}
                        resizeMode="contain"
                        accessibilityLabel=""
                        onError={() => { if (isMountedRef.current) setError('Img Error'); }} // Set error state on failure
                    />
                )}
                {/* Fallback Text/Icon */}
                {!loading && (error || (!imageUri && !pictogramUrl)) && ( // Show fallback if not loading AND (error exists OR (no custom URI AND no Arasaac URL))
                     <View style={styles.fallbackContainer}>
                         {/* You could add a placeholder icon here too */}
                         <Text style={styles.fallbackText} numberOfLines={2} ellipsizeMode="tail">
                            {keyword}
                         </Text>
                     </View>
                )}
            </View>

            {/* Keyword Text Area */}
            <View style={styles.textContainer}>
                <Text style={styles.keywordText} numberOfLines={1} ellipsizeMode="tail">
                    {keyword}
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
           // No outer style needed, margin applied by parent
        },
        square: {
            width: size, // Apply dynamic size
            height: size, // Apply dynamic size
            backgroundColor: theme.card, // Use theme card color
            borderRadius: 10,
            borderWidth: StyleSheet.hairlineWidth, // Use hairline for subtle border
            borderColor: theme.border, // Use theme border color
            overflow: 'hidden',
            flexDirection: 'column',
        },
        topBar: {
            height: 5,
            width: '100%',
            // backgroundColor set dynamically inline
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
        fallbackText: { // Renamed from statusTextError
            fontSize: dynamicFontSize, // Use dynamic font size
            fontWeight: '500',
            color: theme.textSecondary, // Use secondary text color for fallback
            textAlign: 'center',
        },
        textContainer: {
            height: dynamicTextContainerHeight, // Use dynamic height
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
            width: '100%',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border, // Use theme border color
            backgroundColor: theme.isDark ? theme.background : theme.card, // Subtle background difference
        },
        keywordText: {
            fontSize: dynamicFontSize, // Use dynamic font size
            fontWeight: '500',
            color: theme.text, // Use theme text color
            textAlign: 'center',
        },
    });
};

export default SquareComponent;