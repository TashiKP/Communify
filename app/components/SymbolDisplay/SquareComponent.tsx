// src/components/SquareComponent.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  // Platform, // Not directly used in this component's logic
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';

interface SquareComponentProps {
  keyword: string; // Original English keyword (for Arasaac API, onPress payload)
  displayText: string; // Text to display on the square (can be translated)
  imageUri?: string; // Optional URI for custom/local symbols
  onPress: (keyword: string) => void; // Sends original English keyword back
  size: number;
}

const SquareComponent: React.FC<SquareComponentProps> = React.memo(
  ({ keyword, displayText, imageUri, onPress, size }) => {
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation();

    const styles = useMemo(
      () => createThemedStyles(theme, fonts, size, i18n.language),
      [theme, fonts, size, i18n.language]
    );

    const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(!imageUri); // Load if no pre-set imageUri
    const [error, setError] = useState<string | null>(null);
    const [topBarColor, setTopBarColor] = useState<string>(theme.border);

    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      if (!imageUri) { // Logic for fetching from Arasaac
        if (isMountedRef.current) {
          setPictogramUrl(null);
          setError(null);
          setLoading(true); // Ensure loading is true before fetch
        }
      } else { // Logic for when a custom imageUri is provided
        if (isMountedRef.current) {
          setLoading(false);
          setError(null);
          setPictogramUrl(null); // Clear Arasaac URL if custom image provided
        }
      }

      // Generate top bar color based on original English keyword hash
      let hash = 0;
      for (let i = 0; i < keyword.length; i++) {
        hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
      }
      const colorVal = Math.abs(hash % 16777215); // Ensure positive, within hex range
      const randomColor = `#${colorVal.toString(16).padStart(6, '0')}`;
      if (isMountedRef.current) {
        setTopBarColor(randomColor);
      }

      let timer: NodeJS.Timeout | null = null;
      if (!imageUri && keyword) { // Fetch only if no imageUri and keyword is present
        const fetchPictogram = async () => {
          if (!isMountedRef.current) return;

          const imageSize = 300; // Arasaac image size parameter
          const ARASAAC_API_LANGUAGE = 'en'; // Always search Arasaac using English keyword
          
          // Use original English 'keyword' for Arasaac search
          const searchUrl = `https://api.arasaac.org/api/pictograms/${ARASAAC_API_LANGUAGE}/search/${encodeURIComponent(keyword)}`;
          
          try {
            const response = await axios.get(searchUrl);
            if (isMountedRef.current) {
              const pictogramId = response.data?.[0]?._id;
              if (pictogramId) {
                const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_${imageSize}.png`;
                setPictogramUrl(generatedUrl);
                setError(null);
              } else {
                setError(t('squareComponent.arasaacErrorNotFound'));
                setPictogramUrl(null);
              }
            }
          } catch (err: any) {
            if (isMountedRef.current) {
              setError(
                err.response?.status === 404
                  ? t('squareComponent.arasaacErrorNotFound')
                  : t('squareComponent.arasaacErrorLoad')
              );
              setPictogramUrl(null);
            }
          } finally {
            if (isMountedRef.current) {
              setLoading(false);
            }
          }
        };
        // Debounce fetch to prevent rapid API calls if keyword changes quickly
        timer = setTimeout(fetchPictogram, 50);
      } else if (imageUri) { // If there's an imageUri, no need to fetch Arasaac
          if (isMountedRef.current) setLoading(false);
      }


      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [keyword, imageUri, theme.border, t]); // `t` is needed for error messages

    const handlePress = () => {
      onPress(keyword); // Callback with original English keyword
    };

    const accessibilityLabelText = t('squareComponent.accessibilityLabel', { symbol: displayText });

    return (
      <TouchableOpacity
        style={styles.squareContainer}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabelText}
        accessibilityRole="button"
      >
        <View style={styles.square}>
          <View style={[styles.topBar, { backgroundColor: topBarColor }]} />
          <View style={styles.contentArea}>
            {loading && <ActivityIndicator size="small" color={theme.primary} />}

            {!loading && imageUri && !error && (
              <Image
                source={{ uri: imageUri }}
                style={styles.symbolImage}
                resizeMode="contain"
                onError={() => {
                  if (isMountedRef.current) setError(t('squareComponent.customImageError'));
                }}
              />
            )}

            {!loading && !imageUri && pictogramUrl && !error && (
              <Image
                source={{ uri: pictogramUrl }}
                style={styles.symbolImage}
                resizeMode="contain"
                onError={() => {
                  if (isMountedRef.current) setError(t('squareComponent.arasaacImageError'));
                }}
              />
            )}

            {!loading && (error || (!imageUri && !pictogramUrl)) && (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText} numberOfLines={2} ellipsizeMode="tail">
                  {error || t('squareComponent.imageUnavailable')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.keywordText} numberOfLines={1} ellipsizeMode="tail">
              {displayText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  size: number,
  currentLanguage: string
) => {
  const dynamicTextContainerHeight = Math.max(20, size * 0.18);
  const textStyle = getLanguageSpecificTextStyle('caption', fonts, currentLanguage);

  return StyleSheet.create({
    squareContainer: {},
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
    },
    contentArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: size * 0.05,
    },
    symbolImage: {
      width: '90%',
      height: '90%',
    },
    fallbackContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    fallbackText: {
      ...textStyle,
      fontWeight: '500',
      color: theme.textSecondary,
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
      backgroundColor: theme.isDark ? theme.background : theme.card, // Slight adjustment for better text visibility
    },
    keywordText: {
      ...textStyle,
      fontWeight: '500',
      color: theme.text,
      textAlign: 'center',
    },
  });
};

export default SquareComponent;