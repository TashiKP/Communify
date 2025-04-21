// src/components/SquareComponent.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform,
    TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'; // Import if using icon fallback
import { faImage } from '@fortawesome/free-solid-svg-icons'; // Example fallback icon

interface SquareComponentProps {
  keyword: string;
  language: string;
  imageUri?: string; // <-- Add optional imageUri prop
  onPress: (keyword: string) => void;
}

// --- Component ---
const SquareComponent: React.FC<SquareComponentProps> = React.memo(({
  keyword,
  language,
  imageUri, // <-- Destructure imageUri
  onPress,
}) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!imageUri); // <-- Don't start loading if imageUri is provided
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>('#E0E0E0');

  useEffect(() => {
    // Reset Arasaac state ONLY if not using a provided imageUri
    if (!imageUri) {
        setPictogramUrl(null);
        setError(null);
        setLoading(true);
    } else {
        // If imageUri is provided, we are not loading from Arasaac
        setLoading(false);
        setError(null);
        setPictogramUrl(null); // Ensure Arasaac URL is cleared
    }

    // Set top bar color (can still be based on keyword)
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) { /* ... hash logic ... */ hash = keyword.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; }
    const colorVal = Math.abs(hash % 16777215);
    const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
    setTopBarColor(randomColor);

    // --- Fetch only if imageUri is NOT provided ---
    if (!imageUri) {
        const fetchPictogram = async () => {
        const imageSize = 300;
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
        const timer = setTimeout(fetchPictogram, 50);
        return () => clearTimeout(timer);
    }
    // --- End fetch logic ---

  }, [keyword, language, imageUri]); // <-- Add imageUri to dependency array


  const handlePress = () => {
      onPress(keyword);
  };

  return (
    <TouchableOpacity
        style={styles.squareContainer}
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
            {/* --- Render Custom Image if available --- */}
            {!loading && imageUri && (
                 <Image
                    source={{ uri: imageUri }}
                    style={styles.symbolImage}
                    accessibilityLabel="" // Decorative
                    onError={(e) => {
                        console.warn(`Failed to load custom image for ${keyword}: ${imageUri}`, e.nativeEvent.error);
                        setError('Img Error'); // Set specific error if custom image fails
                    }}
                />
            )}
            {/* --- Render Arasaac Image if NO custom URI AND loaded --- */}
            {!loading && !imageUri && pictogramUrl && !error && (
                 <Image
                    source={{ uri: pictogramUrl }}
                    style={styles.symbolImage}
                    accessibilityLabel=""
                    onError={() => setError('Img Error')} // Set error if Arasaac image fails
                />
            )}
            {/* --- Render Fallback Text if error or image failed --- */}
            {/* Show keyword if loading finished AND (there's an error OR (no custom image AND no pictogram)) */}
            {!loading && (error || (!imageUri && !pictogramUrl)) && (
                 <Text style={styles.statusTextError} numberOfLines={2} ellipsizeMode="tail">
                    {keyword}
                    {/* Optional: Add small icon for error state */}
                    {/* {error === 'Img Error' && <FontAwesomeIcon icon={faImage} size={12} color={errorColor} />} */}
                 </Text>
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

// --- Constants & Styles (Keep as before) ---
const primaryColor = '#0077b6';
const cardBackgroundColor = '#ffffff';
const textColor = '#2d3436';
const lightGrey = '#dfe6e9';
const errorColor = '#b2bec3';

const styles = StyleSheet.create({
  squareContainer: { /* ... */ },
  square: { width: Platform.OS === 'web' ? 120 : 145, height: Platform.OS === 'web' ? 120 : 145, backgroundColor: cardBackgroundColor, borderRadius: 10, borderWidth: 1, borderColor: lightGrey, overflow: 'hidden', },
  topBar: { height: 5, width: '100%', },
  contentArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 5, },
  symbolImage: { width: '85%', height: '85%', resizeMode: 'contain', },
  statusTextError: { fontSize: 14, fontWeight: '500', color: errorColor, textAlign: 'center', paddingHorizontal: 4, },
  textContainer: { height: 25, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, width: '100%', borderTopWidth: 1, borderTopColor: lightGrey, },
  keywordText: { fontSize: Platform.OS === 'web' ? 14 : 16, fontWeight: '500', color: textColor, textAlign: 'center', },
});

export default SquareComponent;