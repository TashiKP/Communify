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
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import SquareComponent from './SquareComponent';
import CategoryListItem from './CategoryListItem';
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { useLanguage } from '../context/LanguageContext';

import apiService, {
  handleApiError,
  StandardCategorySymbolMap,
  TimeContextSymbolsResponse,
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
  name: string;
  isStandard?: boolean;
}

const APP_CATEGORIES_BASE: CategoryInfo[] = [
  { id: 'cat_contextual', name: 'contextual', isStandard: false },
  { id: 'cat_custom', name: 'custom', isStandard: false },
  { id: 'cat_food', name: 'food', isStandard: true },
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

export interface SymbolGridProps {
  onSymbolPress: (keyword: string, imageUri?: string) => void;
  onCategoryNameChange?: (name: string) => void;
}

export interface SymbolGridRef {
  addSymbolToLocalCustomCategory: (keywordToAdd: string, imageUri?: string) => Promise<void>;
  selectedCategoryName: string | null;
}

const MemoizedSquareComponent = React.memo(SquareComponent);

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
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

const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(
  ({ onSymbolPress, onCategoryNameChange }, ref) => {
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
    const [loadingApiTimeContext, setLoadingApiTimeContext] = useState<boolean>(true);
    const [loadingLocalCustom, setLoadingLocalCustom] = useState<boolean>(true);
    const [loadingDisplayedSymbols, setLoadingDisplayedSymbols] = useState<boolean>(true);

    const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);

    const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
    const isMountedRef = useRef(true);

    const styles = useMemo(
      () => createThemedStyles(theme, fonts, i18n.language),
      [theme, fonts, i18n.language]
    );

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        console.log('[SymbolGrid] Unmounted');
      };
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
        Alert.alert(t('common.error', 'Error'), t('home.errors.loadCategoryFail', 'Failed to load categories.'));
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
      fetchApiTimeContextSymbols();
    }, [fetchApiStandardCategories, fetchApiTimeContextSymbols]);

    useEffect(() => {
      if (loadingApiStandardCategories) return;

      const apiCategoryKeys = Object.keys(apiStandardCategories);
      const currentNonStandard = APP_CATEGORIES_BASE.filter(c => !c.isStandard);
      const standardFromApi = apiCategoryKeys.map(key => {
        const baseCat = APP_CATEGORIES_BASE.find(bc => bc.name.toLowerCase() === key.toLowerCase());
        return {
          id: `cat_${key.toLowerCase()}`,
          name: baseCat ? baseCat.name : key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
          isStandard: true,
        };
      });
      const sortedStandardFromApi = standardFromApi.sort((a, b) => a.name.localeCompare(b.name));
      if (isMountedRef.current) {
        setAllDisplayCategories([...currentNonStandard, ...sortedStandardFromApi].sort((a, b) => {
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
            setLocalCustomSymbols(Array.isArray(loaded) ? loaded.sort((a: CustomSymbolItem, b: CustomSymbolItem) => a.name.localeCompare(b.name)) : []);
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
      if (localCustomSymbols.length === 0 && !AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY)) return;

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
        if (isLoadingInitialData) {
          setLoadingDisplayedSymbols(true);
          return;
        }
        setLoadingDisplayedSymbols(true);
        flatListRefLeft.current?.scrollToOffset({ offset: 0, animated: false });

        try {
          let originalKeywords: string[] = [];
          let imageUrisMap: Map<string, string | undefined> = new Map();
          let isCustomCategory = false;
          let symbolIdsPrefix = '';
          let currentCategoryDisplayName = '';

          const effectiveCategoryKey = categoryKeyToLoad ?? 'contextual';

          if (effectiveCategoryKey === 'custom') {
            symbolIdsPrefix = 'custom';
            isCustomCategory = true;
            originalKeywords = localCustomSymbols.map((cs) => {
              imageUrisMap.set(cs.name, cs.imageUri);
              return cs.name;
            });
            currentCategoryDisplayName = t('home.customCategory', 'Custom');
          } else if (effectiveCategoryKey === 'contextual') {
            symbolIdsPrefix = `ctx_api`;
            originalKeywords = [...apiTimeContextSymbols].sort((a, b) => a.localeCompare(b));
            currentCategoryDisplayName = t('home.contextualCategory', 'Contextual');
          } else {
            symbolIdsPrefix = `cat_${effectiveCategoryKey}`;
            originalKeywords = [...(apiStandardCategories[effectiveCategoryKey] || [])].sort((a, b) => a.localeCompare(b));
            const catInfo = allDisplayCategories.find(c => c.name.toLowerCase() === effectiveCategoryKey);
            currentCategoryDisplayName = t(`categories.${catInfo ? catInfo.name : effectiveCategoryKey}`, {
              defaultValue: catInfo ? catInfo.name : effectiveCategoryKey.charAt(0).toUpperCase() + effectiveCategoryKey.slice(1).toLowerCase(),
            });
          }

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

          setDisplayedSymbols(symbolsData);
          if (onCategoryNameChange) {
            onCategoryNameChange(currentCategoryDisplayName);
          }
        } catch (err) {
          console.error('SymbolGrid: Error processing or translating symbols:', err);
          if (isMountedRef.current) {
            setDisplayedSymbols([]);
            Alert.alert(t('common.error', 'Error'), t('home.errors.loadSymbolsFail', 'Failed to load symbols.'));
          }
        } finally {
          if (isMountedRef.current) setLoadingDisplayedSymbols(false);
        }
      },
      [
        localCustomSymbols,
        apiStandardCategories,
        apiTimeContextSymbols,
        allDisplayCategories,
        isLoadingInitialData,
        currentLanguage,
        translateSymbolBatch,
        t,
        onCategoryNameChange,
      ]
    );

    useEffect(() => {
      if (!isLoadingInitialData) {
        loadAndTranslateSymbols(selectedCategoryKey);
      } else if (onCategoryNameChange && selectedCategoryKey === null) {
        onCategoryNameChange(t('home.contextualCategory', 'Contextual'));
      }
    }, [isLoadingInitialData, selectedCategoryKey, loadAndTranslateSymbols, currentLanguage, onCategoryNameChange, t]);

    const handleCategoryPress = useCallback(
      (categoryInfo: CategoryInfo) => {
        const newKey = categoryInfo.name.toLowerCase();
        const currentKey = selectedCategoryKey ?? 'contextual';

        if (newKey === currentKey) return;

        setSelectedCategoryKey(newKey === 'contextual' ? null : newKey);
      },
      [selectedCategoryKey]
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
          displayedName = t('home.contextualCategory', 'Contextual');
        } else if (categoryKey === 'custom') {
          displayedName = t('home.customCategory', 'Custom');
        } else {
          const foundCatInfo = allDisplayCategories.find(c => c.name.toLowerCase() === categoryKey);
          displayedName = t(`categories.${foundCatInfo ? foundCatInfo.name : categoryKey}`, {
            defaultValue: foundCatInfo ? foundCatInfo.name : categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).toLowerCase(),
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
          Alert.alert(t('common.error', 'Error'), t('home.errors.emptySymbolName', 'Symbol name cannot be empty.'));
          return;
        }
        const keywordLower = keywordToAdd.toLowerCase();
        if (localCustomSymbols.some((cs) => cs.name.toLowerCase() === keywordLower)) {
          Alert.alert(t('home.alreadyExistsAlertTitle', 'Already Exists'), t('home.customSymbolExists', { symbol: keywordToAdd }));
          return;
        }
        const newSymbol: CustomSymbolItem = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: keywordToAdd.trim(),
          imageUri,
        };
        if (isMountedRef.current) {
          setLocalCustomSymbols((prev) => [...prev, newSymbol].sort((a, b) => a.name.localeCompare(b.name)));
          Alert.alert(t('home.addSymbolAlertTitle', 'Symbol Added'), t('home.addCustomSymbolSuccess', { symbol: keywordToAdd.trim() }));
        }
      },
      [localCustomSymbols, t]
    );

    useImperativeHandle(ref, () => ({
      addSymbolToLocalCustomCategory,
      selectedCategoryName: selectedCategoryKey,
    }), [addSymbolToLocalCustomCategory, selectedCategoryKey]);

    const showGridLoading = isLoadingInitialData || loadingDisplayedSymbols || isTranslatingSymbols;
    const showCategoryListLoading = loadingApiStandardCategories;

    return (
      <View style={styles.container}>
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
                    <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>{t('home.noSymbols', 'No symbols to display.')}</Text>
                  </View>
                }
                initialNumToRender={numGridColumns * 5}
                maxToRenderPerBatch={numGridColumns * 4}
                windowSize={Platform.OS === 'ios' ? 21 : 11}
                removeClippedSubviews={false} // Disable to prevent View hierarchy issues
                getItemLayout={(_, index) => ({
                  length: itemWidth + 8,
                  offset: (itemWidth + 8) * index,
                  index,
                })}
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
                removeClippedSubviews={false} // Disable to prevent View hierarchy issues
                initialNumToRender={allDisplayCategories.length} // Render all categories upfront
              />
            )}
          </View>
        </View>
      </View>
    );
  }
);

export default React.memo(SymbolGrid);