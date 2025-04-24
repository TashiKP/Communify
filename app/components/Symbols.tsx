// src/components/Symbols.tsx
import React, {
    useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo
} from 'react';
import {
    View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Import Components & Context ---
import SquareComponent from './SquareComponent'; // Adjust path if needed
import CateComponent from './CateComponent'; // Adjust path if needed
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols'; // Adjust path if needed
import { useGrid, GridLayoutType } from '../context/GridContext'; // Adjust path if needed
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path if needed
import { defaultCategoryData } from '../data/defaultCategorySymbols'; // Adjust path if needed

// --- Constants & Calculations ---
const screenWidth = Dimensions.get('window').width;

const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 4;
        case 'standard': return 6;
        case 'dense': return 8;
        default: return 6;
    }
};

const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const leftPanelFlex = 8;
    const rightPanelFlex = 2.5;
    const totalFlex = leftPanelFlex + rightPanelFlex;
    const approxLeftPanelWidth = screenWidth * (leftPanelFlex / totalFlex);

    const gridPadding = 5;
    const itemMargin = 4;
    const totalMargins = itemMargin * 2 * numCols;
    const totalPadding = gridPadding * 2;
    const availableWidth = approxLeftPanelWidth - totalPadding - totalMargins;

    const minSizeBasedOnLayout = layout === 'simple' ? 90 : layout === 'standard' ? 75 : 60;
    return Math.max(minSizeBasedOnLayout, Math.floor(availableWidth / numCols));
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

// --- Symbol Data Structures ---
interface CustomSymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; }
interface DisplayedSymbolData { id: string; keyword: string; imageUri?: string; }

// --- Component Props ---
interface SymbolGridProps {
    onSymbolPress: (keyword: string, imageUri?: string) => void;
}

// --- Exposed Imperative Handle Methods ---
export interface SymbolGridRef {
    addKeywordToCategory: (categoryName: string | null, keywordToAdd: string) => void;
    selectedCategoryName: string | null;
}

// --- Memoized Components ---
const MemoizedSquareComponent = React.memo(SquareComponent);
const MemoizedCateComponent = React.memo(CateComponent);

