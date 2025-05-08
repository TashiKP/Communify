// src/components/Symbols.tsx
import React, {
    useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo
} from 'react';
import {
    View, StyleSheet, FlatList, Text, ActivityIndicator, Alert, TouchableOpacity, Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Import Components & Context ---
import SquareComponent from './SquareComponent';
// CateComponent is used inside CategoryListItem, so direct import here might not be needed
// import CateComponent from './CateComponent';
import CategoryListItem from './CategoryListItem'; // Import the new component
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols';
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { defaultCategoryData } from '../data/defaultCategorySymbols';

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

// --- Storage Keys ---
const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';
const STANDARD_CATEGORY_DATA_KEY = '@Communify:standardCategoryData';

// --- Category Definition ---
export interface CategoryInfo { id: string; name: string; isStandard?: boolean } // 'name' is original English name
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
interface CustomSymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; } // 'name' is original English
interface DisplayedSymbolData {
    id: string;
    keyword: string;      // Original keyword (e.g., for API calls, internal logic)
    displayText: string;  // Keyword to display (can be translated)
    imageUri?: string;
}

// --- Component Props ---
interface SymbolGridProps {
    onSymbolPress: (keyword: string, imageUri?: string) => void; // Sends original keyword
}

// --- Exposed Imperative Handle Methods ---
export interface SymbolGridRef {
    addKeywordToCategory: (categoryOriginalName: string | null, keywordToAdd: string) => void;
    selectedCategoryName: string | null; // This will be the original English name
}

// --- Memoized Components ---
const MemoizedSquareComponent = React.memo(SquareComponent);

