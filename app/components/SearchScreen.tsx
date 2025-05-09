// src/components/SearchScreen.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faTimesCircle, faImage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Context Hooks ---
import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';

// --- Configuration ---
const DEBOUNCE_DELAY = 400;
const MAX_RESULTS = 40;
const screenWidth = Dimensions.get('window').width;
const errorColor = '#dc3545'; // Consider adding to theme

// --- Grid Calculation Logic ---
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 6;
        case 'standard': return 8;
        case 'dense': return 10;
        default: return 8;
    }
};
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const gridPadding = 10;
    const itemMargin = 4;
    const totalMargins = itemMargin * 2 * numCols;
    const totalPadding = gridPadding * 2;
    const availableWidth = screenWidth - totalPadding - totalMargins;
    return Math.max(70, Math.floor(availableWidth / numCols));
};
// --- End Grid Calculation ---

// --- Result Interfaces ---
interface ArasaacSearchResult {
    _id: number;
    keywords: { keyword: string }[];
}
interface SymbolResult {
    id: string;
    keyword: string;
    pictogramUrl: string;
}

// --- Component Props ---
interface SearchScreenProps {
    onCloseSearch: () => void;
    language: string; // Language for Arasaac API (e.g., 'en')
    onSelectSymbol: (symbol: { keyword: string; pictogramUrl: string }) => void;
}

