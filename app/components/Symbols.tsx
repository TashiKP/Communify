// src/components/Symbols.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage
import SquareComponent from './SquareComponent';
import CateComponent from './CateComponent';
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../helpers/contextualSymbols';

// --- Storage Key for Custom Symbols (MUST MATCH CustomPageComponent) ---
const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';

// --- Category Definition ---
interface CategoryInfo { id: string; name: string; }
const APP_CATEGORIES: CategoryInfo[] = [
    { id: 'cat_contextual', name: 'Contextual' },
    { id: 'cat_custom', name: 'Custom' }, // <-- ADD CUSTOM CATEGORY
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

// --- Symbol Data Structures ---
// Structure for symbols loaded from Custom Storage
interface CustomSymbolItem {
    id: string;
    name: string;
    imageUri?: string;
}
// Unified structure for what's displayed in the grid
interface DisplayedSymbolData {
    id: string;
    keyword: string; // Use 'name' from CustomSymbolItem as keyword
    imageUri?: string; // URI for custom symbols
}
// --- End Symbol Data Structures ---


// --- Placeholder Symbol Fetching Logic (Keep as before) ---
function getSymbolsForCategory(categoryName: string): string[] {
    // console.log(`Placeholder: Fetching symbols for category "${categoryName}"`);
    const lowerCaseCat = categoryName.toLowerCase();
    // (Switch statement remains the same)
    switch (lowerCaseCat) { /* ... cases ... */ } return [];
}
// --- End Placeholder ---

interface SymbolGridProps {
    onSymbolPress: (keyword: string, imageUri?: string) => void; // <-- Modify signature
}

const MemoizedSquareComponent = React.memo(SquareComponent);
const MemoizedCateComponent = React.memo(CateComponent);

// --- SymbolGrid ---
const SymbolGrid: React.FC<SymbolGridProps> = ({ onSymbolPress }) => {
  const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]); // <-- Use unified structure
  const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]); // <-- State for custom symbols
  const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
  const [loadingSymbols, setLoadingSymbols] = useState<boolean>(true); // Combined loading state
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null); // Start with null

  const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
  const flatListRefRight = useRef<FlatList<CategoryInfo>>(null);

  // --- Load Custom Symbols on Mount ---
  useEffect(() => {
    let isMounted = true;
    const loadCustomSymbols = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
            if (isMounted && jsonValue !== null) {
                const loaded: CustomSymbolItem[] = JSON.parse(jsonValue);
                if (Array.isArray(loaded)) {
                    setCustomSymbols(loaded);
                    console.log(`SymbolGrid: Loaded ${loaded.length} custom symbols.`);
                }
            } else if (isMounted) {
                 setCustomSymbols([]); // Ensure it's empty if nothing loaded
            }
        } catch (e) {
            console.error('SymbolGrid: Failed to load custom symbols.', e);
             if (isMounted) setCustomSymbols([]);
            // Optionally show an alert, but might be annoying on every load failure
        }
    };
    loadCustomSymbols();
    return () => { isMounted = false; }
  }, []); // Load once on mount

  // --- Load Displayed Symbols (Contextual/Category/Custom) ---
  const loadSymbols = useCallback((categoryFilter: string | null = null) => {
    setLoadingSymbols(true);
    flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });
    // console.log(`SymbolGrid: loadSymbols called with Filter: ${categoryFilter}`);

    // Use setTimeout to allow state updates (like customSymbols) to potentially settle
    // and ensure loading indicator shows briefly.
    setTimeout(() => {
        try {
            let symbolsData: DisplayedSymbolData[] = [];
            let contextName: TimeContext | null = null;
            let categoryName: string | null = null;

            // --- Check for CUSTOM Category ---
            if (categoryFilter?.toLowerCase() === 'custom') {
                console.log("SymbolGrid: Loading CUSTOM symbols");
                symbolsData = customSymbols.map(cs => ({ // Map CustomSymbolItem to DisplayedSymbolData
                    id: cs.id,
                    keyword: cs.name, // Use name as the keyword
                    imageUri: cs.imageUri // Pass the imageUri
                }));
                categoryName = 'Custom';
                contextName = null;
            }
            // --- Check for CONTEXTUAL ---
            else if (!categoryFilter || categoryFilter.toLowerCase() === 'contextual') {
                console.log("SymbolGrid: Loading CONTEXTUAL symbols");
                const context = getCurrentTimeContext();
                const keywords = getContextualSymbols(context);
                symbolsData = keywords.map((keyword, index) => ({
                    id: `ctx_${context}_${index}_${keyword}`,
                    keyword,
                    imageUri: undefined // No specific URI for contextual/category
                }));
                categoryName = null;
                contextName = context;
            }
            // --- Load Standard Category ---
            else {
                console.log(`SymbolGrid: Loading category: ${categoryFilter}`);
                const keywords = getSymbolsForCategory(categoryFilter);
                symbolsData = keywords.map((keyword, index) => ({
                    id: `cat_${categoryFilter}_${index}_${keyword}`,
                    keyword,
                    imageUri: undefined
                }));
                categoryName = categoryFilter;
                contextName = null;
            }

            setSelectedCategoryName(categoryName); // Set selected category name
            setDisplayedSymbols(symbolsData);
            setCurrentTimeContext(contextName ?? 'Default');

        } catch (err) {
            console.error("SymbolGrid: Error processing symbols:", err);
            const defaultKeywords = getContextualSymbols('Default');
            setDisplayedSymbols(defaultKeywords.map((k, i) => ({ id: `ctx_err_${i}_${k}`, keyword: k })));
            setCurrentTimeContext('Default');
            setSelectedCategoryName(null); // Reset category on error
            Alert.alert("Error", "Could not load symbols.");
        } finally {
            setLoadingSymbols(false);
            // console.log('SymbolGrid: loadSymbols finished');
        }
    }, 50); // Short delay

  }, [customSymbols]); // <-- Re-run loadSymbols if customSymbols array changes

  // Initial Load Effect
  useEffect(() => {
    console.log('SymbolGrid Mounted - Initial Load');
    loadSymbols(); // Load default (contextual) on mount
  }, [loadSymbols]); // Depend only on loadSymbols


  // --- Category Press Handler ---
  const handleCategoryPress = useCallback((categoryName: string) => {
    // console.log(`SymbolGrid: Category Pressed - ${categoryName}`);
    // Check if already selected to prevent unnecessary loading
    if (categoryName === selectedCategoryName || (!selectedCategoryName && categoryName === 'Contextual')) {
        return;
    }

    if (categoryName.toLowerCase() === 'contextual') {
        loadSymbols(null);
    } else {
        loadSymbols(categoryName);
    }
  }, [loadSymbols, selectedCategoryName]);


  // --- Render Symbol Item ---
  const renderLeftItem = useCallback(({ item }: { item: DisplayedSymbolData }) => (
    <View style={styles.squareItemContainer}>
      <MemoizedSquareComponent
          keyword={item.keyword}
          language="en"
          imageUri={item.imageUri} // <-- Pass optional imageUri
          // --- Pass keyword AND imageUri to handler ---
          onPress={(keyword) => onSymbolPress(keyword, item.imageUri)} // Pass imageUri back too
          // -------------------------------------------
      />
    </View>
  // Add onSymbolPress dependency
  ), [onSymbolPress]);


  // --- Render Category Item ---
  const renderRightItem = useCallback(({ item }: { item: CategoryInfo }) => {
    const isCurrentlySelected =
        (selectedCategoryName === item.name) || // Selected is this category name
        (!selectedCategoryName && item.name.toLowerCase() === 'contextual'); // Nothing selected AND this is Contextual
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

  // Determine NavBar Title
  const navTitle = selectedCategoryName ? selectedCategoryName : `Contextual (${currentTimeContext})`;

  // console.log(`<<< SymbolGrid Rendering - Selected Category: ${selectedCategoryName} >>>`); // DEBUG

  return (
    <View style={styles.container}>
      {/* Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => loadSymbols(null)} activeOpacity={0.7} style={styles.navBarTouchable}>
             <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">
                Symbols: {navTitle}
             </Text>
         </TouchableOpacity>
      </View>
      {/* Content */}
      <View style={styles.content}>
        {/* Left Side (Symbols Grid) */}
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
              keyExtractor={(item) => item.id} // Use the unified ID
              numColumns={6} // Adjust as needed
              contentContainerStyle={styles.gridContentContainer}
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols found.</Text></View>}
              initialNumToRender={18}
              maxToRenderPerBatch={12}
              windowSize={10}
              removeClippedSubviews={true}
            />
          )}
        </View>
        {/* Right Side (Categories) */}
        <View style={styles.rightSide}>
           <FlatList
             ref={flatListRefRight}
             style={styles.categoryFlatList}
             data={APP_CATEGORIES}
             renderItem={renderRightItem}
             keyExtractor={(item) => item.id}
             numColumns={1}
             contentContainerStyle={styles.categoryListContainer}
             ItemSeparatorComponent={() => <View style={styles.categorySeparator} />} // Optional separator
             initialNumToRender={APP_CATEGORIES.length}
             maxToRenderPerBatch={APP_CATEGORIES.length}
             windowSize={5}
             extraData={selectedCategoryName} // Re-render list when selection changes
           />
        </View>
      </View>
    </View>
  );
};

// --- Styles (Keep as before) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f9ff', },
    navBar: { backgroundColor: '#0077b6', height: 35, width: '100%', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3, zIndex: 10, },
    navBarTouchable: { paddingHorizontal: 15, paddingVertical: 5, },
    navBarTitle: { color: '#fff', fontSize: 16, fontWeight: '600', },
    content: { flexDirection: 'row', flex: 1, },
    leftSide: { flex: 8, backgroundColor: '#f8f9fa', },
    rightSide: { flex: 2.5, backgroundColor: '#ffffff', borderLeftWidth: 1, borderLeftColor: '#e0e0e0', },
    categoryFlatList: { flex: 1, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200, },
    gridContentContainer: { padding: 5, alignItems: 'flex-start', },
    categoryListContainer: { paddingVertical: 0, paddingHorizontal: 0, },
    squareItemContainer: { margin: 4, },
    rightItemContainer: { /* Let CateComponent handle borders/styles */ },
    categorySeparator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 15, }, // Keep if desired
    emptyListText: { textAlign: 'center', fontSize: 16, color: '#6c757d', }
});

export default SymbolGrid;