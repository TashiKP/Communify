import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  Image,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faSearch,
  faTimesCircle,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import {useTranslation} from 'react-i18next';

import {useGrid, GridLayoutType} from '../context/GridContext';
import {
  useAppearance,
  ThemeColors,
  FontSizes,
} from '../context/AppearanceContext';
import {
  getLanguageSpecificTextStyle,
  DZONGKHA_FONT_FAMILY,
  DZONGKHA_TYPOGRAPHY_ADJUSTMENTS,
} from '../styles/typography';

const DEBOUNCE_DELAY = 400;
const MAX_RESULTS = 40;
const screenWidth = Dimensions.get('window').width;
const errorColor = '#f56565'; // Updated to align with theme.error

const getNumColumns = (layout: GridLayoutType): number => {
  switch (layout) {
    case 'simple':
      return 6;
    case 'standard':
      return 8;
    case 'dense':
      return 10;
    default:
      return 8;
  }
};
const calculateItemWidth = (
  layout: GridLayoutType,
  numCols: number,
): number => {
  const gridPadding = 16;
  const itemMargin = 6;
  const totalMargins = itemMargin * 2 * numCols;
  const totalPadding = gridPadding * 2;
  const availableWidth = screenWidth - totalPadding - totalMargins;
  return Math.max(70, Math.floor(availableWidth / numCols));
};

interface ArasaacSearchResult {
  _id: number;
  keywords: {keyword: string}[];
}
interface SymbolResult {
  id: string;
  keyword: string;
  pictogramUrl: string;
}

