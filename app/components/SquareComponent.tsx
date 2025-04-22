// src/components/SquareComponent.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform,
    TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

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
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!imageUri); // Don't load if imageUri is provided
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>('#E0E0E0');

  useEffect(() => {
    // Reset state if not using a provided imageUri
    if (!imageUri) {
        setPictogramUrl(null);
        setError(null);
        setLoading(true);
    } else {
        setLoading(false);
        setError(null);
        setPictogramUrl(null);
    }

    // Set top bar color based on keyword hash
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) { hash = keyword.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; }
    const colorVal = Math.abs(hash % 16777215);
    const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
    setTopBarColor(randomColor);

    // Fetch only if imageUri is NOT provided
    if (!imageUri) {
        const fetchPictogram = async () => {
            const imageSize = 300; // Request a reasonable size
            const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
            try {
                const response = await axios.get(searchUrl);
                const pictogramId = response.data?.[0]?._id;
                if (pictogramId) {
                    const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
                    setPictogramUrl(generatedUrl);
                    setError(null);
                } else {
                    setError('Not found');
                }
            } catch (err: any) {
                setError(err.response?.status === 404 ? 'Not found' : 'Load error');
            } finally {
                setLoading(false);
            }
        };
        // Debounce fetch slightly
        const timer = setTimeout(fetchPictogram, 50);
        return () => clearTimeout(timer);
    }
    // If imageUri is provided, the effect completes without fetching.
    // The return function for cleanup is implicitly undefined, which is fine.

  }, [keyword, language, imageUri]); // Rerun effect if these change

  const handlePress = () => {
      onPress(keyword);
  };

  // Calculate dynamic sizes based on the 'size' prop
  const dynamicFontSize = Math.max(10, Math.min(16, Math.floor(size * 0.12))); // Clamp font size
  const dynamicTextContainerHeight = Math.max(20, size * 0.18); // Relative height for text box
  const dynamicPlaceholderIconSize = size * 0.5; // Icon size relative to square

  return (
    <TouchableOpacity
        style={styles.squareContainer}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Symbol for ${keyword}, press to add`}
        accessibilityRole="button"
    >
        {/* Apply dynamic size here */}
        <View style={[styles.square, { width: size, height: size }]}>
            <View style={[styles.topBar, { backgroundColor: topBarColor }]} />

            <View style={styles.contentArea}>
                {loading && (
                    <ActivityIndicator size="small" color={primaryColor} />
                )}
                {/* --- Render Custom Image if available --- */}
                {!loading && imageUri && (
                     <Image
                        source={{ uri: imageUri }}
                        style={styles.symbolImage}
                        resizeMode="contain" // Use contain for custom images too
                        accessibilityLabel="" // Decorative
                        onError={(e) => {
                            console.warn(`Failed load custom image: ${keyword}`, e.nativeEvent.error);
                            setError('Img Error');
                        }}
                    />
                )}
                {/* --- Render Arasaac Image if NO custom URI AND loaded --- */}
                {!loading && !imageUri && pictogramUrl && !error && (
                     <Image
                        source={{ uri: pictogramUrl }}
                        style={styles.symbolImage}
                        resizeMode="contain" // Ensure contain for Arasaac images
                        accessibilityLabel=""
                        onError={() => setError('Img Error')}
                    />
                )}
                {/* --- Render Fallback Text if error or image failed/missing --- */}
                {!loading && (error || (!imageUri && !pictogramUrl)) && (
                     <View style={styles.fallbackContainer}>
                        {/* Optionally show a placeholder icon */}
                        {/* <FontAwesomeIcon icon={faImage} size={dynamicPlaceholderIconSize * 0.5} color={errorColor} style={{ marginBottom: 5 }}/> */}
                         <Text style={[styles.statusTextError, { fontSize: dynamicFontSize }]} numberOfLines={2} ellipsizeMode="tail">
                            {keyword}
                         </Text>
                     </View>
                )}
            </View>

            {/* Keyword Text Area with dynamic height and font size */}
            <View style={[styles.textContainer, { height: dynamicTextContainerHeight }]}>
                <Text style={[styles.keywordText, { fontSize: dynamicFontSize }]} numberOfLines={1} ellipsizeMode="tail">
                    {keyword}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
  );
});

// --- Constants & Styles ---
const primaryColor = '#0077b6';
const cardBackgroundColor = '#ffffff';
const textColor = '#2d3436';
const lightGrey = '#dfe6e9';
const errorColor = '#b2bec3'; // Muted color for error text

const styles = StyleSheet.create({
  squareContainer: {
     // Margin applied by parent grid component (SymbolGrid or CustomPageComponent)
  },
  square: { // Size applied dynamically inline
    backgroundColor: cardBackgroundColor,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightGrey,
    overflow: 'hidden', // Important for border radius
    flexDirection: 'column', // Ensure vertical layout
  },
  topBar: {
    height: 5, // Fixed height top bar
    width: '100%',
  },
  contentArea: {
    flex: 1, // Take remaining space
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5%', // Padding relative to container size
  },
  symbolImage: {
    width: '90%', // Fill most of the content area
    height: '90%',
    // resizeMode: 'contain', // Applied inline now
  },
  fallbackContainer: { // Centering for fallback text/icon
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  statusTextError: {
      // fontSize set dynamically
      fontWeight: '500',
      color: errorColor,
      textAlign: 'center',
  },
  textContainer: {
    // height set dynamically
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: lightGrey,
    backgroundColor: '#f8f9fa', // Subtle background for text area
  },
  keywordText: {
    // fontSize set dynamically
    fontWeight: '500',
    color: textColor,
    textAlign: 'center',
  },
});

export default SquareComponent;