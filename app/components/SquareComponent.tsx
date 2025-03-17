import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import axios from 'axios';

interface SquareComponentProps {
  keyword: string;
  language: string;
}

const SquareComponent: React.FC<SquareComponentProps> = ({ keyword, language }) => {
  const [pictogramUrl, setPictogramUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPictogram = async () => {
      try {
        const keywordsApiUrl = `https://api.arasaac.org/v1/keywords/${language}`;
        const response = await axios.get(keywordsApiUrl);
        const keywordData = response.data;

        const foundKeyword = keywordData.find((item: any) => item.name.toLowerCase() === keyword.toLowerCase());

        if (!foundKeyword) {
          setError('Keyword not found');
          setLoading(false);
          return;
        }

        const pictogramId = foundKeyword.id;
        const pictogramUrl = `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_2500.png`;
        setPictogramUrl(pictogramUrl);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchPictogram();
  }, [keyword, language]);

  return (
    <View style={styles.container}>
      <View style={styles.square}>
        {loading && <Text>Loading...</Text>}
        {error && <Text>{error}</Text>}
        {pictogramUrl ? (
          <Image source={{ uri: pictogramUrl }} style={styles.symbolImage} />
        ) : (
          <Text>No pictogram available</Text>
        )}
        <Text style={styles.keywordText}>{keyword}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  square: {
    width: 100, // Adjusted for better fit
    height: 100, // Adjusted for better fit
    backgroundColor: '#0077b6',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 0,
    margin: 5, // Added margin for spacing between squares
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolImage: {
    width: 40, // Adjusted size
    height: 40, // Adjusted size
    marginBottom: 5,
  },
  keywordText: {
    fontSize: 12, // Reduced font size for better fit
    color: '#fff',
    textAlign: 'center',
  },
});

export default SquareComponent;
