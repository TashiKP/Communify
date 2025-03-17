import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import axios from 'axios';

interface Pictogram {
  id: string;
  keyword: string;
}

const PictogramAPI = async (language: string) => {
  try {
    const response = await axios.get(`https://api.arasaac.org/v1/pictograms/all/${language}`);
    return response.data; // Returns the pictograms data
  } catch (err) {
    throw new Error('Error fetching pictogram data');
  }
};

const NavBarComponent = () => {
  const language = 'en'; // Language setting
  const [pictogramData, setPictogramData] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPictogramData = async () => {
      try {
        const data = await PictogramAPI(language); // Fetch data from the API
        const pictogramsWithKeywords = data.map((item: any) => ({
          id: item.id,
          keyword: item.keyword, // Assuming 'keyword' is the field you want
        }));
        setPictogramData(pictogramsWithKeywords);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchPictogramData();
  }, [language]);

  const renderItem = ({ item }: { item: Pictogram }) => (
    <View style={styles.square}>
      <Text>{item.keyword}</Text>
      <img
        src={`https://static.arasaac.org/pictograms/${item.id}/${item.id}_2500.png`}
        alt={item.keyword}
        style={styles.pictogramImage}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navBar} />
      <View style={styles.divider} />
      <View style={styles.content}>
        <View style={styles.leftSide}>
          {loading && <Text>Loading...</Text>}
          {error && <Text>{error}</Text>}
          <FlatList
            data={pictogramData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.row}
          />
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.rightSide} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    backgroundColor: '#0077b6',
    height: 30,
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'black',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    flex: 1,
  },
  leftSide: {
    flex: 8.5,
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  rightSide: {
    flex: 1.5,
    backgroundColor: '#d3d3d3',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'black',
  },
  row: {
    justifyContent: 'space-between',
  },
  square: {
    margin: 10,
    alignItems: 'center',
  },
  pictogramImage: {
    width: 100,
    height: 100,
  },
});

export default NavBarComponent;
