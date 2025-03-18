import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import axios from 'axios';

interface CateComponentProps {
  keyword: string;
  language: string;
}

const CateComponent: React.FC<CateComponentProps> = ({ keyword, language }) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>('#e89a9a'); // Default color

  useEffect(() => {
    const fetchPictogram = async () => {
      try {
        const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(keyword)}`;
        const response = await axios.get(searchUrl);

        if (!response.data || response.data.length === 0) {
          setError('No pictogram found');
          setLoading(false);
          return;
        }

        const pictogramId = response.data[0]._id;
        const generatedUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_500.png`;
        
        setPictogramUrl(generatedUrl);
        setLoading(false);
      } catch (err) {
        setError('Error fetching');
        setLoading(false);
      }
    };

    // Generate a random color for the top bar
    const generateRandomColor = () => {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      return randomColor;
    };

    setTopBarColor(generateRandomColor());  // Set the random color
    fetchPictogram();
  }, [keyword, language]);

  return (
    <View style={styles.cateComponent}>
      {/* Top Bar with random color */}
      <View style={[styles.topBar, { backgroundColor: topBarColor }]} />

      {/* Pictogram */}
      <View style={styles.imageContainer}>
        {loading && <Text>Loading...</Text>}
        {error && <Text>{error}</Text>}
        {pictogramUrl && <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} />}
      </View>

      {/* Keyword */}
      <Text style={styles.keywordText}>{keyword}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cateComponent: {
    width: 75,
    height: 75,
    backgroundColor: '#fff',
    borderRadius: 0,  // Set to zero for square corners
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    height: 7,
    width: '100%',
    borderBottomWidth: 0.5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  symbolImage: {
    width: 45,
    height: 25,
    resizeMode: 'contain',
  },
  keywordText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 3,
  },
});

export default CateComponent;
