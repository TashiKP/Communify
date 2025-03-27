import React, {useState, useEffect} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import axios from 'axios';

interface SquareComponentProps {
  keyword: string;
  language: string;
}

const SquareComponent: React.FC<SquareComponentProps> = ({
  keyword,
  language,
}) => {
  const [pictogramUrl, setPictogramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topBarColor, setTopBarColor] = useState<string>('#e89a9a'); // Default color

  useEffect(() => {
    const fetchPictogram = async () => {
      try {
        const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(
          keyword,
        )}`;
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

    const generateRandomColor = () => {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(
        16,
      )}`;
      return randomColor;
    };

    setTopBarColor(generateRandomColor());
    fetchPictogram();
  }, [keyword, language]);

  return (
    <View style={styles.square}>
      {/* Top Bar with random color */}
      <View style={[styles.topBar, {backgroundColor: topBarColor}]} />

      {/* Pictogram */}
      <View style={styles.imageContainer}>
        {loading && <Text>Loading...</Text>}
        {error && <Text>{error}</Text>}
        {pictogramUrl && (
          <Image source={{uri: pictogramUrl}} style={styles.symbolImage} />
        )}
      </View>

      {/* Keyword */}
      <Text style={styles.keywordText}>{keyword}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  square: {
    width: 75,
    height: 75,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 1, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 0,
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

export default SquareComponent;
