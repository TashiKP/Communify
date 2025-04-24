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

// --- Import Context Hooks ---
import { useGrid, GridLayoutType } from '../context/GridContext'; // Adjust path if needed
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path if needed

// --- Configuration ---
const DEBOUNCE_DELAY = 400;
const MAX_RESULTS = 40;
const screenWidth = Dimensions.get('window').width;
const errorColor = '#dc3545'; // Keep distinct or add to theme

// --- Grid Calculation Logic (remains the same) ---
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
    language: string;
    onSelectSymbol: (symbol: { keyword: string; pictogramUrl: string }) => void;
}

// --- Component ---
const SearchScreen: React.FC<SearchScreenProps> = ({
    onCloseSearch,
    language,
    onSelectSymbol,
}) => {
    // --- Context ---
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance(); // Use appearance context

    // --- Calculate dynamic values based on context ---
    const numGridColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numGridColumns), [gridLayout, numGridColumns]);

    // --- State & Refs ---
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [results, setResults] = useState<SymbolResult[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false); // Separate state for search loading
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textInputRef = useRef<TextInput>(null);

    // --- Combined Loading State ---
    const isLoading = isLoadingGridLayout || isLoadingAppearance; // Loading context data

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Debounce Effect (remains the same) ---
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            const trimmedText = searchText.trim();
            if (trimmedText.length > 1) {
                setDebouncedSearchText(trimmedText);
            } else {
                setDebouncedSearchText('');
                setResults([]); setError(null);
            }
        }, DEBOUNCE_DELAY);
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [searchText]);

    // --- API Fetch Effect (remains the same) ---
    useEffect(() => {
        if (!debouncedSearchText) {
            setResults([]); setError(null); setIsLoadingSearch(false); // Reset search loading
            return;
        }
        const fetchSymbols = async () => {
            setIsLoadingSearch(true); setError(null); setResults([]); // Start search loading
            const searchUrl = `https://api.arasaac.org/api/pictograms/${language}/search/${encodeURIComponent(debouncedSearchText)}`;
            try {
                const response = await axios.get<ArasaacSearchResult[]>(searchUrl);
                if (response.data?.length > 0) {
                    const processedResults = response.data.slice(0, MAX_RESULTS).map(item => ({
                        id: String(item._id),
                        keyword: item.keywords.find(k => k.keyword)?.keyword || 'Symbol',
                        pictogramUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
                    }));
                    setResults(processedResults);
                } else {
                    setResults([]);
                 }
            } catch (err: any) {
                console.error("Search API Error:", err);
                setError('Failed to load symbols. Check connection or try again.');
                setResults([]);
            } finally {
                setIsLoadingSearch(false); // End search loading
            }
        };
        fetchSymbols();
    }, [debouncedSearchText, language]);

    // --- Handlers (remain the same) ---
    const handleTextChange = (text: string) => setSearchText(text);
    const handleSelectResult = (symbol: SymbolResult) => { Keyboard.dismiss(); onSelectSymbol({ keyword: symbol.keyword, pictogramUrl: symbol.pictogramUrl }); onCloseSearch(); };
    const handleCancel = () => { Keyboard.dismiss(); onCloseSearch(); };

    // --- Auto-focus Effect ---
    useEffect(() => {
        let focusTimer: NodeJS.Timeout | null = null;
        if (!isLoading) { // Only focus after initial context loading is done
             focusTimer = setTimeout(() => {
                textInputRef.current?.focus();
            }, 150);
        }
        return () => { if (focusTimer) clearTimeout(focusTimer); };
    }, [isLoading]); // Depend on combined loading state

    // --- Render Grid Item ---
    const renderGridItem = useCallback(({ item }: { item: SymbolResult }) => {
         // Adjust internal font size based on itemWidth and theme fonts
        const dynamicFontSize = Math.max(fonts.caption * 0.9, Math.min(fonts.body, Math.floor(itemWidth * 0.11)));

        return (
            <View style={styles.gridItemContainer}>
                <TouchableOpacity
                    style={[styles.gridItemCard, { width: itemWidth }]} // Apply dynamic width
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Symbol ${item.keyword}, select`}
                    accessibilityRole="button"
                >
                    <View style={styles.gridItemImageWrapper}>
                        <Image
                            source={{ uri: item.pictogramUrl }}
                            style={styles.gridItemImage}
                            resizeMode="contain"
                            onError={() => console.warn(`Failed to load image for ${item.keyword}`)}
                            // Optional: Add placeholder or indicator
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
    }, [itemWidth, fonts, handleSelectResult, styles]); // Depend on styles as well now
    // ---------------------------------

    // --- Render Content Based on State ---
    const renderContent = () => {
        // Show initial loading if context is loading
        if (isLoading) {
             return <ActivityIndicator style={styles.statusIndicator} size="large" color={theme.primary} />;
        }
        // Show search loading indicator only when actively searching
        if (isLoadingSearch) {
            return <ActivityIndicator style={styles.statusIndicator} size="large" color={theme.primary} />;
        }
        if (error) { return <Text style={styles.statusTextError}>{error}</Text>; }
        if (debouncedSearchText.length <= 1 && searchText.length > 0) { return <Text style={styles.statusText}>Enter 2+ characters.</Text>; }
        if (debouncedSearchText.length > 1 && results.length === 0) { return <Text style={styles.statusText}>No symbols found for "{debouncedSearchText}".</Text>; }
        if (searchText.length === 0) { return <Text style={styles.statusText}>Search for ARASAAC symbols.</Text>; }

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
                extraData={`${itemWidth}-${numGridColumns}-${results.length}`} // Include results length
            />
        );
    };

    // --- Main Render ---
    return (
         <Modal
             visible={true} // Assume parent controls visibility
             animationType="slide"
             onRequestClose={handleCancel}
         >
            {/* Use themed Safe Area */}
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.inputContainer}>
                            {/* Use themed icon color */}
                            <FontAwesomeIcon icon={faSearch} size={fonts.body} color={theme.disabled} style={styles.inputIcon} />
                            <TextInput
                                ref={textInputRef}
                                style={styles.input}
                                placeholder="Search ARASAAC symbols..."
                                placeholderTextColor={theme.disabled} // Themed placeholder
                                value={searchText}
                                onChangeText={handleTextChange}
                                returnKeyType="search"
                                selectionColor={theme.primary} // Themed selection
                                clearButtonMode="while-editing" // iOS only
                                autoCorrect={false}
                                autoCapitalize="none"
                                onSubmitEditing={Keyboard.dismiss} // Dismiss on submit
                                keyboardAppearance={theme.isDark ? 'dark' : 'light'} // Themed keyboard
                            />
                             {/* Custom clear button */}
                             {searchText.length > 0 && ( // Show only when text exists
                                 <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton} accessibilityLabel="Clear search text">
                                     <FontAwesomeIcon icon={faTimesCircle} size={fonts.body} color={theme.disabled} />
                                 </TouchableOpacity>
                             )}
                        </View>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} accessibilityLabel="Cancel search">
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <View style={styles.contentArea}>
                        {renderContent()}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background, // Theme background for safe area
    },
    container: {
        flex: 1,
        // Background color inherited from safeArea
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card, // Use card color for header background
        paddingHorizontal: 10,
        paddingVertical: 8,
        paddingTop: Platform.OS === 'ios' ? 12 : 8, // Adjust padding top
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border, // Use theme border color
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background, // Use main background for input field container
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: fonts.body, // Use theme font size
        color: theme.text, // Use theme text color
        paddingVertical: 0, // Reset default padding
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    cancelButton: {
        paddingLeft: 12,
        paddingVertical: 8,
    },
    cancelButtonText: {
        fontSize: fonts.button, // Use theme font size
        color: theme.primary, // Use theme primary color
        fontWeight: '500',
    },
    // Content Area Styles
    contentArea: {
        flex: 1,
        backgroundColor: theme.background, // Ensure content area uses theme background
    },
    statusIndicator: {
        marginTop: 40,
    },
    statusText: {
        marginTop: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontSize: fonts.body, // Use theme font size
        color: theme.textSecondary, // Use theme secondary text color
        lineHeight: fonts.body * 1.5, // Dynamic line height
    },
    statusTextError: {
        marginTop: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontSize: fonts.body, // Use theme font size
        color: errorColor, // Keep distinct error color
    },
    // Grid Styles
    resultsList: {
        flex: 1,
    },
     resultsListContent: {
         paddingHorizontal: 10,
         paddingTop: 10,
         paddingBottom: 20,
         alignItems: 'flex-start',
     },
    gridItemContainer: {
        margin: 4,
    },
    gridItemCard: {
        // width applied inline dynamically
        aspectRatio: 1,
        backgroundColor: theme.card, // Use theme card color
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border, // Use theme border color
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.isDark ? 0.2 : 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    gridItemImageWrapper: {
        flex: 1,
        width: '100%',
        padding: '10%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background, // Use theme background for image area
    },
    gridItemImage: {
        width: '100%',
        height: '100%',
    },
    gridItemTextWrapper: {
        height: 28,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border, // Use theme border color
        backgroundColor: theme.card, // Ensure text area matches card bg
    },
    gridItemText: {
        // fontSize applied dynamically
        fontWeight: '500',
        color: theme.text, // Use theme text color
        textAlign: 'center',
    },
});

export default SearchScreen;