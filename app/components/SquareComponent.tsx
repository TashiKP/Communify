import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform
} from 'react-native';
import axios from 'axios';

interface SquareComponentProps {
  keyword: string;
  language: string;
}

// --- Component ---
const SquareComponent: React.FC<SquareComponentProps> = ({
  keyword,
  language,
}) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Keep error state
  const [topBarColor, setTopBarColor] = useState<string>('#E0E0E0'); // Default color

  useEffect(() => {
    // Reset state for new keyword/language
    setPictogramUrl(null);
    setError(null);
    setLoading(true);

    // Assign random color (or fetch type-based color if logic exists)
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    setTopBarColor(randomColor); // You might want deterministic colors based on word type later

    const fetchPictogram = async () => {
      // Use smaller image size for performance if sufficient
      const imageSize = 300;
      const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
      try {
        const response = await axios.get(searchUrl);
        const pictogramId = response.data?.[0]?._id;

        if (pictogramId) {
          const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
          // Optional: Preload image
          // Image.prefetch(generatedUrl).then(() => setPictogramUrl(generatedUrl)).catch(() => setError('Load error'));
          setPictogramUrl(generatedUrl);
          setError(null); // Clear previous error if any
        } else {
          console.warn(`No pictogram found for: ${keyword} [${language}]`);
          setError('Not found'); // Set specific error
        }
      } catch (err: any) {
        console.error(`Error fetching pictogram for ${keyword}:`, err);
        setError(err.response?.status === 404 ? 'Not found' : 'Load error');
      } finally {
        setLoading(false);
      }
    };

    // Debounce fetch slightly (optional)
    const timer = setTimeout(fetchPictogram, 50);
    return () => clearTimeout(timer);

  }, [keyword, language]); // Re-run only when keyword or language changes

  return (
    // Apply accessibility label to the whole component
    <View style={styles.square} accessibilityLabel={`Symbol for ${keyword}`}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: topBarColor }]} />

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {loading && (
          <ActivityIndicator size="small" color={primaryColor} /> // Use primary color for loader
        )}
        {!loading && error && (
          // Show keyword prominently if image fails/not found
          <Text style={styles.statusTextError} numberOfLines={2} ellipsizeMode="tail">{keyword}</Text>
        )}
        {!loading && !error && pictogramUrl && (
          <Image
             source={{ uri: pictogramUrl }}
             style={styles.symbolImage}
             accessibilityLabel="" // Image is decorative within the labeled component
             resizeMethod={Platform.OS === 'android' ? 'resize' : 'auto'}
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
  );
};

// --- Constants & Styles - Aligned with other simplified components ---
const primaryColor = '#0077b6';
const cardBackgroundColor = '#ffffff';
const textColor = '#2d3436'; // Darker text
const secondaryTextColor = '#636e72'; // Medium grey
const lightGrey = '#dfe6e9'; // Border color
const errorColor = '#b2bec3'; // Muted grey for error text

const styles = StyleSheet.create({
  square: {
    width: 145, 
    height: 145,
    backgroundColor: cardBackgroundColor,
    borderRadius: 10, // Consistent corner radius
    borderWidth: 1, // Use border for separation
    borderColor: lightGrey, // Consistent border color
    overflow: 'hidden', // Clip top bar and content
    // --- REMOVED Shadows/Elevation ---
  },
  topBar: {
    height: 5, // Thinner top bar
    width: '100%',
  },
  contentArea: {
    flex: 1, // Takes up space between topBar and textContainer
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5, // Reduced padding
  },
  symbolImage: {
    width: '85%', // Adjust size relative to content area
    height: '85%',
    resizeMode: 'contain',
  },
  statusTextError: { // Specific style for error text
      fontSize: 14, // Larger text if image fails
      fontWeight: '500',
      color: errorColor, // Muted color
      textAlign: 'center',
      paddingHorizontal: 4,
  },
  textContainer: {
    height: 25, // Slightly more height for text
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: '100%',
    borderTopWidth: 1, // Keep separator for text area
    borderTopColor: lightGrey, // Consistent border color
    // Removed background color for flatter look
    // backgroundColor: '#f8f9fa',
  },
  keywordText: {
    fontSize: 16,
    fontWeight: '500',
    color: textColor, // Use main text color
    textAlign: 'center',
  },
});

export default SquareComponent;