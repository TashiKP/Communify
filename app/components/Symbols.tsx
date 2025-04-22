// src/components/Symbols.tsx
import React, {
    useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle
} from 'react';
import {
    View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SquareComponent from './SquareComponent'; // Adjust path if needed
import CateComponent from './CateComponent'; // Adjust path if needed
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols'; // Adjust path if needed
import { useGrid, GridLayoutType } from '../context/GridContext'; // Adjust path if needed
import { defaultCategoryData } from '../data/defaultCategorySymbols'; // <-- IMPORT DEFAULT DATA (Adjust path if needed)

// --- Constants & Calculations ---
const screenWidth = Dimensions.get('window').width;
// Function to determine number of columns based on layout preference
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 4;
        case 'standard': return 6; // Default number of columns for standard layout
        case 'dense': return 8;
        default: return 6;
    }
};
// Function to calculate width of individual symbol items
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const leftPanelFlex = 8; // Flex value for the symbol grid side
    const rightPanelFlex = 2.5; // Flex value for the category list side
    const totalFlex = leftPanelFlex + rightPanelFlex;
    // Calculate approximate width available for the left panel based on flex ratio
    const approxLeftPanelWidth = screenWidth * (leftPanelFlex / totalFlex);

    const gridPadding = 5;   // Match gridContentContainer paddingHorizontal
    const itemMargin = 4;    // Match squareItemContainer margin
    const totalMargins = itemMargin * 2 * numCols;
    const totalPadding = gridPadding * 2;
    const availableWidth = approxLeftPanelWidth - totalPadding - totalMargins;
    return Math.max(75, Math.floor(availableWidth / numCols)); // Ensure a minimum reasonable size
};
// --------------------------------

// --- Storage Keys ---
const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';
const STANDARD_CATEGORY_DATA_KEY = '@Communify:standardCategoryData';

// --- Category Definition ---
interface CategoryInfo { id: string; name: string; isStandard?: boolean }
const APP_CATEGORIES: CategoryInfo[] = [
    { id: 'cat_contextual', name: 'Contextual', isStandard: false },
    { id: 'cat_custom', name: 'Custom', isStandard: false },
    { id: 'cat_food', name: 'Food', isStandard: true },
    { id: 'cat_drinks', name: 'Drinks', isStandard: true },
    { id: 'cat_people', name: 'People', isStandard: true },
    { id: 'cat_places', name: 'Places', isStandard: true },
    { id: 'cat_actions', name: 'Actions', isStandard: true },
    { id: 'cat_feelings', name: 'Feelings', isStandard: true },
    { id: 'cat_animals', name: 'Animals', isStandard: true },
    { id: 'cat_toys', name: 'Toys', isStandard: true },
    { id: 'cat_clothing', name: 'Clothing', isStandard: true },
    { id: 'cat_body', name: 'Body Parts', isStandard: true },
    { id: 'cat_school', name: 'School', isStandard: true },
    { id: 'cat_colors', name: 'Colors', isStandard: true },
    { id: 'cat_numbers', name: 'Numbers', isStandard: true },
];
// --- End Category Definition ---

// --- Symbol Data Structures ---
interface CustomSymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; }
interface DisplayedSymbolData { id: string; keyword: string; imageUri?: string; }
// --- End Symbol Data Structures ---

// --- Component Props ---
interface SymbolGridProps {
    onSymbolPress: (keyword: string, imageUri?: string) => void;
}

// --- Exposed Imperative Handle Methods ---
export interface SymbolGridRef {
    addKeywordToCategory: (categoryName: string, keywordToAdd: string) => void;
    selectedCategoryName: string | null;
}
// --- End Imperative Handle ---

// Memoized Components
const MemoizedSquareComponent = React.memo(SquareComponent);
const MemoizedCateComponent = React.memo(CateComponent);

