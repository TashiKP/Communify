import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import SquareComponent from './SquareComponent';
import CateComponent from './CateComponent'; // Import the CateComponent

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

  const scrollToLeft = () => {
    if (flatListRefLeft.current) {
      flatListRefLeft.current.scrollToOffset({ animated: true, offset: 0 });
    }
  };

  const scrollToRight = () => {
    if (flatListRefRight.current) {
      flatListRefRight.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar} />
      <View style={styles.content}>
        <View style={styles.leftSide}>
          <TouchableOpacity style={styles.scrollButton} onPress={scrollToLeft}>
            <Text style={styles.scrollButtonText}>{'<'}</Text>
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.scrollButtonRight} onPress={scrollToRight}>
            <Text style={styles.scrollButtonText}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.rightSide}>
          {/* FlatList for CateComponent */}
          <FlatList
            ref={flatListRefRight}
            data={data}
            renderItem={renderRightItem}
            keyExtractor={item => item.id}
            numColumns={1} // Single column for CateComponent
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
  },
  content: {
    flexDirection: 'row',
    flex: 1,
  },
  leftSide: {
    flex: 8.5,
    backgroundColor: '#fff',
    paddingLeft: 35,
    paddingRight: 35,
    padding: 5,
    position: 'relative',
  },
  rightSide: {
    flex: 1, // Make rightSide fill the remaining space
    backgroundColor: '#fff',
    padding: 3,
    paddingLeft: 6,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#000',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  scrollButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -40 }],
    left: 0,
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollButtonRight: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -40 }],
    right: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollButtonText: {
    color: 'black',
    fontSize: 20,
  },
  rightItem: {
    paddingTop: 2,  // Top padding for CateComponent
    paddingBottom: 5, // Bottom padding for CateComponent
  },
});

export default NavBarComponent;
