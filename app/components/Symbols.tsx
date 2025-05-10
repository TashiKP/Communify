// src/components/Symbols.tsx
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
import { useTranslation } from 'react-i18next'; // Import i18next hook

// --- Import Components & Context ---
import SquareComponent from './SquareComponent';
import CategoryListItem from './CategoryListItem';
import { getCurrentTimeContext, getContextualSymbols, TimeContext } from '../context/contextualSymbols';
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
// Ensure useLanguage provides translateSymbolBatch and isTranslatingSymbols
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { defaultCategoryData } from '../data/defaultCategorySymbols';
// --- Import Typography Utility ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path

// --- Constants & Calculations ---
const screenWidth = Dimensions.get('window').width;

const getNumColumns = (layout: GridLayoutType): number => {
  switch (layout) {
    case 'simple':
      return 4;
    case 'standard':
      return 6;
    case 'dense':
      return 8;
    default:
      return 6;
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
// 'name' is the original English name, used as a key for storage and i18n lookup
export interface CategoryInfo {
  id: string;
  name: string;
  isStandard?: boolean;
}
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
interface CustomSymbolItem {
  id: string;
  name: string;
  imageUri?: string;
  categoryId?: string | null;
} // 'name' is original English
interface DisplayedSymbolData {
  id: string;
  keyword: string; // Original keyword (e.g., for API calls, internal logic)
  displayText: string; // Keyword to display (can be translated via API)
  imageUri?: string;
}

// --- Component Props ---
interface SymbolGridProps {
  onSymbolPress: (keyword: string, imageUri?: string) => void; // Sends original keyword
}

// --- Exposed Imperative Handle Methods ---
export interface SymbolGridRef {
  addKeywordToCategory: (categoryOriginalName: string | null, keywordToAdd: string) => void;
  selectedCategoryName: string | null; // This will be the original English name/key
}

// --- Memoized Components ---
const MemoizedSquareComponent = React.memo(SquareComponent);

// --- SymbolGrid Component (Wrapped with forwardRef) ---
const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(({ onSymbolPress }, ref) => {
  // --- Hooks ---
  const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
  const { theme, fonts, isLoadingAppearance } = useAppearance();
  const { currentLanguage, translateSymbolBatch, isTranslatingSymbols } = useLanguage();
  const { t, i18n } = useTranslation(); // i18next hook

  // --- Dynamic Calculations ---
  const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
  const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

  // --- State ---
  const [displayedSymbols, setDisplayedSymbols] = useState<DisplayedSymbolData[]>([]);
  const [customSymbols, setCustomSymbols] = useState<CustomSymbolItem[]>([]); // Stores custom symbols { name: englishKeyword, ... }
  const [categorySymbolMap, setCategorySymbolMap] = useState<Map<string, string[]>>(new Map()); // Map<englishCategoryKey, englishKeyword[]>

  const [currentTimeContext, setCurrentTimeContext] = useState<TimeContext>('Default');
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true); // Loading standard categories from storage
  const [loadingCustom, setLoadingCustom] = useState<boolean>(true); // Loading custom symbols from storage
  const [loadingSymbolsState, setLoadingSymbolsState] = useState<boolean>(true); // Loading/translating symbols for display

  const [selectedCategoryOriginalName, setSelectedCategoryOriginalName] = useState<string | null>(null); // English category name/key
  const [navBarDisplayTitle, setNavBarDisplayTitle] = useState(''); // Localized title for display

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

  // --- Load Custom Symbols ---
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
      } catch (e) {
        console.error('SymbolGrid: Failed load custom symbols.', e);
        if (isMountedRef.current) setCustomSymbols([]);
      } finally {
        if (isMountedRef.current) setLoadingCustom(false);
      }
    };
    loadCustom();
  }, []);

  // --- Load/Initialize STANDARD Category Data ---
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
            if (typeof parsed === 'object' && parsed !== null) {
              Object.entries(parsed).forEach(([key, value]) => {
                if (Array.isArray(value)) loadedMap.set(key, value as string[]);
              });
            } else {
              console.warn('SymbolGrid: Invalid category data format in storage.');
              needsSave = true;
            }
          } catch (parseError) {
            console.error('SymbolGrid: Error parsing category data, re-initializing.', parseError);
            needsSave = true;
          }
        } else {
          console.log('SymbolGrid: No standard category data in storage, initializing defaults.');
          needsSave = true;
        }

        APP_CATEGORIES.forEach((cat) => {
          if (cat.isStandard) {
            const categoryKey = cat.name.toLowerCase(); // Use original English name as key
            if (!loadedMap.has(categoryKey)) {
              const defaultKeywords = defaultCategoryData[categoryKey] || []; // Ensure defaultCategoryData uses english keys
              loadedMap.set(categoryKey, defaultKeywords);
              console.log(`SymbolGrid: Initializing default symbols for ${cat.name} from data file.`);
              needsSave = true;
            }
          }
        });

        if (isMountedRef.current) {
          setCategorySymbolMap(loadedMap);
          if (needsSave) {
            await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(loadedMap)));
            console.log('SymbolGrid: Saved initial/updated default category data.');
          }
        }
      } catch (e) {
        console.error('SymbolGrid: Failed to load/initialize standard category data.', e);
        const defaultMap = new Map<string, string[]>();
        APP_CATEGORIES.forEach((cat) => {
          if (cat.isStandard) {
            const key = cat.name.toLowerCase();
            defaultMap.set(key, defaultCategoryData[key] || []);
          }
        });
        if (isMountedRef.current) setCategorySymbolMap(defaultMap);
        Alert.alert(t('common.error'), t('home.errors.loadCategoryFail')); // Use t()
      } finally {
        if (isMountedRef.current) setLoadingCategories(false);
      }
    };
    loadCategoryData();
  }, [t]); // Add t dependency for Alert

  // --- Save STANDARD Category Data Effect (Debounced) ---
  useEffect(() => {
    if (loadingCategories || categorySymbolMap.size === 0) return;
    const saveCategoryData = async () => {
      try {
        await AsyncStorage.setItem(STANDARD_CATEGORY_DATA_KEY, JSON.stringify(Object.fromEntries(categorySymbolMap)));
      } catch (e) {
        console.error('SymbolGrid: Failed to save standard category data.', e);
        Alert.alert(t('common.error'), t('home.errors.saveCategoryFail')); // Use t()
      }
    };
    const timerId = setTimeout(saveCategoryData, 750);
    return () => clearTimeout(timerId);
  }, [categorySymbolMap, loadingCategories, t]); // Add t dependency for Alert

  // --- Effect to Translate Symbols (dynamic data) and Load ---
  const loadAndTranslateSymbols = useCallback(
    async (categoryFilterOriginalName: string | null = null) => {
      if (isLoadingInitialData) {
        setLoadingSymbolsState(true);
        return;
      }
      setLoadingSymbolsState(true);
      flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

      requestAnimationFrame(async () => {
        if (!isMountedRef.current) return;
        try {
          let originalKeywords: string[] = [];
          let imageUrisMap: Map<string, string | undefined> = new Map();
          let symbolIdsPrefix = '';
          let contextName: TimeContext | null = null;
          const filterLower = categoryFilterOriginalName?.toLowerCase();

          // --- Logic to get originalKeywords (unchanged) ---
          if (filterLower === 'custom') {
            symbolIdsPrefix = 'custom';
            originalKeywords = customSymbols.map((cs) => {
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
          // --- End Logic ---

          let translatedKeywords = originalKeywords;
          // Use translateSymbolBatch ONLY for symbol keywords if language is DZO
          if (currentLanguage === 'dzo' && originalKeywords.length > 0) {
            console.log(
              `SymbolGrid: Batch translating ${originalKeywords.length} symbols for category '${
                categoryFilterOriginalName || 'Contextual'
              }' to DZO.`
            );
            const results = await translateSymbolBatch(originalKeywords, 'dzo');
            if (isMountedRef.current && results && results.length === originalKeywords.length) {
              translatedKeywords = results;
            } else if (isMountedRef.current) {
              console.warn('SymbolGrid: Translation length mismatch or error for symbols.');
            }
          }

          if (!isMountedRef.current) return;

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
          console.error('SymbolGrid: Error processing or translating symbols:', err);
          if (isMountedRef.current) {
            const defaultKw = getContextualSymbols('Default');
            setDisplayedSymbols(
              defaultKw.map((k, i) => ({ id: `err_${i}_${k}`, keyword: k, displayText: k }))
            );
            setSelectedCategoryOriginalName(null);
            setCurrentTimeContext('Default');
            Alert.alert(t('common.error'), t('home.errors.loadSymbolsFail')); // Use t()
          }
        } finally {
          if (isMountedRef.current) setLoadingSymbolsState(false);
        }
      });
    },
    [customSymbols, categorySymbolMap, isLoadingInitialData, currentLanguage, translateSymbolBatch, t] // Add t dependency
  );

  // Main Load Effect - Triggered by initial load, language change, or selected category change
  useEffect(() => {
    if (!isLoadingInitialData) {
      console.log(
        `SymbolGrid: Triggering loadAndTranslateSymbols. Selected: ${selectedCategoryOriginalName}, Lang: ${currentLanguage}`
      );
      loadAndTranslateSymbols(selectedCategoryOriginalName);
    }
  }, [isLoadingInitialData, currentLanguage, selectedCategoryOriginalName, loadAndTranslateSymbols]);

  // Category Press Handler
  const handleCategoryPress = useCallback(
    (categoryOriginalName: string) => {
      const currentSelectionKey = selectedCategoryOriginalName?.toLowerCase() ?? 'contextual';
      const newSelectionKey = categoryOriginalName.toLowerCase();

      // Prevent re-selection/re-load if already selected
      if (newSelectionKey === currentSelectionKey) {
        // Handle edge case where Contextual is selected but original name is null
        if (newSelectionKey === 'contextual' && selectedCategoryOriginalName === null) return;
        if (selectedCategoryOriginalName === categoryOriginalName) return;
      }

      // Set the state, the useEffect above will trigger loadAndTranslateSymbols
      setSelectedCategoryOriginalName(newSelectionKey === 'contextual' ? null : categoryOriginalName);
    },
    [selectedCategoryOriginalName]
  );

  // Render Symbol Item
  const renderLeftItem = useCallback(
    ({ item }: { item: DisplayedSymbolData }) => (
      <View style={{ margin: 4 }}>
        <MemoizedSquareComponent
          keyword={item.keyword}
          displayText={item.displayText}
          language={'en'} // For Arasaac API
          imageUri={item.imageUri}
          size={itemWidth}
          onPress={(originalKeyword) => onSymbolPress(originalKeyword, item.imageUri)}
        />
      </View>
    ),
    [onSymbolPress, itemWidth] // itemWidth changes with layout
  );

  // Render Category Item - Use i18next 't' function
  const renderRightItem = useCallback(
    ({ item: categoryInfo }: { item: CategoryInfo }) => {
      const isSelected =
        selectedCategoryOriginalName === categoryInfo.name ||
        (!selectedCategoryOriginalName && categoryInfo.name.toLowerCase() === 'contextual');

      // Get translated category name using i18next's t function
      let displayedName = categoryInfo.name; // Default to original English name (key)
      if (categoryInfo.name.toLowerCase() === 'contextual') {
        displayedName = t('home.contextualCategory');
      } else if (categoryInfo.name.toLowerCase() === 'custom') {
        displayedName = t('home.customCategory');
      } else if (categoryInfo.isStandard) {
        displayedName = t(`categories.${categoryInfo.name}`, { defaultValue: categoryInfo.name });
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
    },
    [selectedCategoryOriginalName, t, handleCategoryPress, theme.border]
  );

  // Add Keyword Function - Use i18next 't' for alerts
  const addKeywordToCategory = useCallback(
    (categoryOriginalNameToAdd: string | null, keywordToAdd: string) => {
      if (!categoryOriginalNameToAdd) {
        console.warn('SymbolGrid: No category to add to.');
        return;
      }
      const categoryNameLower = categoryOriginalNameToAdd.toLowerCase();
      const isStandard = APP_CATEGORIES.find((c) => c.name.toLowerCase() === categoryNameLower)?.isStandard ?? false;

      if (!isStandard) {
        const displayCategoryName = t(`categories.${categoryOriginalNameToAdd}`, {
          defaultValue: categoryOriginalNameToAdd,
        });
        Alert.alert(t('home.cannotAddAlertTitle'), t('home.cannotAddAlertMessage', { category: displayCategoryName }));
        return;
      }

      setCategorySymbolMap((prevMap) => {
        const currentKeywords = prevMap.get(categoryNameLower) || [];
        const keywordLower = keywordToAdd.toLowerCase();

        if (currentKeywords.some((kw) => kw.toLowerCase() === keywordLower)) {
          const displayCategoryName = t(`categories.${categoryOriginalNameToAdd}`, {
            defaultValue: categoryOriginalNameToAdd,
          });
          Alert.alert(
            t('home.alreadyExistsAlertTitle'),
            t('home.alreadyExistsAlertMessage', { symbol: keywordToAdd, category: displayCategoryName })
          );
          return prevMap; // Important: return prevMap if no change
        }

        const updatedKeywords = [...currentKeywords, keywordToAdd].sort((a, b) => a.localeCompare(b));
        const newMap = new Map(prevMap);
        newMap.set(categoryNameLower, updatedKeywords);

        const displayCategoryName = t(`categories.${categoryOriginalNameToAdd}`, {
          defaultValue: categoryOriginalNameToAdd,
        });
        Alert.alert(
          t('home.addSymbolAlertTitle'),
          t('home.addSymbolAlertMessage', { symbol: keywordToAdd, category: displayCategoryName })
        );

        if (selectedCategoryOriginalName === categoryOriginalNameToAdd) {
          loadAndTranslateSymbols(categoryOriginalNameToAdd);
        }
        return newMap; // Return the new map
      });
    },
    [selectedCategoryOriginalName, loadAndTranslateSymbols, t]
  );

  // Expose Methods/State via Imperative Handle
  useImperativeHandle(
  ref,
  () => ({
    addKeywordToCategory,
    selectedCategoryName: selectedCategoryOriginalName,
  }),
  [addKeywordToCategory, selectedCategoryOriginalName] // Corrected dependency
);

  // Dynamic Styles
  const styles = useMemo(
    () => createThemedStyles(theme, fonts, i18n.language),
    [theme, fonts, i18n.language] // Added i18n.language to dependencies
  );

  // Update Navbar Title Effect - Use i18next 't'
  useEffect(() => {
    if (isLoadingInitialData) {
      // Avoid setting title until data is ready or provide a generic loading state
      if (isMountedRef.current) setNavBarDisplayTitle(t('home.loading'));
      return;
    }

    let titleKey = selectedCategoryOriginalName;
    let categoryDisplayTitle = '';

    if (!titleKey) {
      categoryDisplayTitle = `${t('home.contextualCategory')} (${currentTimeContext})`;
    } else if (titleKey.toLowerCase() === 'custom') {
      categoryDisplayTitle = t('home.customCategory');
    } else {
      categoryDisplayTitle = t(`categories.${titleKey}`, { defaultValue: titleKey });
    }

    if (isMountedRef.current) setNavBarDisplayTitle(t('home.symbolsTitle', { category: categoryDisplayTitle }));
  }, [selectedCategoryOriginalName, currentTimeContext, t, i18n.language, isLoadingInitialData]);

  // Loading States - Simplified
  const showGridLoading = isLoadingInitialData || loadingSymbolsState || isTranslatingSymbols; // API calls for symbols
  const showCategoryListLoading = loadingCategories; // Only initial category data loading

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => handleCategoryPress('Contextual')}
          activeOpacity={0.7}
          style={styles.navBarTouchable}
        >
          <Text style={styles.navBarTitle} numberOfLines={1} ellipsizeMode="tail">
            {/* Show loading specifically if initial load or grid loading */}
            {isLoadingInitialData || loadingSymbolsState ? t('home.loading') : navBarDisplayTitle}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Content */}
      <View style={styles.content}>
        {/* Left Side (Symbols Grid) */}
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
                  <Text style={styles.emptyListText}>{t('home.noSymbols')}</Text>
                </View>
              }
              initialNumToRender={numGridColumns * 4}
              maxToRenderPerBatch={numGridColumns * 3}
              windowSize={11}
              removeClippedSubviews={Platform.OS === 'android'}
              extraData={`${itemWidth}-${numGridColumns}-${displayedSymbols.length}-${currentLanguage}`}
            />
          )}
        </View>
        {/* Right Side (Categories) */}
        <View style={styles.rightSide}>
          {showCategoryListLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
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
              extraData={`${selectedCategoryOriginalName}-${currentLanguage}`} // Re-render list on lang change for t()
            />
          )}
        </View>
      </View>
    </View>
  );
});

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
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
    navBarTouchable: { paddingHorizontal: 15, paddingVertical: 5 },
    navBarTitle: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage), // Apply typography for label
      fontWeight: '600',
      color: theme.white,
    },
    content: { flexDirection: 'row', flex: 1 },
    leftSide: { flex: 8, backgroundColor: theme.background },
    rightSide: {
      flex: 2.5,
      backgroundColor: theme.card,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.border,
    },
    categoryFlatList: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 },
    gridContentContainer: { padding: 5, alignItems: 'flex-start' },
    categoryListContainer: { paddingVertical: 0, paddingHorizontal: 0 },
    emptyListText: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage), // Apply typography for body
      textAlign: 'center',
      color: theme.textSecondary,
    },
  });

// Memoize the component
export default React.memo(SymbolGrid);