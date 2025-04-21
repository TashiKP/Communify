// src/components/CateComponent.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, ActivityIndicator, Platform, TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons'; // Added default Folder icon

interface CateComponentProps {
  keyword: string; // The category name to display and fetch icon for
  language: string;
  isSelected?: boolean; // Optional: to highlight if selected
  onPress?: (categoryKeyword: string) => void; // Callback when pressed
}

const CateComponent: React.FC<CateComponentProps> = ({
    keyword,
    language,
    isSelected = false,
    onPress
}) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (keyword.toLowerCase() === 'contextual') {
        setLoading(false);
        setPictogramUrl(null);
        return;
    }

    setPictogramUrl(null);
    setLoading(true);

    const fetchPictogram = async () => {
      const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
      try {
        const response = await axios.get(searchUrl);
        const pictogramId = response.data?.[0]?._id;
        if (pictogramId) {
          const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_300.png`;
          setPictogramUrl(generatedUrl);
        } else {
          // console.warn(`No category icon found for: ${keyword}`);
           setPictogramUrl(null);
        }
      } catch (err: any) {
        // console.error(`Error fetching category icon for ${keyword}:`, err.message || err);
        setPictogramUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPictogram();
  }, [keyword, language]);

  const handlePress = () => {
    if (onPress) {
      onPress(keyword);
    }
  };

  return (
    <TouchableOpacity
        style={[styles.cateComponent, isSelected && styles.selectedCateComponent]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`Category: ${keyword}${isSelected ? ', selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
    >
        <View style={styles.iconContainer}>
            {loading && (
                <ActivityIndicator size="small" color="#999" />
            )}
            {!loading && pictogramUrl && (
                <Image source={{ uri: pictogramUrl }} style={styles.symbolImage}/>
            )}
            {!loading && !pictogramUrl && (
                <FontAwesomeIcon icon={faFolder} size={24} color={isSelected ? '#0077b6' : '#adb5bd'} />
            )}
        </View>
        <Text style={[styles.keywordText, isSelected && styles.selectedKeywordText]} numberOfLines={2} ellipsizeMode="tail">
            {keyword}
        </Text>
        <FontAwesomeIcon icon={faChevronRight} size={16} color={isSelected ? '#0077b6' : '#adb5bd'} style={styles.chevronIcon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cateComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    // Removed border radius/width - let separator handle lines
  },
  selectedCateComponent: {
      backgroundColor: '#e7f5ff', // Light blue background
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    overflow: 'hidden',
  },
  symbolImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  keywordText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#343a40',
    textAlign: 'left',
  },
   selectedKeywordText: {
       fontWeight: '600',
       color: '#0077b6',
   },
  chevronIcon: {
    marginLeft: 10,
  },
});

export default React.memo(CateComponent); // Memoize here