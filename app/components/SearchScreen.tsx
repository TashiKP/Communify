// src/Screens/SearchScreen.tsx OR components/SearchScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView, // Use SafeAreaView for full screen
    FlatList,
    Text,
    Image,
    ActivityIndicator,
    Keyboard,
    Platform,
    Dimensions, // <-- Import Dimensions
    Modal,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faTimesCircle, faImage } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useGrid, GridLayoutType } from '../context/GridContext'; // <-- Import Context

// --- Configuration ---
const DEBOUNCE_DELAY = 400;
const MAX_RESULTS = 40; // Increase results for denser layouts
const screenWidth = Dimensions.get('window').width;

// --- Grid Calculation Logic ---
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 6;
        case 'standard': return 8; // Using 6 for standard here
        case 'dense': return 10;
        default: return 8;
    }
};
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const gridPadding = 10; // Match resultsListContent paddingHorizontal
    const itemMargin = 4;   // Match gridItemContainer margin
    const totalMargins = itemMargin * 2 * numCols;
    const totalPadding = gridPadding * 2;
    const availableWidth = screenWidth - totalPadding - totalMargins;
    return Math.max(70, Math.floor(availableWidth / numCols)); // Adjust min size if needed
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
    onCloseSearch: () => void; // Function to close/dismiss this screen
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
    const { gridLayout, isLoadingLayout } = useGrid(); // Get layout preference
    // ---------------

    // --- Calculate dynamic values based on context ---
    const numGridColumns = getNumColumns(gridLayout);
    const itemWidth = calculateItemWidth(gridLayout, numGridColumns);
    // -----------------------------------------------

    // --- State & Refs ---
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [results, setResults] = useState<SymbolResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textInputRef = useRef<TextInput>(null);

    // --- Debounce Effect ---
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

    // --- API Fetch Effect ---
    useEffect(() => {
        if (!debouncedSearchText) {
            setResults([]); setError(null); setIsLoading(false);
            return;
        }
        const fetchSymbols = async () => {
            setIsLoading(true); setError(null); setResults([]);
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
                setIsLoading(false);
            }
        };
        fetchSymbols();
    }, [debouncedSearchText, language]);

    // --- Handlers ---
    const handleTextChange = (text: string) => setSearchText(text);
    const handleSelectResult = (symbol: SymbolResult) => {
        Keyboard.dismiss();
        onSelectSymbol({ keyword: symbol.keyword, pictogramUrl: symbol.pictogramUrl });
        onCloseSearch();
    };
    const handleCancel = () => {
        Keyboard.dismiss();
        onCloseSearch();
    };

    // Auto-focus on mount
    useEffect(() => {
        const focusTimer = setTimeout(() => {
            textInputRef.current?.focus();
        }, 150); // Delay slightly for modal animation
        return () => clearTimeout(focusTimer);
    }, []);

    // --- Render Grid Item ---
    const renderGridItem = ({ item }: { item: SymbolResult }) => {
         // Adjust internal font size based on itemWidth
        const dynamicFontSize = Math.max(10, Math.min(13, Math.floor(itemWidth * 0.11)));

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
    };
    // ---------------------------------

    // --- Render Content Based on State ---
    const renderContent = () => {
        // Show loading indicator if context layout is still loading OR search is loading
        if (isLoadingLayout || isLoading) {
            return <ActivityIndicator style={styles.statusIndicator} size="large" color="#0077b6" />;
        }
        if (error) { return <Text style={styles.statusTextError}>{error}</Text>; }
        if (debouncedSearchText.length <= 1 && searchText.length > 0) { return <Text style={styles.statusText}>Enter 2+ characters.</Text>; }
        if (debouncedSearchText.length > 1 && results.length === 0) { return <Text style={styles.statusText}>No symbols found for "{debouncedSearchText}".</Text>; }
        if (searchText.length === 0) { return <Text style={styles.statusText}>Search for ARASAAC symbols.</Text>; }

        // --- Render Grid ---
        return (
            <FlatList
                data={results}
                renderItem={renderGridItem} // Use grid item renderer
                keyExtractor={(item) => `${item.id}-${gridLayout}`} // Include layout in key
                numColumns={numGridColumns} // Use dynamic columns
                key={numGridColumns.toString()} // Force remount on column change
                style={styles.resultsList}
                contentContainerStyle={styles.resultsListContent} // Grid padding
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={numGridColumns * 4} // Adjust based on columns
                maxToRenderPerBatch={numGridColumns * 3} // Adjust based on columns
                windowSize={10} // Default or adjust
                removeClippedSubviews={true} // Can help performance
                extraData={itemWidth} // Re-render if item width changes
            />
        );
        // --------------------------
    };

    // --- Main Render ---
    return (
         <Modal
             visible={true} // Controlled by parent rendering this component
             animationType="slide"
             onRequestClose={handleCancel} // Handle Android back button
         >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.inputContainer}>
                            <FontAwesomeIcon icon={faSearch} size={18} color="#adb5bd" style={styles.inputIcon} />
                            <TextInput
                                ref={textInputRef}
                                style={styles.input}
                                placeholder="Search ARASAAC symbols..."
                                placeholderTextColor="#adb5bd"
                                value={searchText}
                                onChangeText={handleTextChange}
                                returnKeyType="search"
                                // autoFocus={true} // Let useEffect handle focus after animation
                                selectionColor={'#0077b6'}
                                clearButtonMode="while-editing" // iOS clear button
                                autoCorrect={false}
                                autoCapitalize="none"
                                onSubmitEditing={Keyboard.dismiss} // Dismiss keyboard on search submit
                            />
                             {/* Custom clear button (especially for Android) */}
                             {searchText.length > 0 && Platform.OS !== 'ios' && (
                                 <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                                     <FontAwesomeIcon icon={faTimesCircle} size={18} color="#adb5bd" />
                                 </TouchableOpacity>
                             )}
                        </View>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
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

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#ffffff', },
    container: { flex: 1, },
    // Header Styles
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', paddingHorizontal: 10, paddingVertical: 8, paddingTop: Platform.OS === 'ios' ? 12 : 8, borderBottomWidth: 1, borderBottomColor: '#dee2e6', },
    inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9ecef', borderRadius: 10, paddingHorizontal: 10, height: 40, },
    inputIcon: { marginRight: 8, },
    input: { flex: 1, fontSize: 16, color: '#212529', paddingVertical: 0, },
    clearButton: { padding: 4, marginLeft: 4, },
    cancelButton: { paddingLeft: 12, paddingVertical: 8, },
    cancelButtonText: { fontSize: 16, color: '#0077b6', fontWeight: '500', },
    // Content Area Styles
    contentArea: { flex: 1, },
    statusIndicator: { marginTop: 40, },
    statusText: { marginTop: 40, textAlign: 'center', paddingHorizontal: 20, fontSize: 16, color: '#6c757d', lineHeight: 24, },
    statusTextError: { marginTop: 40, textAlign: 'center', paddingHorizontal: 20, fontSize: 16, color: '#dc3545', },
    // Grid Styles
    resultsList: { flex: 1, },
     resultsListContent: {
         paddingHorizontal: 10, // Grid container padding
         paddingTop: 10,
         paddingBottom: 20,
         alignItems: 'flex-start', // Align items to start
     },
    gridItemContainer: {
        margin: 4, // Margin around each grid item
    },
    gridItemCard: {
        // width applied inline dynamically
        aspectRatio: 1, // Make items square
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'space-between', // Pushes text to bottom
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    gridItemImageWrapper: {
        flex: 1, // Take most space
        width: '100%',
        padding: '10%', // Padding inside the wrapper for image
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa', // Background for image area
    },
    gridItemImage: {
        width: '100%',
        height: '100%',
        // resizeMode applied inline
    },
    gridItemTextWrapper: {
        height: 28, // Fixed height for consistency
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderTopColor: '#f1f3f5', // Lighter border for text area
    },
    gridItemText: {
        // fontSize applied dynamically
        fontWeight: '500',
        color: '#343a40',
        textAlign: 'center',
    },
});

export default SearchScreen;