// --- Component ---
const SearchScreen: React.FC<SearchScreenProps> = ({
    onCloseSearch,
    language, // This is the language passed to Arasaac API
    onSelectSymbol,
}) => {
    // --- Hooks ---
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t } = useTranslation(); // <-- Use the translation hook

    // --- Calculate dynamic values based on context ---
    const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

    // --- State & Refs ---
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [results, setResults] = useState<SymbolResult[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textInputRef = useRef<TextInput>(null);
    const isMountedRef = useRef(true);


    // --- Combined Loading State ---
    const isLoadingInitialContext = isLoadingGridLayout || isLoadingAppearance;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // --- Debounce Effect ---
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            const trimmedText = searchText.trim();
            if (trimmedText.length > 1) {
                if(isMountedRef.current) setDebouncedSearchText(trimmedText);
            } else {
                if(isMountedRef.current) {
                    setDebouncedSearchText('');
                    setResults([]); setError(null);
                }
            }
        }, DEBOUNCE_DELAY);
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [searchText]);

    // --- API Fetch Effect ---
    useEffect(() => {
        if (!debouncedSearchText) {
            if(isMountedRef.current) {
                setResults([]); setError(null); setIsLoadingSearch(false);
            }
            return;
        }
        const fetchSymbols = async () => {
            if(!isMountedRef.current) return;
            setIsLoadingSearch(true); setError(null); setResults([]);
            // 'language' prop is used for Arasaac API call
            const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(debouncedSearchText)}`;
            try {
                const response = await axios.get<ArasaacSearchResult[]>(searchUrl);
                if (isMountedRef.current) {
                    if (response.data?.length > 0) {
                        const processedResults = response.data.slice(0, MAX_RESULTS).map(item => ({
                            id: String(item._id),
                            keyword: item.keywords.find(k => k.keyword)?.keyword || t('searchScreen.defaultSymbolKeyword'), // Default keyword
                            pictogramUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
                        }));
                        setResults(processedResults);
                    } else {
                        setResults([]);
                     }
                }
            } catch (err: any) {
                console.error("Search API Error:", err);
                if (isMountedRef.current) {
                    setError(t('searchScreen.errors.loadFail')); // Use t()
                    setResults([]);
                }
            } finally {
                if (isMountedRef.current) setIsLoadingSearch(false);
            }
        };
        fetchSymbols();
    }, [debouncedSearchText, language, t]); // Add t to dependencies

    // --- Handlers ---
    const handleTextChange = (text: string) => setSearchText(text);
    const handleSelectResult = (symbol: SymbolResult) => { Keyboard.dismiss(); onSelectSymbol({ keyword: symbol.keyword, pictogramUrl: symbol.pictogramUrl }); onCloseSearch(); };
    const handleCancel = () => { Keyboard.dismiss(); onCloseSearch(); };

    // --- Auto-focus Effect ---
    useEffect(() => {
        let focusTimer: NodeJS.Timeout | null = null;
        if (!isLoadingInitialContext) {
             focusTimer = setTimeout(() => {
                textInputRef.current?.focus();
            }, 150);
        }
        return () => { if (focusTimer) clearTimeout(focusTimer); };
    }, [isLoadingInitialContext]);

    // --- Render Grid Item ---
    const renderGridItem = useCallback(({ item }: { item: SymbolResult }) => {
        const dynamicFontSize = Math.max(fonts.caption * 0.9, Math.min(fonts.body, Math.floor(itemWidth * 0.11)));
        return (
            <View style={styles.gridItemContainer}>
                <TouchableOpacity
                    style={[styles.gridItemCard, { width: itemWidth }]}
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.7}
                    accessibilityLabel={t('searchScreen.symbolAccessibilityLabel', { keyword: item.keyword })} // Use t()
                    accessibilityRole="button"
                >
                    <View style={styles.gridItemImageWrapper}>
                        <Image
                            source={{ uri: item.pictogramUrl }}
                            style={styles.gridItemImage}
                            resizeMode="contain"
                            onError={() => console.warn(`Failed to load image for ${item.keyword}`)}
                        />
                    </View>
                    <View style={styles.gridItemTextWrapper}>
                        <Text style={[styles.gridItemText, { fontSize: dynamicFontSize }]} numberOfLines={1} ellipsizeMode="tail">
                            {item.keyword}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }, [itemWidth, fonts, handleSelectResult, styles, t]); // Add t and styles

    // --- Render Content Based on State ---
    const renderContent = () => {
        if (isLoadingInitialContext) {
             return <ActivityIndicator style={styles.statusIndicator} size="large" color={theme.primary} />;
        }
        if (isLoadingSearch) {
            return <ActivityIndicator style={styles.statusIndicator} size="large" color={theme.primary} />;
        }
        if (error) { return <Text style={styles.statusTextError}>{error}</Text>; } // Error is already translated
        if (debouncedSearchText.length <= 1 && searchText.length > 0) { return <Text style={styles.statusText}>{t('searchScreen.statusEnterMoreChars')}</Text>; }
        if (debouncedSearchText.length > 1 && results.length === 0) { return <Text style={styles.statusText}>{t('searchScreen.statusNoResults', { query: debouncedSearchText })}</Text>; }
        if (searchText.length === 0) { return <Text style={styles.statusText}>{t('searchScreen.statusInitial')}</Text>; }

        return (
            <FlatList
                data={results}
                renderItem={renderGridItem}
                keyExtractor={(item) => `${item.id}-${gridLayout}`}
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
                extraData={`${itemWidth}-${numGridColumns}-${results.length}`}
            />
        );
    };

    return (
         <Modal
             visible={true}
             animationType="slide"
             onRequestClose={handleCancel}
         >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.inputContainer}>
                            <FontAwesomeIcon icon={faSearch} size={fonts.body} color={theme.disabled} style={styles.inputIcon} />
                            <TextInput
                                ref={textInputRef}
                                style={styles.input}
                                placeholder={t('searchScreen.placeholder')}
                                placeholderTextColor={theme.disabled}
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
                                 <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton} accessibilityLabel={t('searchScreen.clearSearchAccessibilityLabel')}>
                                     <FontAwesomeIcon icon={faTimesCircle} size={fonts.body} color={theme.disabled} />
                                 </TouchableOpacity>
                             )}
                        </View>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} accessibilityLabel={t('common.cancel')}>
                            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentArea}>
                        {renderContent()}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// --- Styles (Unchanged) ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background, },
    container: { flex: 1, },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 8, paddingTop: Platform.OS === 'ios' ? 12 : 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, },
    inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 10, paddingHorizontal: 10, height: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, },
    inputIcon: { marginRight: 8, },
    input: { flex: 1, fontSize: fonts.body, color: theme.text, paddingVertical: 0, },
    clearButton: { padding: 4, marginLeft: 4, },
    cancelButton: { paddingLeft: 12, paddingVertical: 8, },
    cancelButtonText: { fontSize: fonts.button, color: theme.primary, fontWeight: '500', },
    contentArea: { flex: 1, backgroundColor: theme.background, },
    statusIndicator: { marginTop: 40, },
    statusText: { marginTop: 40, textAlign: 'center', paddingHorizontal: 20, fontSize: fonts.body, color: theme.textSecondary, lineHeight: fonts.body * 1.5, },
    statusTextError: { marginTop: 40, textAlign: 'center', paddingHorizontal: 20, fontSize: fonts.body, color: errorColor, },
    resultsList: { flex: 1, },
    resultsListContent: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 20, alignItems: 'flex-start', },
    gridItemContainer: { margin: 4, },
    gridItemCard: { aspectRatio: 1, backgroundColor: theme.card, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: theme.isDark ? 0.2 : 0.08, shadowRadius: 2, elevation: 2, },
    gridItemImageWrapper: { flex: 1, width: '100%', padding: '10%', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, },
    gridItemImage: { width: '100%', height: '100%', },
    gridItemTextWrapper: { height: 28, width: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, backgroundColor: theme.card, },
    gridItemText: { fontWeight: '500', color: theme.text, textAlign: 'center', },
});

export default SearchScreen;