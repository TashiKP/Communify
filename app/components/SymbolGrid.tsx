// src/components/SymbolDisplay/SymbolGrid.tsx
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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import SquareComponent from './SymbolDisplay/SquareComponent';
import {
  FontSizes,
  ThemeColors,
  useAppearance,
} from '../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../styles/typography';
import {
  CategoryInfo,
  CustomSymbolItem,
  DisplayedSymbolData,
  SymbolGridProps,
  SymbolGridRef,
} from './SymbolDisplay/types';
import {useGrid} from '../context/GridContext';
import {useLanguage} from '../context/LanguageContext';
import {calculateItemWidth, getNumColumns} from './SymbolDisplay/gridHelpers';
import apiService, {
  handleApiError,
  StandardCategorySymbolMap,
  TimeContextSymbolsResponse,
} from '../services/apiService';
import {
  APP_CATEGORIES_BASE,
  CUSTOM_SYMBOLS_STORAGE_KEY,
} from './SymbolDisplay/constants';
import CategoryListItem from './SymbolDisplay/CategoryListItem';

const MemoizedSquareComponent = React.memo(SquareComponent);

// Define ITEM_MARGIN here or import it from your constants/theme file
const ITEM_MARGIN = 5; // Example value, adjust as needed

const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) => {
  const bodyStyles = getLanguageSpecificTextStyle(
    'body',
    fonts,
    currentLanguage,
  );
  return StyleSheet.create({
    container: {flex: 1, backgroundColor: theme.background},
    content: {flexDirection: 'row', flex: 1},
    leftSide: {flex: 8, backgroundColor: theme.background},
    rightSide: {
      flex: 2.5,
      backgroundColor: theme.card,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    categoryFlatList: {flex: 1},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      minHeight: 200,
    },
    gridContentContainer: {padding: ITEM_MARGIN / 2, alignItems: 'flex-start'}, // Adjusted padding based on ITEM_MARGIN
    categoryListContainer: {paddingVertical: 5},
    emptyListText: {...bodyStyles, fontWeight: '400', textAlign: 'center'},
  });
};

