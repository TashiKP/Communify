import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import axios from 'axios';
import SquareComponent from './SquareComponent';
import CateComponent from './CateComponent';

interface SquareData {
  id: string;
  keyword: string;
}

const NavBarComponent = () => {
  const language = 'en';
  const [data, setData] = useState<SquareData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingKeywords, setFetchingKeywords] = useState<boolean>(true);

  const flatListRefLeft = useRef<FlatList<SquareData>>(null);
  const flatListRefRight = useRef<FlatList<SquareData>>(null);

  const loadKeywords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.arasaac.org/v1/keywords/${language}`);
      if (response.data && response.data.words) {
        const newData = response.data.words.map((keyword: string, index: number) => ({
          id: (index + 1).toString(),
          keyword,
        }));
        setData(newData);
      }
    } catch (err) {
      console.error("Error fetching keywords:", err);
    } finally {
      setLoading(false);
      setFetchingKeywords(false);
    }
  }, [language]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const loadMoreData = useCallback(() => {
    if (loading) return;
    setLoading(true);

    setTimeout(() => {
      const newData = data.map((item, index) => ({
        id: (data.length + index + 1).toString(),
        keyword: item.keyword,
      }));
      setData(prevData => [...prevData, ...newData]);
      setLoading(false);
    }, 1000);
  }, [data, loading]);

  const renderLeftItem = ({ item }: { item: SquareData }) => (
    <SquareComponent keyword={item.keyword} language={language} />
  );

  const renderRightItem = ({ item }: { item: SquareData }) => (
    <View style={styles.rightItem}>
      <CateComponent keyword={item.keyword} language={language} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Text style={styles.navBarTitle}>Symbols (All)</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.leftSide}>
          {fetchingKeywords ? (
            <ActivityIndicator size="large" color="#0077b6" />
          ) : (
            <FlatList
              ref={flatListRefLeft}
              data={data}
              renderItem={renderLeftItem}
              keyExtractor={item => item.id}
              numColumns={8}
              columnWrapperStyle={styles.row}
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading ? <ActivityIndicator size="large" color="#0077b6" /> : null
              }
            />
          )}
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.rightSide}>
          <FlatList
            ref={flatListRefRight}
            data={data}
            renderItem={renderRightItem}
            keyExtractor={item => item.id}
            numColumns={1}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading ? <ActivityIndicator size="large" color="#0077b6" /> : null
            }
          />
        </View>
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
    height: 25,
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
    flex: 1,
  },
  leftSide: {
    flex: 8.5,
    backgroundColor: '#fff',
    paddingLeft: 26,
    paddingRight: 26,
    padding: 5,
    position: 'relative',
  },
  rightSide: {
    flex: 1.1,
    backgroundColor: '#fff',
    padding: 3,
    paddingLeft: 23,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#000',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  rightItem: {
    paddingTop: 2,
    paddingBottom: 5,
  },
});

export default NavBarComponent;
