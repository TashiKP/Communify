// src/components/NavBarComponent.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import SquareComponent from './SquareComponent'; // Ensure path is correct
import CateComponent from './CateComponent'; // Use the INDIVIDUAL category component
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../helpers/contextualSymbols'; // Ensure path is correct

// --- Category Definition ---
interface CategoryInfo { id: string; name: string; }
const APP_CATEGORIES: CategoryInfo[] = [
    { id: 'cat_contextual', name: 'Contextual' },
    { id: 'cat_food', name: 'Food' }, { id: 'cat_drinks', name: 'Drinks' },
    { id: 'cat_people', name: 'People' }, { id: 'cat_places', name: 'Places' },
    { id: 'cat_actions', name: 'Actions' }, { id: 'cat_feelings', name: 'Feelings' },
    { id: 'cat_animals', name: 'Animals' }, { id: 'cat_toys', name: 'Toys' },
    { id: 'cat_clothing', name: 'Clothing' }, { id: 'cat_body', name: 'Body Parts' },
    { id: 'cat_school', name: 'School' }, { id: 'cat_colors', name: 'Colors' },
    { id: 'cat_numbers', name: 'Numbers' },
    // Add more categories...
];
// --- End Category Definition ---

// --- Placeholder Symbol Fetching Logic ---
function getSymbolsForCategory(categoryName: string): string[] {
    console.log(`Placeholder: Fetching symbols for category "${categoryName}"`);
    const lowerCaseCat = categoryName.toLowerCase();
    switch (lowerCaseCat) {
        case 'food': return ['apple', 'banana', 'bread', 'water', 'milk', 'juice', 'eat', 'hungry', 'more', 'finished', 'orange', 'pizza', 'cookie', 'cake', 'cheese'];
        case 'drinks': return ['water', 'milk', 'juice', 'drink', 'thirsty', 'cup', 'bottle', 'soda', 'tea', 'coffee'];
        case 'people': return ['mom', 'dad', 'teacher', 'friend', 'boy', 'girl', 'baby', 'me', 'you', 'doctor', 'police', 'man', 'woman'];
        case 'animals': return ['dog', 'cat', 'bird', 'fish', 'bear', 'lion', 'horse', 'cow', 'pig', 'duck', 'frog'];
        case 'toys': return ['ball', 'doll', 'car', 'blocks', 'puzzle', 'play', 'game', 'bike', 'train', 'plane'];
        case 'places': return ['home', 'school', 'park', 'store', 'playground', 'house', 'room', 'outside', 'library', 'hospital'];
        case 'actions': return ['eat', 'drink', 'play', 'go', 'stop', 'want', 'help', 'look', 'listen', 'sleep', 'run', 'walk', 'jump', 'read', 'write', 'open', 'close', 'give', 'take', 'wash'];
        case 'feelings': return ['happy', 'sad', 'angry', 'scared', 'surprised', 'tired', 'hurt', 'sick', 'excited', 'love'];
        case 'clothing': return ['shirt', 'pants', 'shoes', 'socks', 'hat', 'jacket', 'dress', 'get dressed'];
        case 'body parts': return ['head', 'eyes', 'nose', 'mouth', 'ears', 'hands', 'feet', 'arms', 'legs', 'tummy'];
        case 'school': return ['school', 'teacher', 'book', 'pencil', 'paper', 'read', 'write', 'learn', 'bus', 'backpack', 'desk', 'chair'];
        case 'colors': return ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'color'];
        case 'numbers': return ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'number', 'count'];
        default: return [];
    }
}
// --- End Placeholder ---

interface ContextualSymbolData { id: string; keyword: string; }

const MemoizedSquareComponent = React.memo(SquareComponent);
const MemoizedCateComponent = React.memo(CateComponent);