const SymbolGrid = forwardRef<SymbolGridRef, SymbolGridProps>(
  ({onSymbolPress, onCategoryNameChange}, ref) => {
    const {gridLayout, isLoadingLayout: isLoadingGridLayout} = useGrid();
    const {theme, fonts, isLoadingAppearance} = useAppearance();
    const {currentLanguage, translateSymbolBatch, isTranslatingSymbols} =
      useLanguage();
    const {t, i18n} = useTranslation();

    const numGridColumns = useMemo(
      () => getNumColumns(gridLayout),
      [gridLayout],
    );
    const itemWidth = useMemo(
      () => calculateItemWidth(gridLayout, numGridColumns, ITEM_MARGIN),
      [gridLayout, numGridColumns],
    );

    const [displayedSymbols, setDisplayedSymbols] = useState<
      DisplayedSymbolData[]
    >([]);
    const [localCustomSymbols, setLocalCustomSymbols] = useState<
      CustomSymbolItem[]
    >([]);
    const [apiStandardCategories, setApiStandardCategories] =
      useState<StandardCategorySymbolMap>({});
    const [apiTimeContextSymbols, setApiTimeContextSymbols] =
      useState<TimeContextSymbolsResponse>([]);
    const [allDisplayCategories, setAllDisplayCategories] =
      useState<CategoryInfo[]>(APP_CATEGORIES_BASE);

    const [loadingApiStandardCategories, setLoadingApiStandardCategories] =
      useState<boolean>(true);
    const [loadingApiTimeContext, setLoadingApiTimeContext] =
      useState<boolean>(true);
    const [loadingLocalCustom, setLoadingLocalCustom] = useState<boolean>(true);
    const [loadingDisplayedSymbols, setLoadingDisplayedSymbols] =
      useState<boolean>(true);

    const [selectedCategoryKey, setSelectedCategoryKey] = useState<
      string | null
    >(null);

    const flatListRefLeft = useRef<FlatList<DisplayedSymbolData>>(null);
    const isMountedRef = useRef(true);
    const initialCustomSymbolsLoadDone = useRef(false);

    const styles = useMemo(
      () => createThemedStyles(theme, fonts, i18n.language),
      [theme, fonts, i18n.language],
    );

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const isLoadingInitialData =
      isLoadingAppearance ||
      isLoadingGridLayout ||
      loadingApiStandardCategories ||
      loadingLocalCustom ||
      loadingApiTimeContext;

    const fetchApiStandardCategories = useCallback(async () => {
      if (!isMountedRef.current) return;
      setLoadingApiStandardCategories(true);
      try {
        const data = await apiService.getStandardCategories();
        if (isMountedRef.current) setApiStandardCategories(data || {});
      } catch (error) {
        console.error(
          'SymbolGrid: Failed to load standard categories from API.',
          handleApiError(error),
        );
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
        if (isMountedRef.current) setApiTimeContextSymbols(symbols || []);
      } catch (error) {
        console.error(
          'SymbolGrid: Failed to load time context symbols from API.',
          handleApiError(error),
        );
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

      const baseNonStandardCategories = APP_CATEGORIES_BASE.filter(
        c => !c.isStandard,
      );
      const apiCategoryKeys = Object.keys(apiStandardCategories);

      const apiGeneratedStandardCategories = apiCategoryKeys.map(key => {
        // --- FIX APPLIED HERE ---
        const predefinedStandardCat = APP_CATEGORIES_BASE.find(
          bc =>
            bc.isStandard === true &&
            bc.name.toLowerCase() === key.toLowerCase(),
        );
        return {
          id: `cat_${key.toLowerCase()}`,
          // Ensure name is a string before calling charAt/slice
          name:
            predefinedStandardCat && predefinedStandardCat.name
              ? predefinedStandardCat.name
              : key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
          isStandard: true,
        };
      });

      const combined = [...baseNonStandardCategories];
      apiGeneratedStandardCategories.forEach(apiCat => {
        if (
          !combined.some(
            existingCat =>
              existingCat.name.toLowerCase() === apiCat.name.toLowerCase(),
          )
        ) {
          combined.push(apiCat);
        }
      });

      if (isMountedRef.current) {
        setAllDisplayCategories(
          combined.sort((a, b) => {
            if (a.name.toLowerCase() === 'contextual') return -1;
            if (b.name.toLowerCase() === 'contextual') return 1;
            if (a.name.toLowerCase() === 'custom') return -1; // Keep custom near the top after contextual
            if (b.name.toLowerCase() === 'custom') return 1;
            return a.name.localeCompare(b.name);
          }),
        );
      }
    }, [apiStandardCategories, loadingApiStandardCategories]);

    useEffect(() => {
      setLoadingLocalCustom(true);
      initialCustomSymbolsLoadDone.current = false;
      const loadCustom = async () => {
        try {
          const val = await AsyncStorage.getItem(CUSTOM_SYMBOLS_STORAGE_KEY);
          if (isMountedRef.current) {
            const loaded = val ? JSON.parse(val) : [];
            setLocalCustomSymbols(
              Array.isArray(loaded)
                ? loaded.sort((a: CustomSymbolItem, b: CustomSymbolItem) =>
                    a.name.localeCompare(b.name),
                  )
                : [],
            );
          }
        } catch (e) {
          console.error(
            'SymbolGrid: Failed load custom symbols from AsyncStorage.',
            e,
          );
          if (isMountedRef.current) setLocalCustomSymbols([]);
        } finally {
          if (isMountedRef.current) {
            setLoadingLocalCustom(false);
            initialCustomSymbolsLoadDone.current = true;
          }
        }
      };
      loadCustom();
    }, []);

    useEffect(() => {
      if (!initialCustomSymbolsLoadDone.current || loadingLocalCustom) return;

      const saveCustomSymbols = async () => {
        try {
          await AsyncStorage.setItem(
            CUSTOM_SYMBOLS_STORAGE_KEY,
            JSON.stringify(localCustomSymbols),
          );
        } catch (e) {
          console.error(
            'SymbolGrid: Failed to save custom symbols to AsyncStorage.',
            e,
          );
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
        flatListRefLeft.current?.scrollToOffset({offset: 0, animated: false});

        try {
          let originalKeywords: string[] = [];
          let imageUrisMap: Map<string, string | undefined> = new Map();
          let isCustomCategory = false;
          let symbolIdsPrefix = '';
          let currentCategoryDisplayName = '';
          const effectiveCategoryKey = categoryKeyToLoad ?? 'contextual';
          // Ensure categoryInfo.name exists before using it for translation key
          const categoryInfo = allDisplayCategories.find(
            c => c.name.toLowerCase() === effectiveCategoryKey.toLowerCase(),
          );

          if (effectiveCategoryKey === 'custom') {
            symbolIdsPrefix = 'custom_sym';
            isCustomCategory = true;
            originalKeywords = localCustomSymbols.map(cs => {
              imageUrisMap.set(cs.name, cs.imageUri);
              return cs.name;
            });
            currentCategoryDisplayName = t('home.customCategory');
          } else if (effectiveCategoryKey === 'contextual') {
            symbolIdsPrefix = 'ctx_api_sym';
            originalKeywords = [...apiTimeContextSymbols].sort((a, b) =>
              a.localeCompare(b),
            );
            currentCategoryDisplayName = t('home.contextualCategory');
          } else {
            symbolIdsPrefix = `cat_api_${effectiveCategoryKey}_sym`;
            originalKeywords = [
              ...(apiStandardCategories[effectiveCategoryKey] || []),
            ].sort((a, b) => a.localeCompare(b));
            // Use a safe name for translation key, and provide a robust defaultValue
            const safeCategoryName = categoryInfo?.name || effectiveCategoryKey;
            currentCategoryDisplayName = t(
              `categories.${safeCategoryName.toLowerCase()}`,
              {
                defaultValue:
                  safeCategoryName.charAt(0).toUpperCase() +
                  safeCategoryName.slice(1).toLowerCase(),
              },
            );
          }

          let translatedKeywords = originalKeywords;
          if (currentLanguage === 'dzo' && originalKeywords.length > 0) {
            const results = await translateSymbolBatch(originalKeywords, 'dzo');
            if (
              isMountedRef.current &&
              results?.length === originalKeywords.length
            ) {
              translatedKeywords = results;
            }
          }

          if (!isMountedRef.current) return;
          const symbolsData: DisplayedSymbolData[] = originalKeywords.map(
            (originalKw, idx) => ({
              id: `${symbolIdsPrefix}_${idx}_${originalKw
                .replace(/\s+/g, '_')
                .toLowerCase()}`,
              keyword: originalKw,
              displayText: translatedKeywords[idx] || originalKw,
              imageUri: imageUrisMap.get(originalKw),
              isCustom: isCustomCategory,
            }),
          );
          setDisplayedSymbols(symbolsData);
          if (onCategoryNameChange)
            onCategoryNameChange(currentCategoryDisplayName);
        } catch (err) {
          console.error(
            'SymbolGrid: Error processing or translating symbols:',
            err,
          );
          if (isMountedRef.current) setDisplayedSymbols([]);
          Alert.alert(t('common.error'), t('home.errors.loadSymbolsFail'));
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
      ],
    );

    useEffect(() => {
      if (!isLoadingInitialData) {
        loadAndTranslateSymbols(selectedCategoryKey);
      } else if (
        onCategoryNameChange &&
        selectedCategoryKey === null &&
        !loadingApiTimeContext &&
        !loadingApiStandardCategories &&
        !loadingLocalCustom
      ) {
        onCategoryNameChange(t('home.contextualCategory'));
      }
    }, [
      isLoadingInitialData,
      selectedCategoryKey,
      loadAndTranslateSymbols,
      currentLanguage,
      onCategoryNameChange,
      t,
      loadingApiTimeContext,
      loadingApiStandardCategories,
      loadingLocalCustom,
    ]);

    const handleCategoryPress = useCallback(
      (categoryInfo: CategoryInfo) => {
        const newKey = categoryInfo.name.toLowerCase();
        const currentEffectiveKey = selectedCategoryKey ?? 'contextual';
        if (newKey === currentEffectiveKey) return;
        setSelectedCategoryKey(newKey === 'contextual' ? null : newKey);
      },
      [selectedCategoryKey],
    );

    const renderLeftItem = useCallback(
      ({item}: {item: DisplayedSymbolData}) => (
        // --- FIX APPLIED HERE ---
        <View style={{margin: ITEM_MARGIN / 2}}>
          {/* Dividing by 2 for margin around item, consistent with gridContentContainer padding */}
          <MemoizedSquareComponent
            keyword={item.keyword}
            displayText={item.displayText}
            imageUri={item.imageUri}
            size={itemWidth}
            onPress={(originalKeyword: any) =>
              onSymbolPress(originalKeyword, item.imageUri)
            }
          />
        </View>
      ),
      [onSymbolPress, itemWidth],
    );

    const renderRightItem = useCallback(
      ({item: categoryInfo}: {item: CategoryInfo}) => {
        const categoryKey = categoryInfo.name.toLowerCase();
        const isSelected =
          (selectedCategoryKey ?? 'contextual') === categoryKey;
        let displayedName = categoryInfo.name;
        if (categoryKey === 'contextual')
          displayedName = t('home.contextualCategory');
        else if (categoryKey === 'custom')
          displayedName = t('home.customCategory');
        // Use a safe name for translation key, and provide a robust defaultValue
        else
          displayedName = t(`categories.${categoryInfo.name.toLowerCase()}`, {
            defaultValue:
              categoryInfo.name.charAt(0).toUpperCase() +
              categoryInfo.name.slice(1).toLowerCase(),
          });

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
      [selectedCategoryKey, t, handleCategoryPress, theme.border],
    );

    const addSymbolToLocalCustomCategory = useCallback(
      async (keywordToAdd: string, imageUri?: string) => {
        if (!keywordToAdd.trim()) {
          Alert.alert(t('common.error'), t('home.errors.emptySymbolName'));
          return;
        }
        const keywordLower = keywordToAdd.toLowerCase();
        if (
          localCustomSymbols.some(cs => cs.name.toLowerCase() === keywordLower)
        ) {
          Alert.alert(
            t('home.alreadyExistsAlertTitle'),
            t('home.customSymbolExists', {symbol: keywordToAdd}),
          );
          return;
        }
        const newSymbol: CustomSymbolItem = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: keywordToAdd.trim(),
          imageUri,
        };
        if (isMountedRef.current) {
          setLocalCustomSymbols(prev =>
            [...prev, newSymbol].sort((a, b) => a.name.localeCompare(b.name)),
          );
          Alert.alert(
            t('home.addSymbolAlertTitle'),
            t('home.addCustomSymbolSuccess', {symbol: keywordToAdd.trim()}),
          );
        }
      },
      [localCustomSymbols, t],
    );

    useImperativeHandle(
      ref,
      () => ({
        addSymbolToLocalCustomCategory,
        selectedCategoryName: selectedCategoryKey ?? 'contextual',
      }),
      [addSymbolToLocalCustomCategory, selectedCategoryKey],
    );

    const showGridLoading =
      isLoadingInitialData || loadingDisplayedSymbols || isTranslatingSymbols;
    const showCategoryListLoading = isLoadingInitialData;

    // --- FIX APPLIED HERE ---
    const itemContainerHeight = itemWidth + ITEM_MARGIN; // Total height including margin (ITEM_MARGIN/2 top + ITEM_MARGIN/2 bottom)

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
                keyExtractor={item => item.id}
                numColumns={numGridColumns}
                key={`${numGridColumns}-${gridLayout}-${currentLanguage}`}
                contentContainerStyle={styles.gridContentContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text
                      style={[
                        styles.emptyListText,
                        {color: theme.textSecondary},
                      ]}>
                      {t('home.noSymbols')}
                    </Text>
                  </View>
                }
                initialNumToRender={numGridColumns * 5}
                maxToRenderPerBatch={numGridColumns * 3}
                windowSize={Platform.OS === 'ios' ? 21 : 10}
                removeClippedSubviews={false} // Set to false if experiencing issues, true can improve performance
                getItemLayout={(data, index) => ({
                  length: itemContainerHeight,
                  offset:
                    itemContainerHeight * Math.floor(index / numGridColumns),
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
                keyExtractor={item => item.id}
                contentContainerStyle={styles.categoryListContainer}
                extraData={`${selectedCategoryKey}-${currentLanguage}-${allDisplayCategories.length}`}
                removeClippedSubviews={false} // Set to false if experiencing issues
                initialNumToRender={
                  allDisplayCategories.length > 25
                    ? 25
                    : allDisplayCategories.length
                }
              />
            )}
          </View>
        </View>
      </View>
    );
  },
);

export default React.memo(SymbolGrid);
