// src/components/SymbolGrid.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import SquareComponent from './SquareComponent';
import CategoryListItem from './CategoryListItem';
// Removed local contextual symbol logic as API will provide this
// import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols';
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage } from '../context/LanguageContext';

import apiService, {
    handleApiError,
    StandardCategorySymbolMap,
    TimeContextSymbolsResponse, // Type for time context symbols from API
} from '../services/apiService';

import { getLanguageSpecificTextStyle } from '../styles/typography';

const screenWidth = Dimensions.get('window').width;
const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';

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

export interface CategoryInfo {
  id: string;
  name: string; // Original, non-translated name (used as key, e.g., "food", "contextual")
  isStandard?: boolean;
}

const APP_CATEGORIES_BASE: CategoryInfo[] = [
  { id: 'cat_contextual', name: 'contextual', isStandard: false }, // Use lowercase name as key
  { id: 'cat_custom', name: 'custom', isStandard: false },
  { id: 'cat_food', name: 'food', isStandard: true }, // Example, API will drive this more
  // Add more "expected" standard category structures here if needed for ordering or initial display
];

interface CustomSymbolItem {
  id: string;
  name: string;
  imageUri?: string;
}
interface DisplayedSymbolData {
  id: string;
  keyword: string;
  displayText: string;
  imageUri?: string;
  isCustom?: boolean;
}

interface SymbolGridProps {
  onSymbolPress: (keyword: string, imageUri?: string) => void;
}

export interface SymbolGridRef {
  addSymbolToLocalCustomCategory: (keywordToAdd: string, imageUri?: string) => Promise<void>;
  selectedCategoryName: string | null;
}

const MemoizedSquareComponent = React.memo(SquareComponent);

// --- Helper Function for Themed Styles ---
// Moved BEFORE the component that uses it
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    navBar: {
      backgroundColor: theme.primary,
      height: 35,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      zIndex: 10,
    },
    navBarTouchable: { paddingHorizontal: 15, paddingVertical: 5, minHeight: 35 },
    navBarTitle: { ...h2Styles, fontWeight: '600', textAlign: 'center' },
    content: { flexDirection: 'row', flex: 1 },
    leftSide: { flex: 8, backgroundColor: theme.background },
    rightSide: {
      flex: 2.5,
      backgroundColor: theme.card,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    categoryFlatList: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 },
    gridContentContainer: { padding: 5, alignItems: 'flex-start' },
    categoryListContainer: { paddingVertical: 5 },
    emptyListText: { ...bodyStyles, fontWeight: '400', textAlign: 'center' },
  });
};