// --- SymbolGrid Component (Wrapped with forwardRef) ---
const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(({ onSymbolPress }, ref) => {
    // --- Context Hooks ---
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { currentLanguage, translateBatch, isTranslating: isLangServiceTranslating } = useLanguage();

    // --- Dynamic Calculations ---
    const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

    // --- State ---
    const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
    const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]);
    const [categorySymbolMap, setCategorySymbolMap] = useState<Map<string, string[]>>(new Map());
    const [translatedCategoryNamesMap, setTranslatedCategoryNamesMap] = useState<Map<string, string>>(new Map()); // For batched category name translations

    const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [loadingCustom, setLoadingCustom] = useState<boolean>(true);
    const [loadingSymbolsState, setLoadingSymbolsState] = useState<boolean>(true);
    const [loadingCategoryTranslations, setLoadingCategoryTranslations] = useState<boolean>(false);


    const [selectedCategoryOriginalName, setSelectedCategoryOriginalName] = useState<string | null>(null);
    const [navBarDisplayTitle, setNavBarDisplayTitle] = useState('Loading...');


    // Refs
    const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
    const flatListRefRight = useRef<FlatList<CategoryInfo>>(null);
    const isMountedRef = useRef(true);

    // --- Component Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);


    // --- Combined Loading State ---
    const isLoadingInitialData = isLoadingAppearance || isLoadingGridLayout || loadingCategories || loadingCustom;

    // --- Load Custom Symbols (stores original English names) ---
    useEffect(() => {
        setLoadingCustom(true);
        const loadCustom = async () => {
            try {
                const val = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
                if (isMountedRef.current) {
                    const loaded = val ? JSON.parse(val) : [];
                    if (Array.isArray(loaded)) setCustomSymbols(loaded);
                    else setCustomSymbols([]);
                }
            } catch (e) { console.error('SymbolGrid: Failed load custom symbols.', e); if (isMountedRef.current) setCustomSymbols([]); }
            finally { if (isMountedRef.current) setLoadingCustom(false); }
        };
        loadCustom();
    }, []);

    // --- Load/Initialize STANDARD Category Data (stores original English names) ---
    useEffect(() => {
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
                        else { needsSave = true; }
                    } catch (parseError) { needsSave = true; }
                } else { needsSave = true; }

                APP_CATEGORIES.forEach(cat => {
                    if (cat.isStandard) {
                        const categoryKey = cat.name.toLowerCase();
                        if (!loadedMap.has(categoryKey)) {
                            const defaultKeywords = defaultCategoryData[categoryKey] || [];
                            loadedMap.set(categoryKey, defaultKeywords);
                            needsSave = true;
                        }
                    }
                });

                if (isMountedRef.current) {
                    setCategorySymbolMap(loadedMap);
                    if (needsSave) { await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(loadedMap))); }
                }
            } catch (e) {
                console.error('SymbolGrid: Failed to load/initialize standard category data.', e);
                const defaultMap = new Map<string, string[]>();
                APP_CATEGORIES.forEach(cat => { if (cat.isStandard) { const key = cat.name.toLowerCase(); defaultMap.set(key, defaultCategoryData[key] || []); }});
                if (isMountedRef.current) setCategorySymbolMap(defaultMap);
            } finally {
                if (isMountedRef.current) setLoadingCategories(false);
            }
        };
        loadCategoryData();
    }, []);

    // --- Save STANDARD Category Data Effect (Debounced) ---
    useEffect(() => {
        if (loadingCategories || categorySymbolMap.size === 0) return;
        const saveCategoryData = async () => {
            try {
                await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(categorySymbolMap)));
            } catch (e) { console.error('SymbolGrid: Failed to save standard category data.', e); }
        };
        const timerId = setTimeout(saveCategoryData, 750);
        return () => clearTimeout(timerId);
    }, [categorySymbolMap, loadingCategories]);

    // --- Effect to Batch Translate Category Names ---
    useEffect(() => {
        if (isLoadingInitialData) return; // Don't run if basic data isn't ready

        const translateAllCategoryNames = async () => {
            if (!isMountedRef.current) return;

            if (currentLanguage === 'dzo') {
                const originalNamesToTranslate = APP_CATEGORIES
                    .filter(cat => cat.name.toLowerCase() !== 'contextual' && cat.name.toLowerCase() !== 'custom' && cat.isStandard) // Only translate standard, non-special categories
                    .map(cat => cat.name);

                if (originalNamesToTranslate.length > 0) {
                    setLoadingCategoryTranslations(true);
                    try {
                        console.log(`SymbolGrid: Batch translating ${originalNamesToTranslate.length} category names to DZO.`);
                        const results = await translateBatch(originalNamesToTranslate, 'dzo');
                        if (isMountedRef.current) {
                            if (results && results.length === originalNamesToTranslate.length) {
                                const newMap = new Map<string, string>();
                                originalNamesToTranslate.forEach((name, index) => {
                                    newMap.set(name, results[index]);
                                });
                                setTranslatedCategoryNamesMap(newMap);
                            } else {
                                console.warn("SymbolGrid: Failed to translate all category names or length mismatch.");
                                const fallbackMap = new Map<string, string>();
                                originalNamesToTranslate.forEach(name => fallbackMap.set(name, name)); // Fallback to original
                                setTranslatedCategoryNamesMap(fallbackMap);
                            }
                        }
                    } catch (error) {
                        console.error("SymbolGrid: Error translating all category names:", error);
                        if (isMountedRef.current) {
                            const fallbackMap = new Map<string, string>();
                            originalNamesToTranslate.forEach(name => fallbackMap.set(name, name));
                            setTranslatedCategoryNamesMap(fallbackMap);
                        }
                    } finally {
                        if (isMountedRef.current) setLoadingCategoryTranslations(false);
                    }
                } else {
                    if (isMountedRef.current) setTranslatedCategoryNamesMap(new Map()); // No standard categories to translate
                }
            } else { // Language is 'en' or other non-'dzo'
                if (isMountedRef.current) {
                    // Set map to original names or clear it, as no translation needed for display
                    const englishMap = new Map<string, string>();
                    APP_CATEGORIES.forEach(cat => {
                        // Optional: Only store standard ones if that's the only ones you display translated
                        if (cat.name.toLowerCase() !== 'contextual' && cat.name.toLowerCase() !== 'custom' && cat.isStandard) {
                           englishMap.set(cat.name, cat.name);
                        }
                    });
                    setTranslatedCategoryNamesMap(englishMap); // Or simply new Map() if you handle defaults in render
                }
            }
        };
        translateAllCategoryNames();
    }, [currentLanguage, translateBatch, isLoadingInitialData]); // Removed APP_CATEGORIES unless it's dynamic

    // --- Effect to Translate and Load Displayed Symbols ---
    const loadAndTranslateSymbols = useCallback(async (categoryFilterOriginalName: string | null = null) => {
        if (isLoadingInitialData || loadingCategoryTranslations) { // Also wait for category translations if language is 'dzo'
            setLoadingSymbolsState(true);
            return;
        }
        setLoadingSymbolsState(true);
        flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

        requestAnimationFrame(async () => {
            if(!isMountedRef.current) return;
            try {
                let originalKeywords: string[] = [];
                let imageUrisMap: Map<string, string | undefined> = new Map();
                let symbolIdsPrefix = '';
                let contextName: TimeContext | null = null;

                const filterLower = categoryFilterOriginalName?.toLowerCase();

                if (filterLower === 'custom') {
                    symbolIdsPrefix = 'custom';
                    originalKeywords = customSymbols.map(cs => {
                        imageUrisMap.set(cs.name, cs.imageUri);
                        return cs.name;
                    });
                } else if (!filterLower || filterLower === 'contextual') {
                    contextName = getCurrentTimeContext();
                    symbolIdsPrefix = `ctx_${contextName}`;
                    originalKeywords = getContextualSymbols(contextName);
                } else {
                    symbolIdsPrefix = `cat_${categoryFilterOriginalName}`;
                    originalKeywords = categorySymbolMap.get(filterLower) || [];
                }

                originalKeywords.sort((a, b) => a.localeCompare(b));

                let translatedKeywords = originalKeywords;
                if (currentLanguage === 'dzo' && originalKeywords.length > 0) {
                    console.log(`SymbolGrid: Batch translating ${originalKeywords.length} symbols for category '${categoryFilterOriginalName || 'Contextual'}' to DZO.`);
                    const results = await translateBatch(originalKeywords, 'dzo');
                    if (isMountedRef.current && results && results.length === originalKeywords.length) {
                        translatedKeywords = results;
                    } else if (isMountedRef.current) {
                        console.warn("SymbolGrid: Translation length mismatch or error for symbols.");
                    }
                }

                if(!isMountedRef.current) return;

                const symbolsData: DisplayedSymbolData[] = originalKeywords.map((originalKw, idx) => ({
                    id: `${symbolIdsPrefix}_${idx}_${originalKw.replace(/\s+/g, '_')}`,
                    keyword: originalKw,
                    displayText: translatedKeywords[idx] || originalKw,
                    imageUri: imageUrisMap.get(originalKw),
                }));

                setSelectedCategoryOriginalName(categoryFilterOriginalName);
                setDisplayedSymbols(symbolsData);
                setCurrentTimeContext(contextName ?? 'Default');

            } catch (err) {
                console.error("SymbolGrid: Error processing or translating symbols:", err);
                if(isMountedRef.current) {
                    const defaultKw = getContextualSymbols('Default');
                    setDisplayedSymbols(defaultKw.map((k, i) => ({ id: `err_${i}_${k}`, keyword: k, displayText: k })));
                    setSelectedCategoryOriginalName(null);
                    setCurrentTimeContext('Default');
                    Alert.alert("Error", "Could not load symbols.");
                }
            } finally {
                if(isMountedRef.current) setLoadingSymbolsState(false);
            }
        });
    }, [
        customSymbols, categorySymbolMap, isLoadingInitialData, currentLanguage,
        translateBatch, loadingCategoryTranslations
    ]);

    useEffect(() => {
        if (!isLoadingInitialData && !loadingCategoryTranslations) { // Ensure category names are translated before loading symbols if 'dzo'
            loadAndTranslateSymbols(selectedCategoryOriginalName);
        }
    }, [isLoadingInitialData, loadAndTranslateSymbols, currentLanguage, loadingCategoryTranslations]);


    const handleCategoryPress = useCallback((categoryOriginalName: string) => {
        const currentSelectionKey = selectedCategoryOriginalName?.toLowerCase() ?? 'contextual';
        const newSelectionKey = categoryOriginalName.toLowerCase();
        if (newSelectionKey === currentSelectionKey && selectedCategoryOriginalName === categoryOriginalName) return;

        setSelectedCategoryOriginalName(categoryOriginalName); // Set it here, loadAndTranslateSymbols will use it
        // loadAndTranslateSymbols will be triggered by the useEffect watching selectedCategoryOriginalName (if we re-add it)
        // or by currentLanguage change, or we call it directly:
        if (newSelectionKey === 'contextual') {
            loadAndTranslateSymbols(null);
        } else {
            loadAndTranslateSymbols(categoryOriginalName);
        }
    }, [loadAndTranslateSymbols, selectedCategoryOriginalName]);


    const renderLeftItem = useCallback(({ item }: { item: DisplayedSymbolData }) => (
        <View style={{ margin: 4 }}>
            <MemoizedSquareComponent
                keyword={item.keyword}
                displayText={item.displayText}
                language={'en'}
                imageUri={item.imageUri}
                size={itemWidth}
                onPress={(originalKeyword) => onSymbolPress(originalKeyword, item.imageUri)}
            />
        </View>
    ), [onSymbolPress, itemWidth]);

    const renderRightItem = useCallback(({ item: categoryInfo }: { item: CategoryInfo }) => {
        const isSelected = (selectedCategoryOriginalName === categoryInfo.name) ||
                           (!selectedCategoryOriginalName && categoryInfo.name.toLowerCase() === 'contextual');

        let displayedName = categoryInfo.name;
        if (currentLanguage === 'dzo' && categoryInfo.name.toLowerCase() !== 'contextual' && categoryInfo.name.toLowerCase() !== 'custom' && categoryInfo.isStandard) {
            displayedName = translatedCategoryNamesMap.get(categoryInfo.name) || categoryInfo.name;
        }

        return (
            <CategoryListItem
                categoryInfo={categoryInfo}
                displayedName={displayedName}
                onPressCategory={handleCategoryPress}
                isSelected={isSelected}
                themeBorderColor={theme.border}
            />
        );
    }, [
        selectedCategoryOriginalName, currentLanguage, translatedCategoryNamesMap,
        handleCategoryPress, theme.border
    ]);


    const addKeywordToCategory = useCallback((categoryOriginalNameToAdd: string | null, keywordToAdd: string) => {
         if (!categoryOriginalNameToAdd) { console.warn("SymbolGrid: No category to add to."); return; }
         const categoryNameLower = categoryOriginalNameToAdd.toLowerCase();
         const isStandard = APP_CATEGORIES.find(c => c.name.toLowerCase() === categoryNameLower)?.isStandard ?? false;

         if (!isStandard) { Alert.alert("Cannot Add", `Symbols can only be added to standard categories, not '${categoryOriginalNameToAdd}'.`); return; }

        setCategorySymbolMap(prevMap => {
            const currentKeywords = prevMap.get(categoryNameLower) || [];
            const keywordLower = keywordToAdd.toLowerCase();

            if (currentKeywords.some(kw => kw.toLowerCase() === keywordLower)) {
                Alert.alert("Already Exists", `"${keywordToAdd}" is already in ${categoryOriginalNameToAdd}.`);
                return prevMap;
            }
            const updatedKeywords = [...currentKeywords, keywordToAdd].sort((a, b) => a.localeCompare(b));
            const newMap = new Map(prevMap);
            newMap.set(categoryNameLower, updatedKeywords);
            Alert.alert("Symbol Added", `"${keywordToAdd}" added to ${categoryOriginalNameToAdd}.`);

             if (selectedCategoryOriginalName === categoryOriginalNameToAdd) {
                 loadAndTranslateSymbols(categoryOriginalNameToAdd);
             }
            return newMap;
        });
     }, [selectedCategoryOriginalName, loadAndTranslateSymbols]);

    useImperativeHandle(ref, () => ({
        addKeywordToCategory,
        selectedCategoryName: selectedCategoryOriginalName,
    }), [addKeywordToCategory, selectedCategoryOriginalName]);


    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    useEffect(() => {
        if (isLoadingInitialData || (currentLanguage === 'dzo' && loadingCategoryTranslations)) {
            if(isMountedRef.current) setNavBarDisplayTitle('Loading...');
            return;
        }

        let titleToDisplay = selectedCategoryOriginalName;
        if (!titleToDisplay) {
            titleToDisplay = `Contextual (${currentTimeContext})`;
        } else {
             if (currentLanguage === 'dzo' && titleToDisplay.toLowerCase() !== 'custom' && titleToDisplay.toLowerCase() !== 'contextual') {
                 titleToDisplay = translatedCategoryNamesMap.get(titleToDisplay) || titleToDisplay;
             }
        }
        if(isMountedRef.current) setNavBarDisplayTitle(`Symbols: ${titleToDisplay}`);

    }, [selectedCategoryOriginalName, currentTimeContext, currentLanguage, translatedCategoryNamesMap, isLoadingInitialData, loadingCategoryTranslations]);

    const showGridLoading = isLoadingInitialData || loadingSymbolsState || isLangServiceTranslating || (currentLanguage === 'dzo' && loadingCategoryTranslations);
    const showCategoryListLoading = loadingCategories || (currentLanguage === 'dzo' && loadingCategoryTranslations) || isLangServiceTranslating;


    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => handleCategoryPress('Contextual')} activeOpacity={0.7} style={styles.navBarTouchable}>
                    <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">
                        {navBarDisplayTitle}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                <View style={styles.leftSide}>
                    {showGridLoading ? (
                        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
                    ) : (
                        <FlatList
                            ref={flatListRefLeft}
                            data={displayedSymbols}
                            renderItem={renderLeftItem}
                            keyExtractor={(item) => `${item.id}-${gridLayout}-${currentLanguage}`}
                            numColumns={numGridColumns}
                            key={numGridColumns.toString() + currentLanguage}
                            contentContainerStyle={styles.gridContentContainer}
                            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyListText}>No symbols in this category.</Text></View>}
                            initialNumToRender={numGridColumns * 4}
                            maxToRenderPerBatch={numGridColumns * 3}
                            windowSize={11}
                            removeClippedSubviews={Platform.OS === 'android'}
                            extraData={`${itemWidth}-${numGridColumns}-${displayedSymbols.length}-${currentLanguage}`}
                        />
                    )}
                </View>
                <View style={styles.rightSide}>
                   {showCategoryListLoading ? (
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
                         extraData={`${selectedCategoryOriginalName}-${currentLanguage}-${translatedCategoryNamesMap.size}`}
                       />
                   )}
                </View>
            </View>
        </View>
    );
});

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, },
    navBar: { backgroundColor: theme.primary, height: 35, width: '100%', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme.isDark ? 0.3 : 0.15, shadowRadius: 2, elevation: 3, zIndex: 10, },
    navBarTouchable: { paddingHorizontal: 15, paddingVertical: 5, },
    navBarTitle: { color: theme.white, fontSize: fonts.label, fontWeight: '600', },
    content: { flexDirection: 'row', flex: 1, },
    leftSide: { flex: 8, backgroundColor: theme.background, },
    rightSide: { flex: 2.5, backgroundColor: theme.card, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.border, },
    categoryFlatList: { flex: 1, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200, },
    gridContentContainer: { padding: 5, alignItems: 'flex-start', },
    categoryListContainer: { paddingVertical: 0, paddingHorizontal: 0, },
    emptyListText: { textAlign: 'center', fontSize: fonts.body, color: theme.textSecondary, }
});

export default React.memo(SymbolGrid);