interface SearchScreenProps {
  onCloseSearch: () => void;
  language: string;
  onSelectSymbol: (symbol: {keyword: string; pictogramUrl: string}) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({
  onCloseSearch,
  language,
  onSelectSymbol,
}) => {
  const {gridLayout, isLoadingLayout: isLoadingGridLayout} = useGrid();
  const {theme, fonts, isLoadingAppearance} = useAppearance();
  const {t, i18n} = useTranslation();
  const currentLanguage = i18n.language;

  const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
  const itemWidth = useMemo(
    () => calculateItemWidth(gridLayout, numGridColumns),
    [gridLayout, numGridColumns],
  );

  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const isMountedRef = useRef(true);

  const isLoadingInitialContext = isLoadingGridLayout || isLoadingAppearance;

  const styles = useMemo(
    () => createThemedStyles(theme, fonts, currentLanguage),
    [theme, fonts, currentLanguage],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const trimmedText = searchText.trim();
      if (trimmedText.length > 1) {
        if (isMountedRef.current) setDebouncedSearchText(trimmedText);
      } else {
        if (isMountedRef.current) {
          setDebouncedSearchText('');
          setResults([]);
          setError(null);
        }
      }
    }, DEBOUNCE_DELAY);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchText]);

  useEffect(() => {
    if (!debouncedSearchText) {
      if (isMountedRef.current) {
        setResults([]);
        setError(null);
        setIsLoadingSearch(false);
      }
      return;
    }
    const fetchSymbols = async () => {
      if (!isMountedRef.current) return;
      setIsLoadingSearch(true);
      setError(null);
      setResults([]);
      const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(
        debouncedSearchText,
      )}`;
      try {
        const response = await axios.get<ArasaacSearchResult[]>(searchUrl);
        if (isMountedRef.current) {
          if (response.data?.length > 0) {
            const processedResults = response.data
              .slice(0, MAX_RESULTS)
              .map(item => ({
                id: String(item._id),
                keyword:
                  item.keywords.find(k => k.keyword)?.keyword ||
                  t('searchScreen.defaultSymbolKeyword'),
                pictogramUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
              }));
            setResults(processedResults);
          } else {
            setResults([]);
          }
        }
      } catch (err: any) {
        console.error('Search API Error:', err);
        if (isMountedRef.current) {
          setError(t('searchScreen.errors.loadFail'));
          setResults([]);
        }
      } finally {
        if (isMountedRef.current) setIsLoadingSearch(false);
      }
    };
    fetchSymbols();
  }, [debouncedSearchText, language, t]);

  const handleTextChange = (text: string) => setSearchText(text);
  const handleSelectResult = (symbol: SymbolResult) => {
    Keyboard.dismiss();
    onSelectSymbol({
      keyword: symbol.keyword,
      pictogramUrl: symbol.pictogramUrl,
    });
    onCloseSearch();
  };
  const handleCancel = () => {
    Keyboard.dismiss();
    onCloseSearch();
  };

  useEffect(() => {
    let focusTimer: NodeJS.Timeout | null = null;
    if (!isLoadingInitialContext) {
      focusTimer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);
    }
    return () => {
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [isLoadingInitialContext]);

  const renderGridItem = useCallback(
    ({item}: {item: SymbolResult}) => {
      const dynamicFontSize = Math.max(
        fonts.caption * 0.9,
        Math.min(fonts.body, Math.floor(itemWidth * 0.11)),
      );

      let dynamicLineHeight: number;
      if (currentLanguage === 'dzo') {
        const adjustment = DZONGKHA_TYPOGRAPHY_ADJUSTMENTS.caption;
        dynamicLineHeight = dynamicFontSize * adjustment.lineHeightMultiplier;
      } else {
        dynamicLineHeight = dynamicFontSize * 1.4;
      }

      return (
        <View style={styles.gridItemContainer}>
          <TouchableOpacity
            style={[styles.gridItemCard, {width: itemWidth}]}
            onPress={() => handleSelectResult(item)}
            activeOpacity={0.6}
            accessibilityLabel={t('searchScreen.symbolAccessibilityLabel', {
              keyword: item.keyword,
            })}
            accessibilityRole="button">
            <View style={styles.gridItemImageWrapper}>
              <Image
                source={{uri: item.pictogramUrl}}
                style={styles.gridItemImage}
                resizeMode="contain"
                onError={() =>
                  console.warn(`Failed to load image for ${item.keyword}`)
                }
              />
            </View>
            <View style={styles.gridItemTextWrapper}>
              <Text
                style={[
                  styles.gridItemText,
                  {fontSize: dynamicFontSize, lineHeight: dynamicLineHeight},
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {item.keyword}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [itemWidth, fonts, handleSelectResult, styles, t, currentLanguage],
  );

  const renderContent = () => {
    if (isLoadingInitialContext) {
      return (
        <ActivityIndicator
          style={styles.statusIndicator}
          size="large"
          color={theme.primary}
        />
      );
    }
    if (isLoadingSearch) {
      return (
        <ActivityIndicator
          style={styles.statusIndicator}
          size="large"
          color={theme.primary}
        />
      );
    }
    if (error) {
      return <Text style={styles.statusTextError}>{error}</Text>;
    }
    if (debouncedSearchText.length <= 1 && searchText.length > 0) {
      return (
        <Text style={styles.statusText}>
          {t('searchScreen.statusEnterMoreChars')}
        </Text>
      );
    }
    if (debouncedSearchText.length > 1 && results.length === 0) {
      return (
        <Text style={styles.statusText}>
          {t('searchScreen.statusNoResults', {query: debouncedSearchText})}
        </Text>
      );
    }
    if (searchText.length === 0) {
      return (
        <Text style={styles.statusText}>{t('searchScreen.statusInitial')}</Text>
      );
    }

    return (
      <FlatList
        data={results}
        renderItem={renderGridItem}
        keyExtractor={item => `${item.id}-${gridLayout}`}
        numColumns={numGridColumns}
        key={numGridColumns.toString()}
        style={styles.resultsList}
        contentContainerStyle={styles.resultsListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={numGridColumns * 4}
        maxToRenderPerBatch={numGridColumns * 3}
        windowSize={10}
        removeClippedSubviews={true}
        extraData={`${itemWidth}-${numGridColumns}-${results.length}-${currentLanguage}`}
      />
    );
  };

  return (
    <Modal visible={true} animationType="slide" onRequestClose={handleCancel}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon
                icon={faSearch}
                size={fonts.body * 1.2}
                color={theme.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                ref={textInputRef}
                style={styles.input}
                placeholder={t('searchScreen.placeholder')}
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={handleTextChange}
                returnKeyType="search"
                selectionColor={theme.primary}
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
                onSubmitEditing={Keyboard.dismiss}
                keyboardAppearance={theme.isDark ? 'dark' : 'light'}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchText('')}
                  style={styles.clearButton}
                  accessibilityLabel={t(
                    'searchScreen.clearSearchAccessibilityLabel',
                  )}>
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size={fonts.body * 1.2}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButton}
              accessibilityLabel={t('common.cancel')}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentArea}>{renderContent()}</View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createThemedStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) => {
  const bodyTextStyles = getLanguageSpecificTextStyle(
    'body',
    fonts,
    currentLanguage,
  );
  const buttonTextStyles = getLanguageSpecificTextStyle(
    'button',
    fonts,
    currentLanguage,
  );

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.primary,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'ios' ? 16 : 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      ...bodyTextStyles,
      color: theme.text,
      paddingVertical: 0,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    clearButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: theme.card,
      marginLeft: 8,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.primaryMuted,
      marginLeft: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    cancelButtonText: {
      ...buttonTextStyles,
      color: theme.primary,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    contentArea: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
    },
    statusIndicator: {
      marginTop: 48,
    },
    statusText: {
      marginTop: 48,
      textAlign: 'center',
      paddingHorizontal: 24,
      ...bodyTextStyles,
      color: theme.textSecondary,
      fontWeight: '500',
      letterSpacing: 0.3,
      opacity: 0.7,
    },
    statusTextError: {
      marginTop: 48,
      textAlign: 'center',
      paddingHorizontal: 24,
      ...bodyTextStyles,
      color: errorColor,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    resultsList: {
      flex: 1,
    },
    resultsListContent: {
      paddingHorizontal: 0,
      paddingTop: 16,
      paddingBottom: 48,
      alignItems: 'flex-start',
    },
    gridItemContainer: {
      margin: 6,
    },
    gridItemCard: {
      aspectRatio: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: theme.isDark ? 0.2 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    gridItemImageWrapper: {
      flex: 1,
      width: '100%',
      padding: '8%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    gridItemImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    gridItemTextWrapper: {
      height: 36,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      backgroundColor: theme.card,
    },
    gridItemText: {
      fontFamily: currentLanguage === 'dzo' ? DZONGKHA_FONT_FAMILY : undefined,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
  });
};

export default SearchScreen;
