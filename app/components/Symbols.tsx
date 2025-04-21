// src/components/Symbols.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SquareComponent from './SquareComponent';
import CateComponent from './CateComponent';
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols';
import { useGrid, GridLayoutType } from '../context/GridContext'; // <-- Import context hook and type

// --- Constants for Columns based on Layout Type ---
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 4; // Fewer columns for simple
        case 'standard': return 6; // Standard
        case 'dense': return 8; // More columns for dense
        default: return 6;
    }
};

// --- Storage Key for Custom Symbols ---
const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';

// --- Category Definition ---
interface CategoryInfo { id: string; name: string; }
const APP_CATEGORIES: CategoryInfo[] = [
    { id: 'cat_contextual', name: 'Contextual' },
    { id: 'cat_custom', name: 'Custom' }, // <-- Added CUSTOM CATEGORY
    { id: 'cat_food', name: 'Food' }, { id: 'cat_drinks', name: 'Drinks' },
    { id: 'cat_people', name: 'People' }, { id: 'cat_places', name: 'Places' },
    { id: 'cat_actions', name: 'Actions' }, { id: 'cat_feelings', name: 'Feelings' },
    { id: 'cat_animals', name: 'Animals' }, { id: 'cat_toys', name: 'Toys' },
    { id: 'cat_clothing', name: 'Clothing' }, { id: 'cat_body', name: 'Body Parts' },
    { id: 'cat_school', name: 'School' }, { id: 'cat_colors', name: 'Colors' },
    { id: 'cat_numbers', name: 'Numbers' },
];
// --- End Category Definition ---


// --- Symbol Data Structures ---
interface CustomSymbolItem { id: string; name: string; imageUri?: string; }
interface DisplayedSymbolData { id: string; keyword: string; imageUri?: string; }
// --- End Symbol Data Structures ---