// --- NavBarComponent ---
const NavBarComponent = () => {
  const [displayedSymbols, setDisplayedSymbols] = useState<ContextualSymbolData[]>([]);
  const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
  const [loadingSymbols, setLoadingSymbols] = useState<boolean>(true);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const flatListRefLeft = useRef<FlatList<ContextualSymbolData>>(null);
  const flatListRefRight = useRef<FlatList<CategoryInfo>>(null);

  const loadSymbols = useCallback((categoryFilter: string | null = null) => {
    setLoadingSymbols(true);
    flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });
    console.log(`*** loadSymbols called with Filter: ${categoryFilter} ***`);

    try {
        let symbolsData: ContextualSymbolData[] = [];
        let contextName: TimeContext | null = null;
        let categoryName: string | null = null;

        if (!categoryFilter || categoryFilter.toLowerCase() === 'contextual') {
            const context = getCurrentTimeContext();
            const keywords = getContextualSymbols(context);
            symbolsData = keywords.map((keyword, index) => ({ id: `ctx_${context}_${index}_${keyword}`, keyword }));
            contextName = context;
            categoryName = null;
            console.log(`Contextual symbols loaded for "${context}"`);
        } else {
            const keywords = getSymbolsForCategory(categoryFilter);
            symbolsData = keywords.map((keyword, index) => ({ id: `cat_${categoryFilter}_${index}_${keyword}`, keyword }));
            contextName = null;
            categoryName = categoryFilter;
            console.log(`Category symbols loaded for "${categoryFilter}"`);
        }

        console.log('==> Setting Selected Category Name to:', categoryName);
        setSelectedCategoryName(categoryName);
        console.log('==> Setting Displayed Symbols (count):', symbolsData.length);
        setDisplayedSymbols(symbolsData);
        console.log('==> Setting Current Time Context to:', contextName ?? 'Default');
        setCurrentTimeContext(contextName ?? 'Default');

    } catch (err) {
         console.error("Error loading symbols:", err);
         const defaultKeywords = getContextualSymbols('Default');
         setDisplayedSymbols(defaultKeywords.map((k, i) => ({ id: `ctx_err_${i}_${k}`, keyword: k })));
         setCurrentTimeContext('Default');
         setSelectedCategoryName(null);
         Alert.alert("Error", "Could not load symbols.");
    } finally {
        setLoadingSymbols(false);
        console.log('*** loadSymbols finished ***');
    }
  }, []);

  useEffect(() => {
    console.log('NavBarComponent Mounted - Initial Load');
    loadSymbols();
  }, [loadSymbols]);

  const handleCategoryPress = useCallback((categoryName: string) => {
     console.log(`--- Category Pressed: ${categoryName} ---`);
    if (categoryName.toLowerCase() === 'contextual') {
        loadSymbols(null);
    } else {
        loadSymbols(categoryName);
    }
  }, [loadSymbols]);

  const renderLeftItem = useCallback(({ item }: { item: ContextualSymbolData }) => (
    <View style={styles.squareItemContainer}>
      <MemoizedSquareComponent keyword={item.keyword} language="en" />
    </View>
  ), []);

  const renderRightItem = useCallback(({ item }: { item: CategoryInfo }) => {
    const isCurrentlySelected = selectedCategoryName === item.name || (!selectedCategoryName && item.name === 'Contextual');
    // console.log(`Rendering CateComponent: ${item.name}, isSelected: ${isCurrentlySelected}`);
    return (
        <View style={styles.rightItemContainer}>
        <MemoizedCateComponent
            keyword={item.name}
            language="en"
            onPress={handleCategoryPress}
            isSelected={isCurrentlySelected}
        />
        </View>
    );
  }, [handleCategoryPress, selectedCategoryName]);

  const navTitle = selectedCategoryName ? selectedCategoryName : `Contextual (${currentTimeContext})`;

  console.log(`<<< NavBarComponent Rendering - Selected Category: ${selectedCategoryName} >>>`);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => loadSymbols(null)} activeOpacity={0.7} style={styles.navBarTouchable}>
             <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">
                Symbols: {navTitle}
             </Text>
         </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.leftSide}>
          {loadingSymbols ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0077b6" />
            </View>
          ) : (
            <FlatList
              ref={flatListRefLeft}
              data={displayedSymbols}
              renderItem={renderLeftItem}
              keyExtractor={(item) => item.id}
              numColumns={6}
              contentContainerStyle={styles.gridContentContainer}
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols found.</Text></View>}
              initialNumToRender={18}
              maxToRenderPerBatch={12}
              windowSize={10}
              extraData={selectedCategoryName} // Helps trigger re-render
            />
          )}
        </View>
        <View style={styles.rightSide}>
           <FlatList
             ref={flatListRefRight}
             style={styles.categoryFlatList} // *** ADDED flex: 1 style ***
             data={APP_CATEGORIES}
             renderItem={renderRightItem}
             keyExtractor={(item) => item.id}
             numColumns={1}
             contentContainerStyle={styles.categoryListContainer}
             ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
             initialNumToRender={10}
             maxToRenderPerBatch={10}
             windowSize={5}
             extraData={selectedCategoryName} // Helps trigger re-render based on selection
           />
        </View>
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  navBar: {
    backgroundColor: '#0077b6',
    height: 35,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  navBarTouchable: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  navBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    flex: 1, // Ensure content takes up vertical space
  },
  leftSide: {
    flex: 8,
    backgroundColor: '#f8f9fa',
    // backgroundColor: 'lightblue', // DEBUG: Add background color
  },
  rightSide: {
    flex: 2.5,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    // backgroundColor: 'lightgreen', // DEBUG: Add background color
  },
  categoryFlatList: { // *** ADDED Style for the Right FlatList ***
      flex: 1, // *** Make FlatList expand to fill its parent (rightSide) ***
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  gridContentContainer: {
     padding: 8,
  },
  categoryListContainer: {
     paddingVertical: 0,
     paddingHorizontal: 0, // Let CateComponent handle padding
  },
  squareItemContainer: {
      margin: 5,
  },
  rightItemContainer: {
     // Let CateComponent handle background/border
     // Add separator style below if not using ItemSeparatorComponent
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0'
  },
  categorySeparator: { // Style for ItemSeparatorComponent
      height: 1,
      backgroundColor: '#f0f0f0',
       marginHorizontal: 15, // Optional indent
  },
  emptyListText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
  }
});

export default NavBarComponent;