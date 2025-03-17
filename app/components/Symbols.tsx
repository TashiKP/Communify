import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import SquareComponent from './SquareComponent';
import axios from 'axios';

interface SquareData {
  id: string;
  keyword: string;
}

const NavBarComponent = () => {
  const language = 'en'; // Language setting

  const [squareData, setSquareData] = useState<SquareData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSquareData = async () => {
      try {
        const response = await axios.get(`https://api.arasaac.org/v1/keywords/${language}`);
    
        // Log the entire response to inspect the structure
        console.log('API Response:', response.data);
    
        // Ensure the response has the expected data format
        const keywords = response.data.keywords || [];  // Assuming 'keywords' holds the actual list
    
        if (!keywords.length) {
          setError('No keywords found');
          setLoading(false);
          return;
        }
    
        // Select the first 6 keywords to fill at least two rows
        const selectedKeywords = keywords.slice(0, 6);
        const squareDataWithKeywords = selectedKeywords.map((keyword: string, index: number) => ({
          id: (index + 1).toString(),
          keyword: keyword,
        }));
    
        setSquareData(squareDataWithKeywords);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchSquareData();
  }, [language]);

  const renderItem = ({ item }: { item: SquareData }) => (
    <SquareComponent keyword={item.keyword} language={language} />
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
            data={squareData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={3}  // Three items per row
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
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'black',
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
    marginBottom: 10,  // Add spacing between rows if needed
  },
});

export default NavBarComponent;