// --- SymbolGrid Component (Wrapped with forwardRef) ---
const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(({ onSymbolPress }, ref) => {
    // --- Context ---
    const { gridLayout, isLoadingLayout } = useGrid();

    // --- Calculate Dynamic Values ---
    const numGridColumns = getNumColumns(gridLayout);
    const itemWidth = calculateItemWidth(gridLayout, numGridColumns);

    // --- State ---
    const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
    const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]);
    const [categorySymbolMap, setCategorySymbolMap] = useState<Map<string, string[]>>(new Map()); // Map: categoryNameLower -> keywords[]
    const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
    const [loadingGridContent, setLoadingGridContent] = useState<boolean>(true); // Combined loading
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null); // Start null (contextual)

    // Refs
    const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
    const flatListRefRight = useRef<FlatList<CategoryInfo>>(null);
    const initialLoadComplete = useRef({ customSymbols: false, categories: false }).current; // Track loading state

    // --- Load Custom Symbols ---
    useEffect(() => {
        let isMounted = true;
        const loadCustom = async () => {
             if (!isMounted) return; initialLoadComplete.customSymbols = false; // Mark as not loaded yet
            try {
                const val = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
                if(isMounted && val){
                    const loaded = JSON.parse(val);
                    if(Array.isArray(loaded)) setCustomSymbols(loaded);
                } else if(isMounted) setCustomSymbols([]);
            } catch(e){
                console.error('SymbolGrid: Failed load custom symbols.', e);
                if(isMounted) setCustomSymbols([]);
            } finally {
                if(isMounted) initialLoadComplete.customSymbols = true; // Mark as loaded
            }
        };
        loadCustom();
        return () => { isMounted = false; };
    }, []);

    // --- Load/Initialize STANDARD Category Data ---
    useEffect(() => {
        let isMounted = true;
        const loadCategoryData = async () => {
            if (!isMounted) return; setLoadingGridContent(true); initialLoadComplete.categories = false;
            try {
                const jsonValue = await AsyncStorage.getItem(STANDARD_CATEGORY_DATA_KEY);
                const loadedMap = new Map<string, string[]>();
                let needsSave = false;
                if (jsonValue !== null) {
                    const parsed = JSON.parse(jsonValue);
                    if (typeof parsed === 'object' && parsed !== null) { Object.entries(parsed).forEach(([key, value]) => { if (Array.isArray(value)) loadedMap.set(key, value as string[]); }); }
                    else { console.warn("SymbolGrid: Invalid category data format in storage."); needsSave = true; }
                } else { console.log("SymbolGrid: No standard category data in storage, initializing defaults."); needsSave = true; }

                // --- Use Imported Data for Defaults ---
                APP_CATEGORIES.forEach(cat => {
                    if (cat.isStandard) {
                        const categoryKey = cat.name.toLowerCase();
                        if (!loadedMap.has(categoryKey)) {
                            const defaultKeywords = defaultCategoryData[categoryKey] || []; // Get defaults from imported object
                            loadedMap.set(categoryKey, defaultKeywords);
                            console.log(`SymbolGrid: Initializing default symbols for ${cat.name} from data file.`);
                            needsSave = true;
                        }
                    }
                });
                // ---------------------------------------

                if (isMounted) {
                    setCategorySymbolMap(loadedMap);
                    if (needsSave) { await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(loadedMap))); console.log("SymbolGrid: Saved initial/updated default category data."); }
                }
            } catch (e) {
                console.error('SymbolGrid: Failed to load/initialize standard category data.', e);
                // --- Fallback using imported data ---
                const defaultMap = new Map<string, string[]>();
                APP_CATEGORIES.forEach(cat => { if (cat.isStandard) { const key = cat.name.toLowerCase(); defaultMap.set(key, defaultCategoryData[key] || []); }});
                if (isMounted) setCategorySymbolMap(defaultMap);
                Alert.alert("Load Error", "Could not load category data. Using defaults.");
                // -----------------------------------
            } finally {
                if (isMounted) {
                    initialLoadComplete.categories = true;
                    // Trigger loadSymbols only after category data state is set
                    // It will use selectedCategoryName state which is initially null
                    loadSymbols(null);
                }
            }
        };
        loadCategoryData();
        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [/* Run once, loadSymbols depends on map */]);


    // --- Save STANDARD Category Data Effect ---
    useEffect(() => {
        // Prevent saving before initial load or if map is empty
        if (!initialLoadComplete.categories || categorySymbolMap.size === 0) return;

        const saveCategoryData = async () => {
            try {
                const objectToSave = Object.fromEntries(categorySymbolMap);
                const jsonValue = JSON.stringify(objectToSave);
                await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, jsonValue);
                // console.log(`SymbolGrid: Saved ${categorySymbolMap.size} standard categories.`); // Reduce console noise
            } catch (e) {
                console.error('SymbolGrid: Failed to save standard category data.', e);
                Alert.alert('Save Error', 'Could not save category changes.');
            }
        };
        // Debounce saving slightly
        const timerId = setTimeout(saveCategoryData, 500);
        return () => clearTimeout(timerId);

    }, [categorySymbolMap]); // Save whenever the map state changes


    // --- Load Displayed Symbols ---
    const loadSymbols = useCallback((categoryFilter: string | null = null) => {
         if (!initialLoadComplete.categories || !initialLoadComplete.customSymbols) {
             console.log("SymbolGrid: Waiting for initial data before loading symbols...");
             setLoadingGridContent(true); return;
         }
        setLoadingGridContent(true);
        flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

        setTimeout(() => { // Short timeout allows loading indicator to show
            try {
                let symbolsData: DisplayedSymbolData[] = [];
                let contextName: TimeContext | null = null;
                let categoryName: string | null = null;
                const filterLower = categoryFilter?.toLowerCase();

                if (filterLower === 'custom') {
                    categoryName = 'Custom';
                    symbolsData = customSymbols.map(cs => ({ id: cs.id, keyword: cs.name, imageUri: cs.imageUri }));
                } else if (!filterLower || filterLower === 'contextual') {
                    categoryName = null; contextName = getCurrentTimeContext();
                    const keywords = getContextualSymbols(contextName);
                    symbolsData = keywords.map((kw: any, idx: any) => ({ id: `ctx_${contextName}_${idx}_${kw}`, keyword: kw }));
                } else {
                    categoryName = categoryFilter; // Keep original casing for display name
                    const keywords = categorySymbolMap.get(filterLower) || []; // Get from state map
                    symbolsData = keywords.map((kw, idx) => ({ id: `cat_${categoryName}_${idx}_${kw}`, keyword: kw }));
                }

                symbolsData.sort((a, b) => a.keyword.localeCompare(b.keyword)); // Sort alphabetically
                setSelectedCategoryName(categoryName); setDisplayedSymbols(symbolsData); setCurrentTimeContext(contextName ?? 'Default');

            } catch (err) { console.error("SymbolGrid: Error processing symbols:", err); const defaultKeywords = getContextualSymbols('Default'); setDisplayedSymbols(defaultKeywords.map((k: any, i: any) => ({ id: `ctx_err_${i}_${k}`, keyword: k }))); setCurrentTimeContext('Default'); setSelectedCategoryName(null); Alert.alert("Error", "Could not load symbols."); }
            finally { setLoadingGridContent(false); }
        }, 50);

    }, [customSymbols, categorySymbolMap, initialLoadComplete.categories, initialLoadComplete.customSymbols]); // Dependencies


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
                language="en"
                imageUri={item.imageUri}
                size={itemWidth}
                onPress={(keyword) => onSymbolPress(keyword, item.imageUri)}
            />
        </View>
    ), [onSymbolPress, itemWidth]);

    // --- Render Category Item ---
    const renderRightItem = useCallback(({ item }: { item: CategoryInfo }) => {
        const isSelected = (selectedCategoryName === item.name) || (!selectedCategoryName && item.name.toLowerCase() === 'contextual');
        return ( <View style={styles.rightItemContainer}><MemoizedCateComponent keyword={item.name} language="en" onPress={handleCategoryPress} isSelected={isSelected} /></View> );
    }, [handleCategoryPress, selectedCategoryName]);


    // --- Function to Add Keyword to Category ---
    const addKeywordToCategory = useCallback((categoryName: string | null, keywordToAdd: string) => {
        if (!categoryName) { console.warn("SymbolGrid: Cannot add keyword, no category selected."); return; }
        const categoryNameLower = categoryName.toLowerCase();
        const isStandard = APP_CATEGORIES.find(c => c.name.toLowerCase() === categoryNameLower)?.isStandard;
        if (!isStandard) { Alert.alert("Cannot Add", `Symbols can only be added to standard categories (like Food, Animals), not '${categoryName}'.`); return; }

        setCategorySymbolMap(prevMap => {
            const currentKeywords = prevMap.get(categoryNameLower) || [];
            const keywordLower = keywordToAdd.toLowerCase();
            if (currentKeywords.some(kw => kw.toLowerCase() === keywordLower)) { Alert.alert("Already Exists", `"${keywordToAdd}" is already in ${categoryName}.`); return prevMap; }
            const updatedKeywords = [...currentKeywords, keywordToAdd];
            const newMap = new Map(prevMap); newMap.set(categoryNameLower, updatedKeywords);
            console.log(`SymbolGrid: Added "${keywordToAdd}" to category "${categoryName}".`);
             Alert.alert("Symbol Added", `"${keywordToAdd}" added to ${categoryName}.`);
            if (selectedCategoryName === categoryName) { const sortedData = updatedKeywords.map((kw, idx) => ({ id: `cat_${categoryName}_${idx}_${kw}`, keyword: kw })).sort((a,b)=> a.keyword.localeCompare(b.keyword)); setDisplayedSymbols(sortedData); }
            return newMap; // Triggers save effect
        });
     }, [selectedCategoryName]);

    // --- Expose Methods/State via Imperative Handle ---
    useImperativeHandle(ref, () => ({
        addKeywordToCategory,
        selectedCategoryName,
    }), [addKeywordToCategory, selectedCategoryName]);


    // --- Nav Title & Loading State ---
    const navTitle = selectedCategoryName ? selectedCategoryName : `Contextual (${currentTimeContext})`;
    const isLoading = isLoadingLayout || !initialLoadComplete.categories || !initialLoadComplete.customSymbols || loadingGridContent;

    return (
        <View style={styles.container}>
            {/* Nav Bar */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => loadSymbols(null)} activeOpacity={0.7} style={styles.navBarTouchable}>
                    <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">Symbols: {navTitle}</Text>
                </TouchableOpacity>
            </View>
            {/* Content */}
            <View style={styles.content}>
                {/* Left Side (Symbols Grid) */}
                <View style={styles.leftSide}>
                    {isLoading ? ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0077b6" /></View> ) : (
                        <FlatList
                            ref={flatListRefLeft}
                            data={displayedSymbols}
                            renderItem={renderLeftItem}
                            keyExtractor={(item) => `${item.id}-${gridLayout}`}
                            numColumns={numGridColumns}
                            key={numGridColumns.toString()}
                            contentContainerStyle={styles.gridContentContainer}
                            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols in this category.</Text></View>}
                            initialNumToRender={numGridColumns * 3}
                            maxToRenderPerBatch={numGridColumns * 2}
                            windowSize={10}
                            removeClippedSubviews={Platform.OS === 'android'}
                            extraData={itemWidth + displayedSymbols.length}
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
                     ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
                     initialNumToRender={APP_CATEGORIES.length}
                     maxToRenderPerBatch={APP_CATEGORIES.length}
                     windowSize={5}
                     extraData={selectedCategoryName}
                   />
                </View>
            </View>
        </View>
    );
}); // End of forwardRef

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