// --- Placeholder Symbol Fetching Logic ---
function getSymbolsForCategory(categoryName: string): string[] {
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

// --- Component Props ---
interface SymbolGridProps {
    onSymbolPress: (keyword: string, imageUri?: string) => void; // Updated signature
}

// Memoized Components
const MemoizedSquareComponent = React.memo(SquareComponent);
const MemoizedCateComponent = React.memo(CateComponent);

// --- SymbolGrid ---
const SymbolGrid: React.FC<SymbolGridProps> = ({ onSymbolPress }) => {
    // --- Use Context ---
    const { gridLayout, isLoadingLayout } = useGrid();
    // -----------------

    // --- State ---
    const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
    const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]);
    const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
    const [loadingGridContent, setLoadingGridContent] = useState<boolean>(true); // Loading state for symbols/categories
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null); // Default to contextual

    // Refs
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
                } else if (isMounted) { setCustomSymbols([]); }
            } catch (e) { console.error('SymbolGrid: Failed load custom symbols.', e); if (isMounted) setCustomSymbols([]); }
        };
        loadCustomSymbols();
        return () => { isMounted = false; }
    }, []);

    // --- Load Displayed Symbols (Contextual/Category/Custom) ---
    const loadSymbols = useCallback((categoryFilter: string | null = null) => {
        setLoadingGridContent(true);
        flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

        // Use setTimeout to ensure loading state updates UI before potentially heavy mapping
        setTimeout(() => {
            try {
                let symbolsData: DisplayedSymbolData[] = [];
                let contextName: TimeContext | null = null;
                let categoryName: string | null = null;

                if (categoryFilter?.toLowerCase() === 'custom') {
                    categoryName = 'Custom';
                    symbolsData = customSymbols.map(cs => ({ id: cs.id, keyword: cs.name, imageUri: cs.imageUri }));
                } else if (!categoryFilter || categoryFilter.toLowerCase() === 'contextual') {
                    categoryName = null; // Explicitly null for Contextual
                    contextName = getCurrentTimeContext();
                    const keywords = getContextualSymbols(contextName);
                    symbolsData = keywords.map((kw: any, idx: any) => ({ id: `ctx_${contextName}_${idx}_${kw}`, keyword: kw, imageUri: undefined }));
                } else {
                    categoryName = categoryFilter;
                    const keywords = getSymbolsForCategory(categoryFilter);
                    symbolsData = keywords.map((kw, idx) => ({ id: `cat_${categoryFilter}_${idx}_${kw}`, keyword: kw, imageUri: undefined }));
                }

                setSelectedCategoryName(categoryName);
                setDisplayedSymbols(symbolsData);
                setCurrentTimeContext(contextName ?? 'Default');

            } catch (err) {
                console.error("SymbolGrid: Error processing symbols:", err);
                // Fallback logic
                const defaultKeywords = getContextualSymbols('Default');
                setDisplayedSymbols(defaultKeywords.map((k: any, i: any) => ({ id: `ctx_err_${i}_${k}`, keyword: k })));
                setCurrentTimeContext('Default');
                setSelectedCategoryName(null);
                Alert.alert("Error", "Could not load symbols.");
            } finally {
                setLoadingGridContent(false);
            }
        }, 50);

    }, [customSymbols]); // Re-run if customSymbols change

    // Initial Load Effect
    useEffect(() => {
        loadSymbols(); // Load default (contextual) on mount
    }, [loadSymbols]);

    // --- Category Press Handler ---
    const handleCategoryPress = useCallback((categoryName: string) => {
        const currentSelection = selectedCategoryName ?? 'Contextual';
        if (categoryName === currentSelection) return; // Avoid reloading same category

        if (categoryName.toLowerCase() === 'contextual') loadSymbols(null);
        else loadSymbols(categoryName);

    }, [loadSymbols, selectedCategoryName]);

    // --- Render Symbol Item ---
    const renderLeftItem = useCallback(({ item }: { item: DisplayedSymbolData }) => (
        <View style={styles.squareItemContainer}>
            <MemoizedSquareComponent
                keyword={item.keyword}
                language="en" // Or use state/prop
                imageUri={item.imageUri} // Pass optional imageUri
                onPress={(keyword) => onSymbolPress(keyword, item.imageUri)} // Pass imageUri back too
            />
        </View>
    ), [onSymbolPress]); // Add onSymbolPress dependency

    // --- Render Category Item ---
    const renderRightItem = useCallback(({ item }: { item: CategoryInfo }) => {
        const isSelected = (selectedCategoryName === item.name) || (!selectedCategoryName && item.name.toLowerCase() === 'contextual');
        return (
            <View style={styles.rightItemContainer}>
                <MemoizedCateComponent
                    keyword={item.name}
                    language="en"
                    onPress={handleCategoryPress}
                    isSelected={isSelected}
                />
            </View>
        );
    }, [handleCategoryPress, selectedCategoryName]);

    // Determine NavBar Title
    const navTitle = selectedCategoryName ? selectedCategoryName : `Contextual (${currentTimeContext})`;
    const numGridColumns = getNumColumns(gridLayout); // Calculate columns based on context

    // Combined Loading State (Checks context loading AND grid content loading)
    const isLoading = isLoadingLayout || loadingGridContent;

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
                    {isLoading ? (
                        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0077b6" /></View>
                    ) : (
                        <FlatList
                            ref={flatListRefLeft}
                            data={displayedSymbols}
                            renderItem={renderLeftItem}
                            keyExtractor={(item) => `${item.id}-${gridLayout}`} // Key includes layout
                            numColumns={numGridColumns} // Use dynamic columns
                            key={numGridColumns.toString()} // Force remount on column change
                            contentContainerStyle={styles.gridContentContainer}
                            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols in this category.</Text></View>}
                            initialNumToRender={numGridColumns * 3}
                            maxToRenderPerBatch={numGridColumns * 2}
                            windowSize={10}
                            removeClippedSubviews={true}
                            extraData={gridLayout} // Ensure update on layout change
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
                        // ItemSeparatorComponent={() => <View style={styles.categorySeparator} />} // Optional separator
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

// --- Styles ---
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
    rightItemContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
    categorySeparator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 15, },
    emptyListText: { textAlign: 'center', fontSize: 16, color: '#6c757d', }
});

export default SymbolGrid;