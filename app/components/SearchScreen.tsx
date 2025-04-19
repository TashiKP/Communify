import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Dimensions,
    Modal, // Import Dimensions
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faTimesCircle, faImage } from '@fortawesome/free-solid-svg-icons'; // Use faTimesCircle for input clear maybe
import axios from 'axios';

// --- Configuration ---
const DEBOUNCE_DELAY = 400;
const MAX_RESULTS = 15; // Show more results in full screen

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
interface SearchScreenProps { // Renamed props for clarity
    // visible: boolean; // Visibility now controlled by parent rendering/navigation
    onCloseSearch: () => void; // Function to close/dismiss this screen
    language: string;
    onSelectSymbol: (symbol: { keyword: string; pictogramUrl: string }) => void;
}

// --- Component ---
const SearchScreen: React.FC<SearchScreenProps> = ({ // Renamed component
    onCloseSearch,
    language,
    onSelectSymbol,
}) => {
    const [searchText, setSearchText] = useState('');
    const [debouncedSearchText, setDebouncedSearchText] = useState('');
    const [results, setResults] = useState<SymbolResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textInputRef = useRef<TextInput>(null); // Ref for focusing

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
                } else { setResults([]); }
            } catch (err: any) {
                setError('Failed to load symbols.'); setResults([]);
            } finally { setIsLoading(false); }
        };
        fetchSymbols();
    }, [debouncedSearchText, language]);

    // --- Handlers ---
    const handleTextChange = (text: string) => setSearchText(text);
    const handleSelectResult = (symbol: SymbolResult) => {
        Keyboard.dismiss();
        onSelectSymbol({ keyword: symbol.keyword, pictogramUrl: symbol.pictogramUrl });
        onCloseSearch(); // Close search after selection
    };
    const handleCancel = () => {
        Keyboard.dismiss();
        onCloseSearch(); // Call parent's close function
    };

    // Auto-focus on mount
    useEffect(() => {
        setTimeout(() => textInputRef.current?.focus(), 100); // Slight delay can help
    }, []);

    // --- Render Result Item ---
    const renderResultItem = ({ item }: { item: SymbolResult }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectResult(item)}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.pictogramUrl }} style={styles.resultImage} resizeMode="contain" />
            <Text style={styles.resultText}>{item.keyword}</Text>
        </TouchableOpacity>
    );

    // --- Render Content Based on State ---
    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator style={styles.statusIndicator} size="large" color="#0077b6" />;
        }
        if (error) {
            return <Text style={styles.statusTextError}>{error}</Text>;
        }
        if (debouncedSearchText.length <= 1) {
             return <Text style={styles.statusText}>Enter 2 or more characters to search.</Text>;
        }
        if (results.length === 0) {
            return <Text style={styles.statusText}>No symbols found for "{debouncedSearchText}".</Text>;
        }
        return (
            <FlatList
                data={results}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                contentContainerStyle={styles.resultsListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        );
    };

    // --- Main Render ---
    return (
        // Use Modal to present this full-screen component if not using navigation
         <Modal
             visible={true} // Assuming parent controls visibility by rendering/unrendering this
             animationType="slide" // Slide up animation
             onRequestClose={handleCancel}
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
                                autoFocus={true} // Auto-focus here
                                selectionColor={'#0077b6'}
                                clearButtonMode="while-editing"
                                autoCorrect={false} // Disable auto-correct for keywords
                                autoCapitalize="none" // Don't capitalize keywords
                            />
                             {/* Optional custom clear button if needed for Android */}
                             {searchText.length > 0 && (
                                 <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                                     <FontAwesomeIcon icon={faTimesCircle} size={18} color="#adb5bd" />
                                 </TouchableOpacity>
                             )}
                        </View>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area (Results, Loading, Status) */}
                    <View style={styles.contentArea}>
                        {renderContent()}
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// --- Styles --- (Full Screen Redesign)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff', // White background for the whole screen
    },
    container: {
        flex: 1,
    },
    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa', // Light background for header
        paddingHorizontal: 10,
        paddingVertical: 8,
        paddingTop: Platform.OS === 'ios' ? 12 : 8, // Adjust top padding
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6', // Light border
    },
    inputContainer: {
        flex: 1, // Input takes most space
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9ecef', // Slightly darker background for input field area
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40, // Defined height for input container
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#212529', // Dark text
        paddingVertical: 0, // Remove extra padding
    },
    clearButton: {
         padding: 4,
         marginLeft: 4,
    },
    cancelButton: {
        paddingLeft: 12, // Space from input
        paddingVertical: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#0077b6', // Theme color for cancel
        fontWeight: '500',
    },
    // Content Area Styles
    contentArea: {
        flex: 1, // Takes remaining screen space
        // backgroundColor: '#ffffff', // White background
    },
    statusIndicator: {
        marginTop: 40,
    },
    statusText: {
        marginTop: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#6c757d', // Grey text for status
        lineHeight: 24,
    },
    statusTextError: {
        marginTop: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#dc3545', // Red for errors
    },
    // Results List Styles
    resultsList: {
        flex: 1, // Ensure list takes space
    },
     resultsListContent: {
         paddingTop: 5,
         paddingBottom: 20, // Space at the bottom
     },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5', // Very light separator
    },
    resultImage: {
        width: 45, // Consistent image size
        height: 45,
        resizeMode: 'contain',
        marginRight: 15, // More space next to image
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    resultText: {
        flex: 1,
        fontSize: 16, // Larger result text
        color: '#343a40',
    },
});

export default SearchScreen; // Changed default export name