// --- SymbolGrid Component (Wrapped with forwardRef) ---
const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(({ onSymbolPress }, ref) => {
    // --- Context Hooks ---
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance();

    // --- Dynamic Calculations based on Context ---
    const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

    // --- State ---
    const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
    const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]);
    const [categorySymbolMap, setCategorySymbolMap] = useState<Map<string, string[]>>(new Map());
    const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [loadingCustom, setLoadingCustom] = useState<boolean>(true);
    const [loadingSymbols, setLoadingSymbols] = useState<boolean>(true);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

    // Refs
    const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
    const flatListRefRight = useRef<FlatList<CategoryInfo>>(null);

    // --- Combined Loading State ---
    const isLoadingInitialData = isLoadingAppearance || isLoadingGridLayout || loadingCategories || loadingCustom;

    // --- Load Custom Symbols ---
    useEffect(() => {
        let isMounted = true;
        setLoadingCustom(true);
        const loadCustom = async () => {
            try {
                const val = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
                if (isMounted) {
                    const loaded = val ? JSON.parse(val) : [];
                    if (Array.isArray(loaded)) setCustomSymbols(loaded);
                    else setCustomSymbols([]);
                }
            } catch (e) {
                console.error('SymbolGrid: Failed load custom symbols.', e);
                if (isMounted) setCustomSymbols([]);
            } finally {
                if (isMounted) setLoadingCustom(false);
            }
        };
        loadCustom();
        return () => { isMounted = false; };
    }, []);

    // --- Load/Initialize STANDARD Category Data ---
    useEffect(() => {
        let isMounted = true;
        setLoadingCategories(true);
        const loadCategoryData = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem(STANDARD_CATEGORY_DATA_KEY);
                const loadedMap = new Map<string, string[]>();
                let needsSave = false;
                if (jsonValue !== null) {
                    try {
                        const parsed = JSON.parse(jsonValue);
                        if (typeof parsed === 'object' && parsed !== null) { Object.entries(parsed).forEach(([key, value]) => { if (Array.isArray(value)) loadedMap.set(key, value as string[]); }); }
                        else { console.warn("SymbolGrid: Invalid category data format in storage."); needsSave = true; }
                    } catch (parseError) { console.error("SymbolGrid: Error parsing category data, re-initializing.", parseError); needsSave = true; }
                } else { console.log("SymbolGrid: No standard category data in storage, initializing defaults."); needsSave = true; }

                APP_CATEGORIES.forEach(cat => {
                    if (cat.isStandard) {
                        const categoryKey = cat.name.toLowerCase();
                        if (!loadedMap.has(categoryKey)) {
                            const defaultKeywords = defaultCategoryData[categoryKey] || [];
                            loadedMap.set(categoryKey, defaultKeywords);
                            console.log(`SymbolGrid: Initializing default symbols for ${cat.name} from data file.`);
                            needsSave = true;
                        }
                    }
                });

                if (isMounted) {
                    setCategorySymbolMap(loadedMap);
                    if (needsSave) { await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(loadedMap))); console.log("SymbolGrid: Saved initial/updated default category data."); }
                }
            } catch (e) {
                console.error('SymbolGrid: Failed to load/initialize standard category data.', e);
                const defaultMap = new Map<string, string[]>();
                APP_CATEGORIES.forEach(cat => { if (cat.isStandard) { const key = cat.name.toLowerCase(); defaultMap.set(key, defaultCategoryData[key] || []); }});
                if (isMounted) setCategorySymbolMap(defaultMap);
                Alert.alert("Load Error", "Could not load category data. Using defaults.");
            } finally {
                if (isMounted) {
                    setLoadingCategories(false);
                }
            }
        };
        loadCategoryData();
        return () => { isMounted = false; };
    }, []);

    // --- Save STANDARD Category Data Effect (Debounced) ---
    useEffect(() => {
        if (loadingCategories || categorySymbolMap.size === 0) return;

        const saveCategoryData = async () => {
            try {
                const objectToSave = Object.fromEntries(categorySymbolMap);
                const jsonValue = JSON.stringify(objectToSave);
                await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, jsonValue);
            } catch (e) { console.error('SymbolGrid: Failed to save standard category data.', e); Alert.alert('Save Error', 'Could not save category changes.'); }
        };
        const timerId = setTimeout(saveCategoryData, 750);
        return () => clearTimeout(timerId);
    }, [categorySymbolMap, loadingCategories]);


    // --- Load Displayed Symbols ---
    const loadSymbols = useCallback((categoryFilter: string | null = null) => {
         if (isLoadingInitialData) {
            setLoadingSymbols(true); return;
         }
        setLoadingSymbols(true);
        flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

        requestAnimationFrame(() => {
            try {
                let symbolsData: DisplayedSymbolData[] = [];
                let contextName: TimeContext | null = null;
                let categoryNameForState: string | null = null;
                const filterLower = categoryFilter?.toLowerCase();

                if (filterLower === 'custom') {
                    categoryNameForState = 'Custom';
                    symbolsData = customSymbols.map(cs => ({ id: cs.id, keyword: cs.name, imageUri: cs.imageUri }));
                } else if (!filterLower || filterLower === 'contextual') {
                    categoryNameForState = null;
                    contextName = getCurrentTimeContext();
                    const keywords = getContextualSymbols(contextName);
                    symbolsData = keywords.map((kw: string, idx: number) => ({ id: `ctx_${contextName}_${idx}_${kw}`, keyword: kw }));
                } else {
                    categoryNameForState = categoryFilter;
                    const keywords = categorySymbolMap.get(filterLower) || [];
                    symbolsData = keywords.map((kw, idx) => ({ id: `cat_${categoryNameForState}_${idx}_${kw}`, keyword: kw }));
                }

                symbolsData.sort((a, b) => a.keyword.localeCompare(b.keyword));
                setSelectedCategoryName(categoryNameForState);
                setDisplayedSymbols(symbolsData);
                setCurrentTimeContext(contextName ?? 'Default');

            } catch (err) {
                console.error("SymbolGrid: Error processing symbols:", err);
                const defaultKeywords = getContextualSymbols('Default');
                setDisplayedSymbols(defaultKeywords.map((k: string, i: number) => ({ id: `ctx_err_${i}_${k}`, keyword: k })));
                setCurrentTimeContext('Default');
                setSelectedCategoryName(null);
                Alert.alert("Error", "Could not load symbols.");
            } finally {
                setLoadingSymbols(false);
            }
        });

    }, [customSymbols, categorySymbolMap, isLoadingInitialData]);

    // --- Initial Symbol Load ---
    useEffect(() => {
        if (!isLoadingInitialData) {
            loadSymbols(selectedCategoryName);
        }
    }, [isLoadingInitialData, loadSymbols, selectedCategoryName]);


    // --- Category Press Handler ---
    const handleCategoryPress = useCallback((categoryName: string) => {
        const currentSelectionKey = selectedCategoryName?.toLowerCase() ?? 'contextual';
        const newSelectionKey = categoryName.toLowerCase();
        if (newSelectionKey === currentSelectionKey) return;
        if (newSelectionKey === 'contextual') loadSymbols(null);
        else loadSymbols(categoryName);
    }, [loadSymbols, selectedCategoryName]);

    // --- Render Symbol Item (Left Grid) ---
    const renderLeftItem = useCallback(({ item }: { item: DisplayedSymbolData }) => (
        <View style={{ margin: 4 }}>
            <MemoizedSquareComponent
                keyword={item.keyword}
                language="en"
                imageUri={item.imageUri}
                size={itemWidth}
                onPress={(keyword) => onSymbolPress(keyword, item.imageUri)}
            />
        </View>
    ), [onSymbolPress, itemWidth]);

    // --- Render Category Item (Right List) ---
    const renderRightItem = useCallback(({ item }: { item: CategoryInfo }) => {
        const isSelected = (selectedCategoryName === item.name) || (!selectedCategoryName && item.name.toLowerCase() === 'contextual');
        return (
            <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }}>
                <MemoizedCateComponent
                    keyword={item.name}
                    language="en"
                    onPress={handleCategoryPress}
                    isSelected={isSelected}
                />
            </View>
        );
    }, [handleCategoryPress, selectedCategoryName, theme.border]);


    // --- Add Keyword Function (Imperative Handle) ---
    const addKeywordToCategory = useCallback((categoryName: string | null, keywordToAdd: string) => {
         if (!categoryName) { console.warn("SymbolGrid: Cannot add keyword, no category selected."); return; }
         const categoryNameLower = categoryName.toLowerCase();
         const isStandard = APP_CATEGORIES.find(c => c.name.toLowerCase() === categoryNameLower)?.isStandard ?? false;

         if (!isStandard) { Alert.alert("Cannot Add", `Symbols can only be added to standard categories (like Food, Animals), not '${categoryName}'.`); return; }

        setCategorySymbolMap(prevMap => {
            const currentKeywords = prevMap.get(categoryNameLower) || [];
            const keywordLower = keywordToAdd.toLowerCase();

            if (currentKeywords.some(kw => kw.toLowerCase() === keywordLower)) {
                Alert.alert("Already Exists", `"${keywordToAdd}" is already in ${categoryName}.`);
                return prevMap;
            }

            // --- FIX: Sort the strings directly ---
            const updatedKeywords = [...currentKeywords, keywordToAdd].sort((a, b) => a.localeCompare(b)); // Add and sort
            // -------------------------------------

            const newMap = new Map(prevMap);
            newMap.set(categoryNameLower, updatedKeywords);
            console.log(`SymbolGrid: Added "${keywordToAdd}" to category "${categoryName}".`);
             Alert.alert("Symbol Added", `"${keywordToAdd}" added to ${categoryName}.`);

             // If the currently selected category was updated, refresh the displayed symbols
             if (selectedCategoryName === categoryName) {
                 // --- Map the ALREADY SORTED keywords ---
                 const sortedData = updatedKeywords
                    .map((kw, idx) => ({ id: `cat_${categoryName}_${idx}_${kw}`, keyword: kw }));
                 setDisplayedSymbols(sortedData);
                 // --------------------------------------
             }
            return newMap;
        });
     }, [selectedCategoryName]);

    // --- Expose Methods/State via Imperative Handle ---
    useImperativeHandle(ref, () => ({
        addKeywordToCategory,
        selectedCategoryName,
    }), [addKeywordToCategory, selectedCategoryName]);


    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Title & Final Loading Check ---
    const navTitle = selectedCategoryName ? selectedCategoryName : `Contextual (${currentTimeContext})`;
    const showGridLoading = isLoadingInitialData || loadingSymbols;

    return (
        <View style={styles.container}>
            {/* Nav Bar */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => handleCategoryPress('Contextual')} activeOpacity={0.7} style={styles.navBarTouchable}>
                    <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">
                        {isLoadingInitialData ? 'Loading...' : `Symbols: ${navTitle}`}
                    </Text>
                </TouchableOpacity>
            </View>
            {/* Content */}
            <View style={styles.content}>
                {/* Left Side (Symbols Grid) */}
                <View style={styles.leftSide}>
                    {showGridLoading ? (
                        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
                    ) : (
                        <FlatList
                            ref={flatListRefLeft}
                            data={displayedSymbols}
                            renderItem={renderLeftItem}
                            keyExtractor={(item) => `${item.id}-${gridLayout}`}
                            numColumns={numGridColumns}
                            key={numGridColumns.toString()}
                            contentContainerStyle={styles.gridContentContainer}
                            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols in this category.</Text></View>}
                            initialNumToRender={numGridColumns * 4}
                            maxToRenderPerBatch={numGridColumns * 3}
                            windowSize={11}
                            removeClippedSubviews={Platform.OS === 'android'}
                            extraData={`${itemWidth}-${numGridColumns}-${displayedSymbols.length}`}
                        />
                    )}
                </View>
                {/* Right Side (Categories) */}
                <View style={styles.rightSide}>
                   {loadingCategories ? ( // Show loader only if categories are loading
                       <View style={styles.loadingContainer}><ActivityIndicator size="small" color={theme.primary} /></View>
                   ) : (
                       <FlatList
                         ref={flatListRefRight}
                         style={styles.categoryFlatList}
                         data={APP_CATEGORIES}
                         renderItem={renderRightItem}
                         keyExtractor={(item) => item.id}
                         numColumns={1}
                         contentContainerStyle={styles.categoryListContainer}
                         initialNumToRender={APP_CATEGORIES.length}
                         extraData={selectedCategoryName} // Re-render list when selection changes
                       />
                   )}
                </View>
            </View>
        </View>
    );
}); // End of forwardRef

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    navBar: {
        backgroundColor: theme.primary,
        height: 35,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.isDark ? 0.3 : 0.15,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 10,
    },
    navBarTouchable: {
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    navBarTitle: {
        color: theme.white,
        fontSize: fonts.label,
        fontWeight: '600',
    },
    content: {
        flexDirection: 'row',
        flex: 1,
    },
    leftSide: {
        flex: 8,
        backgroundColor: theme.background,
    },
    rightSide: {
        flex: 2.5,
        backgroundColor: theme.card,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: theme.border,
    },
    categoryFlatList: {
        flex: 1,
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
        minHeight: 200,
    },
    gridContentContainer: {
        padding: 5,
        alignItems: 'flex-start',
    },
    categoryListContainer: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    emptyListText: {
        textAlign: 'center',
        fontSize: fonts.body,
        color: theme.textSecondary,
    }
});

export default SymbolGrid;