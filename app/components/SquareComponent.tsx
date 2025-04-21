// src/components/SquareComponent.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform,
    TouchableOpacity // Added TouchableOpacity
} from 'react-native';
import axios from 'axios';

interface SquareComponentProps {
  keyword: string;
  language: string;
  onPress: (keyword: string) => void; // <-- Add onPress prop
}

// --- Component ---
const SquareComponent: React.FC<SquareComponentProps> = React.memo(({ // Wrap with memo
  keyword,
  language,
  onPress, // <-- Destructure onPress
}) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>('#E0E0E0');

  useEffect(() => {
    setPictogramUrl(null);
    setError(null);
    setLoading(true);
    // Assign pseudo-random color based on keyword hash for consistency
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
      hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    const colorVal = Math.abs(hash % 16777215); // Ensure positive value within hex range
    const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
    setTopBarColor(randomColor);

    const fetchPictogram = async () => {
      const imageSize = 300; // Size for fetching
      const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
      try {
        const response = await axios.get(searchUrl);
        const pictogramId = response.data?.[0]?._id;
        if (pictogramId) {
          const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
          setPictogramUrl(generatedUrl);
          setError(null);
        } else {
          // console.warn(`No pictogram found for: ${keyword} [${language}]`);
          setError('Not found');
        }
      } catch (err: any) {
        // console.error(`Error fetching pictogram for ${keyword}:`, err);
        setError(err.response?.status === 404 ? 'Not found' : 'Load error');
      } finally {
        setLoading(false);
      }
    };
    // Debounce slightly
    const timer = setTimeout(fetchPictogram, 50);
    return () => clearTimeout(timer);
  }, [keyword, language]);


  const handlePress = () => {
      onPress(keyword); // Call the passed onPress function with the keyword
  };

  // console.log(`Rendering Square: ${keyword}`); // DEBUG

  return (
    // Wrap the entire component view in TouchableOpacity
    <TouchableOpacity
        style={styles.squareContainer} // Use a container style
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Symbol for ${keyword}, press to add`}
        accessibilityRole="button"
    >
        <View style={styles.square}>
        {/* Top Bar */}
        <View style={[styles.topBar, { backgroundColor: topBarColor }]} />

        {/* Main Content Area */}
        <View style={styles.contentArea}>
            {loading && (
            <ActivityIndicator size="small" color={primaryColor} />
            )}
            {!loading && error && (
            <Text style={styles.statusTextError} numberOfLines={2} ellipsizeMode="tail">{keyword}</Text>
            )}
            {!loading && !error && pictogramUrl && (
            <Image
                source={{ uri: pictogramUrl }}
                style={styles.symbolImage}
                accessibilityLabel="" // Image is decorative within the labeled component
                // Consider adding resizeMethod='resize' for android performance if needed
                // resizeMethod={Platform.OS === 'android' ? 'resize' : 'auto'}
            />
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

// --- Constants & Styles ---
const primaryColor = '#0077b6';
const cardBackgroundColor = '#ffffff';
const textColor = '#2d3436';
const lightGrey = '#dfe6e9';
const errorColor = '#b2bec3';

const styles = StyleSheet.create({
  squareContainer: {
     // Use margin here if needed between touchable items
     // margin: 4, // Example
  },
  square: {
    // Adjust size as needed for your grid layout
    width: Platform.OS === 'web' ? 120 : 145, // Smaller on web?
    height: Platform.OS === 'web' ? 120 : 145,
    backgroundColor: cardBackgroundColor,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightGrey,
    overflow: 'hidden',
  },
  topBar: {
    height: 5,
    width: '100%',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  symbolImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  statusTextError: {
      fontSize: 14,
      fontWeight: '500',
      color: errorColor,
      textAlign: 'center',
      paddingHorizontal: 4,
  },
  textContainer: {
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: lightGrey,
  },
  keywordText: {
    fontSize: Platform.OS === 'web' ? 14 : 16, // Smaller on web?
    fontWeight: '500',
    color: textColor,
    textAlign: 'center',
  },
});

export default SquareComponent;