const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(({ onSymbolPress }, ref) => {
  const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
  const { theme, fonts, isLoadingAppearance } = useAppearance();
  const { currentLanguage, translateSymbolBatch, isTranslatingSymbols } = useLanguage();
  const { t, i18n } = useTranslation();

  const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
  const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

  const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
  const [localCustomSymbols, setLocalCustomSymbols] = useState<CustomSymbolItem[]>([]);
  const [apiStandardCategories, setApiStandardCategories] = useState<StandardCategorySymbolMap>({});
  const [apiTimeContextSymbols, setApiTimeContextSymbols] = useState<TimeContextSymbolsResponse>([]);
  const [allDisplayCategories, setAllDisplayCategories] = useState<CategoryInfo[]>(APP_CATEGORIES_BASE);

  const [loadingApiStandardCategories, setLoadingApiStandardCategories] = useState<boolean>(true);
  const [loadingApiTimeContext, setLoadingApiTimeContext] = useState<boolean>(true); // Initialize as true
  const [loadingLocalCustom, setLoadingLocalCustom] = useState<boolean>(true);
  const [loadingDisplayedSymbols, setLoadingDisplayedSymbols] = useState<boolean>(true);
  
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null); // null means contextual
  const [navBarDisplayTitle, setNavBarDisplayTitle] = useState('');

  const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
  const isMountedRef = useRef(true);

  // --- Dynamic Styles ---
  // Define styles AFTER hooks but BEFORE they are used in effects or JSX
  const styles = useMemo(
    () => createThemedStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const isLoadingInitialData = isLoadingAppearance || isLoadingGridLayout || loadingApiStandardCategories || loadingLocalCustom || loadingApiTimeContext;

  const fetchApiStandardCategories = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoadingApiStandardCategories(true);
    try {
      const data = await apiService.getStandardCategories();
      if (isMountedRef.current) {
        setApiStandardCategories(data || {});
      }
    } catch (error) {
      console.error('SymbolGrid: Failed to load standard categories from API.', handleApiError(error));
      if (isMountedRef.current) setApiStandardCategories({});
      Alert.alert(t('common.error'), t('home.errors.loadCategoryFail'));
    } finally {
      if (isMountedRef.current) setLoadingApiStandardCategories(false);
    }
  }, [t]);

  const fetchApiTimeContextSymbols = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoadingApiTimeContext(true);
    try {
      const symbols = await apiService.getCurrentTimeContextSymbols();
      if (isMountedRef.current) {
        setApiTimeContextSymbols(symbols || []);
      }
    } catch (error) {
      console.error('SymbolGrid: Failed to load time context symbols from API.', handleApiError(error));
      if (isMountedRef.current) setApiTimeContextSymbols([]);
    } finally {
      if (isMountedRef.current) setLoadingApiTimeContext(false);
    }
  }, []);

  useEffect(() => {
    fetchApiStandardCategories();
    fetchApiTimeContextSymbols(); // Fetch both on initial mount
  }, [fetchApiStandardCategories, fetchApiTimeContextSymbols]);

  useEffect(() => {
    if (loadingApiStandardCategories) return; // Wait for standard categories

    const apiCategoryKeys = Object.keys(apiStandardCategories);
    const currentNonStandard = APP_CATEGORIES_BASE.filter(c => !c.isStandard);
    const standardFromApi = apiCategoryKeys.map(key => {
      const baseCat = APP_CATEGORIES_BASE.find(bc => bc.name.toLowerCase() === key.toLowerCase());
      return {
        id: `cat_${key.toLowerCase()}`,
        name: baseCat ? baseCat.name : key.charAt(0).toUpperCase() + key.slice(1),
        isStandard: true
      };
    });
    const sortedStandardFromApi = standardFromApi.sort((a, b) => a.name.localeCompare(b.name));
    if (isMountedRef.current) {
        setAllDisplayCategories([...currentNonStandard, ...sortedStandardFromApi].sort((a, b) => {
             // Custom sort: Contextual, Custom, then alphabetical
            if (a.name.toLowerCase() === 'contextual') return -1;
            if (b.name.toLowerCase() === 'contextual') return 1;
            if (a.name.toLowerCase() === 'custom') return -1;
            if (b.name.toLowerCase() === 'custom') return 1;
            return a.name.localeCompare(b.name);
        }));
    }
  }, [apiStandardCategories, loadingApiStandardCategories]);


  useEffect(() => {
    setLoadingLocalCustom(true);
    const loadCustom = async () => {
      try {
        const val = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
        if (isMountedRef.current) {
          const loaded = val ? JSON.parse(val) : [];
          setLocalCustomSymbols(Array.isArray(loaded) ? loaded : []);
        }
      } catch (e) {
        console.error('SymbolGrid: Failed load custom symbols from AsyncStorage.', e);
        if (isMountedRef.current) setLocalCustomSymbols([]);
      } finally {
        if (isMountedRef.current) setLoadingLocalCustom(false);
      }
    };
    loadCustom();
  }, []);

  useEffect(() => {
    if (loadingLocalCustom) return;
    const saveCustomSymbols = async () => {
      try {
        await AsyncStorage.setItem(CUSTOM_SYMBOLS_STORAGE_KEY, JSON.stringify(localCustomSymbols));
      } catch (e) {
        console.error('SymbolGrid: Failed to save custom symbols to AsyncStorage.', e);
      }
    };
    const timerId = setTimeout(saveCustomSymbols, 1000);
    return () => clearTimeout(timerId);
  }, [localCustomSymbols, loadingLocalCustom]);

  const loadAndTranslateSymbols = useCallback(
    async (categoryKeyToLoad: string | null = null) => {
      // Wait for all initial data sources to be ready
      if (isLoadingAppearance || isLoadingGridLayout || loadingApiStandardCategories || loadingLocalCustom || loadingApiTimeContext) {
        setLoadingDisplayedSymbols(true);
        return;
      }
      setLoadingDisplayedSymbols(true);
      flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

      requestAnimationFrame(async () => {
        if (!isMountedRef.current) return;
        try {
          let originalKeywords: string[] = [];
          let imageUrisMap: Map<string, string | undefined> = new Map();
          let isCustomCategory = false;
          let symbolIdsPrefix = '';

          const effectiveCategoryKey = categoryKeyToLoad ?? 'contextual';

          if (effectiveCategoryKey === 'custom') {
            symbolIdsPrefix = 'custom';
            isCustomCategory = true;
            originalKeywords = localCustomSymbols.map((cs) => {
              imageUrisMap.set(cs.name, cs.imageUri);
              return cs.name;
            });
          } else if (effectiveCategoryKey === 'contextual') {
            symbolIdsPrefix = `ctx_api`;
            originalKeywords = apiTimeContextSymbols; // USE API RESPONSE HERE
          } else {
            symbolIdsPrefix = `cat_${effectiveCategoryKey}`;
            originalKeywords = apiStandardCategories[effectiveCategoryKey] || [];
          }
          originalKeywords.sort((a, b) => a.localeCompare(b));

          let translatedKeywords = originalKeywords;
          if (currentLanguage === 'dzo' && originalKeywords.length > 0) {
            const results = await translateSymbolBatch(originalKeywords, 'dzo');
            if (isMountedRef.current && results && results.length === originalKeywords.length) {
              translatedKeywords = results;
            }
          }

          if (!isMountedRef.current) return;

          const symbolsData: DisplayedSymbolData[] = originalKeywords.map((originalKw, idx) => ({
            id: `${symbolIdsPrefix}_${idx}_${originalKw.replace(/\s+/g, '_')}`,
            keyword: originalKw,
            displayText: translatedKeywords[idx] || originalKw,
            imageUri: imageUrisMap.get(originalKw),
            isCustom: isCustomCategory,
          }));

          // setSelectedCategoryKey(categoryKeyToLoad); // Already set by handleCategoryPress
          setDisplayedSymbols(symbolsData);
        } catch (err) {
          console.error('SymbolGrid: Error processing or translating symbols:', err);
          if (isMountedRef.current) {
            setDisplayedSymbols([]);
            Alert.alert(t('common.error'), t('home.errors.loadSymbolsFail'));
          }
        } finally {
          if (isMountedRef.current) setLoadingDisplayedSymbols(false);
        }
      });
    },
    [
      localCustomSymbols,
      apiStandardCategories,
      apiTimeContextSymbols,
      isLoadingAppearance, isLoadingGridLayout, loadingApiStandardCategories, loadingLocalCustom, loadingApiTimeContext, // All loading states
      currentLanguage,
      translateSymbolBatch,
      t,
    ]
  );

  useEffect(() => {
    // This effect triggers when selectedCategoryKey changes OR when any initial data loading finishes
    if (!isLoadingInitialData) { // isLoadingInitialData now includes loadingApiTimeContext
      loadAndTranslateSymbols(selectedCategoryKey);
    }
  }, [isLoadingInitialData, selectedCategoryKey, loadAndTranslateSymbols, currentLanguage]); // Added currentLanguage

  const handleCategoryPress = useCallback((categoryInfo: CategoryInfo) => {
      const newKey = categoryInfo.name.toLowerCase();
      const currentKey = selectedCategoryKey ?? 'contextual';

      if (newKey === currentKey) return;
      
      setSelectedCategoryKey(newKey === 'contextual' ? null : newKey);
      // If contextual is selected, ensure symbols are fresh (API call already happens on mount/periodically)
      // No need to explicitly call fetchApiTimeContextSymbols here unless you want forced refresh on every click
    }, [selectedCategoryKey /*, fetchApiTimeContextSymbols (if wanting forced refresh)*/]
  );

  const renderLeftItem = useCallback(
    ({ item }: { item: DisplayedSymbolData }) => (
      <View style={{ margin: 4 }}>
        <MemoizedSquareComponent
          keyword={item.keyword}
          displayText={item.displayText}
          imageUri={item.imageUri}
          size={itemWidth}
          onPress={(originalKeyword) => onSymbolPress(originalKeyword, item.imageUri)}
        />
      </View>
    ),
    [onSymbolPress, itemWidth, currentLanguage]
  );

  const renderRightItem = useCallback(
    ({ item: categoryInfo }: { item: CategoryInfo }) => {
      const categoryKey = categoryInfo.name.toLowerCase();
      const isSelected = (selectedCategoryKey ?? 'contextual') === categoryKey;

      let displayedName = categoryInfo.name;
      if (categoryKey === 'contextual') {
        displayedName = t('home.contextualCategory');
      } else if (categoryKey === 'custom') {
        displayedName = t('home.customCategory');
      } else {
        const foundCatInfo = allDisplayCategories.find(c => c.name.toLowerCase() === categoryKey);
        displayedName = t(`categories.${foundCatInfo ? foundCatInfo.name : categoryKey}`, { 
            defaultValue: foundCatInfo ? foundCatInfo.name : categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1) 
        });
      }
      return (
        <CategoryListItem
          categoryInfo={categoryInfo}
          displayedName={displayedName}
          onPressCategory={() => handleCategoryPress(categoryInfo)}
          isSelected={isSelected}
          themeBorderColor={theme.border}
        />
      );
    },
    [selectedCategoryKey, t, handleCategoryPress, theme.border, allDisplayCategories]
  );

  const addSymbolToLocalCustomCategory = useCallback(
    async (keywordToAdd: string, imageUri?: string) => {
      if (!keywordToAdd.trim()) {
        Alert.alert(t('common.error'), t('home.errors.emptySymbolName'));
        return;
      }
      const keywordLower = keywordToAdd.toLowerCase();
      if (localCustomSymbols.some((cs) => cs.name.toLowerCase() === keywordLower)) {
        Alert.alert(t('home.alreadyExistsAlertTitle'), t('home.customSymbolExists', { symbol: keywordToAdd }));
        return;
      }
      const newSymbol: CustomSymbolItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: keywordToAdd.trim(),
        imageUri,
      };
      if (isMountedRef.current) {
        setLocalCustomSymbols((prev) => [...prev, newSymbol].sort((a, b) => a.name.localeCompare(b.name)));
        Alert.alert(t('home.addSymbolAlertTitle'), t('home.addCustomSymbolSuccess', { symbol: keywordToAdd.trim() }));
        // No need to call loadAndTranslateSymbols explicitly if selectedCategoryKey is 'custom',
        // as loadAndTranslateSymbols depends on localCustomSymbols state.
      }
    },
    [localCustomSymbols, t /*, selectedCategoryKey - not strictly needed if only for custom*/]
  );

  useImperativeHandle(ref, () => ({
    addSymbolToLocalCustomCategory,
    selectedCategoryName: selectedCategoryKey,
  }), [addSymbolToLocalCustomCategory, selectedCategoryKey]);

  useEffect(() => {
    if (isLoadingInitialData) {
      if (isMountedRef.current) setNavBarDisplayTitle(t('home.loading'));
      return;
    }
    let categoryDisplayTitle = '';
    const currentKeyToDisplay = selectedCategoryKey ?? 'contextual';

    if (currentKeyToDisplay === 'contextual') {
      categoryDisplayTitle = t('home.contextualCategory');
    } else if (currentKeyToDisplay === 'custom') {
      categoryDisplayTitle = t('home.customCategory');
    } else {
      const catInfo = allDisplayCategories.find(c => c.name.toLowerCase() === currentKeyToDisplay);
      categoryDisplayTitle = t(`categories.${catInfo ? catInfo.name : currentKeyToDisplay}`, { 
          defaultValue: catInfo ? catInfo.name : currentKeyToDisplay.charAt(0).toUpperCase() + currentKeyToDisplay.slice(1) 
        });
    }
    if (isMountedRef.current) setNavBarDisplayTitle(t('home.symbolsTitle', { category: categoryDisplayTitle }));
  }, [selectedCategoryKey, t, i18n.language, isLoadingInitialData, allDisplayCategories]);

  const showGridLoading = isLoadingInitialData || loadingDisplayedSymbols || isTranslatingSymbols;
  const showCategoryListLoading = loadingApiStandardCategories;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => handleCategoryPress({id: 'cat_contextual', name: 'contextual', isStandard: false})}
          activeOpacity={0.7}
          style={styles.navBarTouchable}
        >
          <Text style={[styles.navBarTitle, { color: theme.white }]} numberOfLines={1} ellipsizeMode="tail">
            {isLoadingInitialData || loadingDisplayedSymbols ? t('home.loading') : navBarDisplayTitle}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.leftSide}>
          {showGridLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRefLeft}
              data={displayedSymbols}
              renderItem={renderLeftItem}
              keyExtractor={(item) => `${item.id}-${gridLayout}-${currentLanguage}`}
              numColumns={numGridColumns}
              key={`${numGridColumns}-${currentLanguage}`}
              contentContainerStyle={styles.gridContentContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>{t('home.noSymbols')}</Text>
                </View>
              }
              initialNumToRender={numGridColumns * 5}
              maxToRenderPerBatch={numGridColumns * 4}
              windowSize={Platform.OS === 'ios' ? 21 : 11}
              removeClippedSubviews={Platform.OS === 'android'}
              getItemLayout={(_, index) => (
                {length: itemWidth + 8, offset: (itemWidth + 8) * index, index}
              )}
              extraData={`${itemWidth}-${numGridColumns}-${currentLanguage}-${displayedSymbols.length}`}
            />
          )}
        </View>
        <View style={styles.rightSide}>
          {showCategoryListLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              style={styles.categoryFlatList}
              data={allDisplayCategories}
              renderItem={renderRightItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryListContainer}
              extraData={`${selectedCategoryKey}-${currentLanguage}-${allDisplayCategories.length}`}
            />
          )}
        </View>
      </View>
    </View>
  );
});

export default React.memo(SymbolGrid);