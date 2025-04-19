import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    SafeAreaView, // Use SafeAreaView at the top level
    Image,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    FlatList,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faPlus, faArrowLeft, faImage, faCheck, faPen, faTrash,
    faThLarge // Using faThLarge for empty state icon
} from '@fortawesome/free-solid-svg-icons';
import {
    launchImageLibrary,
    ImageLibraryOptions,
    Asset,
    ImagePickerResponse,
} from 'react-native-image-picker';

// --- Component Props Interface ---
interface CustomPageComponentProps {
    onBackPress: () => void;
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void;
}

// --- Symbol Data Structure ---
interface SymbolItem {
    id: string;
    name: string;
    imageUri?: string;
}

// --- Main Component ---
const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    // --- State --- (Remains the same)
    const [symbols, setSymbols] = useState<SymbolItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);
    const [modalSymbolName, setModalSymbolName] = useState('');
    const [modalImageUri, setModalImageUri] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // --- Effects --- (Remain the same - Load/Save Logic)
    // TODO: Load symbols from persistent storage
    useEffect(() => {
        if (onSymbolsUpdate) {
            onSymbolsUpdate(symbols);
        }
        // TODO: Save symbols to persistent storage
    }, [symbols, onSymbolsUpdate]);

    // --- Modal Handling --- (Remains the same)
    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => {
        setModalMode(mode);
        if (mode === 'edit' && symbol) {
            setEditingSymbol(symbol);
            setModalSymbolName(symbol.name);
            setModalImageUri(symbol.imageUri);
        } else {
            setEditingSymbol(null);
            setModalSymbolName('');
            setModalImageUri(undefined);
        }
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            setEditingSymbol(null);
            setModalSymbolName('');
            setModalImageUri(undefined);
            setIsLoading(false);
        }, 300);
    };

    // --- Image Picker --- (Remains the same)
    const pickImage = () => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Error', response.errorMessage || 'Could not select image.'); return; }
            if (response.assets?.[0]?.uri) setModalImageUri(response.assets[0].uri);
        });
    };

    // --- CRUD Operations --- (Remain the same)
    const handleSaveSymbol = () => {
        const name = modalSymbolName.trim();
        if (!name) { Alert.alert('Validation Error', 'Please enter a name.'); return; }
        setIsLoading(true);
        setTimeout(() => {
            if (modalMode === 'edit' && editingSymbol) {
                setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, name, imageUri: modalImageUri } : s));
            } else {
                const newSymbol: SymbolItem = { id: `custom_${Date.now()}`, name, imageUri: modalImageUri };
                setSymbols(prev => [newSymbol, ...prev]);
            }
            setIsLoading(false); closeModal();
        }, 500);
    };

    const handleDeletePress = (symbol: SymbolItem) => {
        Alert.alert('Confirm Deletion', `Delete "${symbol.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(symbol.id) },
        ]);
    };

    const confirmDelete = (symbolId: string) => {
        setIsDeleting(symbolId);
        setTimeout(() => {
            setSymbols(prev => prev.filter(s => s.id !== symbolId));
            setIsDeleting(null);
        }, 500);
    };


    // --- Render Symbol Item --- (Remains mostly the same, styles adjusted)
    const renderItem = ({ item }: { item: SymbolItem }) => (
        // Container adjusts spacing based on numColumns and grid padding
        <View style={styles.symbolItemContainer}>
            <View style={styles.symbolCard} accessibilityLabel={`Custom symbol: ${item.name}`}>
                <View style={styles.symbolImageWrapper}>
                    {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.symbolImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.symbolPlaceholder}>
                            <FontAwesomeIcon icon={faImage} size={40} color="#ced4da" />
                        </View>
                    )}
                </View>
                <View style={styles.symbolInfo}>
                    <Text style={styles.symbolName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                    <View style={styles.symbolActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => openModal('edit', item)} disabled={!!isDeleting} >
                            <FontAwesomeIcon icon={faPen} size={14} color="#0077b6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePress(item)} disabled={!!isDeleting} >
                            {isDeleting === item.id ? <ActivityIndicator size="small" color="#dc3545" /> : <FontAwesomeIcon icon={faTrash} size={14} color="#dc3545" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    // --- Main Render ---
    return (
        // Use SafeAreaView for the entire screen
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar (remains the same) */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} style={styles.headerButton} hitSlop={styles.hitSlop}>
                        <FontAwesomeIcon icon={faArrowLeft} size={18} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Symbols</Text>
                    <TouchableOpacity onPress={() => openModal('add')} style={styles.headerButton} hitSlop={styles.hitSlop}>
                        <FontAwesomeIcon icon={faPlus} size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Content Area - FlatList now takes the full space */}
                <FlatList
                    data={symbols}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    // *** INCREASE numColumns for full screen ***
                    numColumns={7} // Adjust this based on screen width & symbolItem size
                    contentContainerStyle={styles.gridContainer}
                    ListEmptyComponent={ // Empty state remains the same
                        <View style={styles.emptyContainer}>
                            <FontAwesomeIcon icon={faThLarge} size={50} color="#adb5bd" />
                            <Text style={styles.emptyText}>No Custom Symbols Yet</Text>
                            <Text style={styles.emptySubText}>Tap the '+' button above to add your first symbol.</Text>
                        </View>
                    }
                />

                {/* Add/Edit Symbol Modal (remains the same functionally) */}
                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback accessible={false}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitleText}>{modalMode === 'add' ? 'Add New Symbol' : 'Edit Symbol'}</Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} hitSlop={styles.hitSlop}>
                                            <FontAwesomeIcon icon={faTimes} size={18} color="#6c757d" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView contentContainerStyle={styles.modalBody}>
                                        <Text style={styles.modalLabel}>Image (Optional)</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage} activeOpacity={0.7}>
                                            {modalImageUri ? (<Image source={{ uri: modalImageUri }} style={styles.modalPickedImage} resizeMode="contain"/>)
                                            : (<View style={styles.modalImagePlaceholder}><FontAwesomeIcon icon={faImage} size={40} color="#adb5bd"/><Text style={styles.modalImagePickerText}>Choose Image</Text></View>)}
                                        </TouchableOpacity>
                                        <Text style={styles.modalLabel}>Symbol Name *</Text>
                                        <TextInput placeholder="Enter symbol name" value={modalSymbolName} onChangeText={setModalSymbolName} style={styles.modalInput} placeholderTextColor="#adb5bd" maxLength={40} returnKeyType="done" />
                                        <TouchableOpacity style={[styles.modalSaveButton, (!modalSymbolName.trim() || isLoading) && styles.modalButtonDisabled]} onPress={handleSaveSymbol} disabled={!modalSymbolName.trim() || isLoading}>
                                            {isLoading ? <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} /> : <FontAwesomeIcon icon={faCheck} size={16} color="#ffffff" style={styles.buttonIcon}/>}
                                            <Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add Symbol' : 'Save Changes'}</Text>
                                        </TouchableOpacity>
                                        {modalImageUri && modalMode === 'edit' && (
                                            <TouchableOpacity style={[styles.modalRemoveImageButton]} onPress={() => setModalImageUri(undefined)} disabled={isLoading}>
                                                <FontAwesomeIcon icon={faTrash} size={14} color="#dc3545" style={styles.buttonIcon}/>
                                                <Text style={styles.modalRemoveImageButtonText}>Remove Image</Text>
                                            </TouchableOpacity>
                                        )}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        </SafeAreaView>
    );
};


// --- Styles --- (Adjusted for Full Screen)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0077b6', // Match header color for safe area background
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Light background for the main content area below header
    },
    // Header Bar (mostly unchanged)
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0077b6',
        height: Platform.OS === 'ios' ? 55 : 50,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    headerButton: {
        padding: 10,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Grid Area (Full Width)
    gridContainer: {
        paddingVertical: 15, // Vertical padding for the grid
        paddingHorizontal: 10, // Horizontal padding for the grid
    },
    symbolItemContainer: {
        // Width calculation needs to account for numColumns and grid padding/item margin
        // Example for 7 columns with 10 padding & 4 margin per item:
        // width = (screenWidth - gridPadding*2 - itemMargin*2*numCols) / numCols
         padding: 4, // Spacing *around* each card
         // Let FlatList's numColumns determine width distribution
    },
    symbolCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
        aspectRatio: 1, // Keep cards square
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'column',
        // Width is determined by FlatList numColumns and container padding
    },
    symbolImageWrapper: {
        flex: 3,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    symbolImage: {
        width: '100%',
        height: '100%',
    },
    symbolPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    symbolInfo: {
        flex: 2,
        paddingHorizontal: 6, // Reduced horizontal padding slightly
        paddingVertical: 4, // Reduced vertical padding slightly
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        justifyContent: 'space-between',
    },
    symbolName: {
        fontSize: 12, // Slightly smaller font for denser grid
        fontWeight: '500',
        color: '#343a40',
        textAlign: 'center',
        marginBottom: 2,
    },
    symbolActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 2, // Add tiny space above actions
    },
    actionButton: {
        padding: 4, // Adjust tap area if needed
    },
    // Empty State (Unchanged)
    emptyContainer: {
        flex: 1, // Should take up space if list is empty
        minHeight: Dimensions.get('window').height * 0.6, // Ensure it has height
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        fontSize: 18, fontWeight: '600', color: '#6c757d', marginTop: 15, textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14, color: '#adb5bd', marginTop: 8, textAlign: 'center',
    },
    // Modal Styles (Unchanged)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 15 },
    modalContent: { width: '100%', maxWidth: 400, maxHeight: '85%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef', position: 'relative' },
    modalTitleText: { fontSize: 18, fontWeight: 'bold', color: '#343a40' },
    modalCloseButton: { position: 'absolute', right: 10, top: 10, padding: 8 },
    modalBody: { padding: 20 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: '#495057', marginBottom: 6, marginTop: 12 },
    modalImagePicker: { width: '100%', aspectRatio: 1.5, backgroundColor: '#f8f9fa', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1.5, borderColor: '#dee2e6', borderStyle: 'dashed', overflow: 'hidden' },
    modalPickedImage: { width: '100%', height: '100%' },
    modalImagePlaceholder: { alignItems: 'center' },
    modalImagePickerText: { color: '#6c757d', fontWeight: '500', marginTop: 8, fontSize: 14 },
    modalInput: { backgroundColor: 'white', height: 48, borderColor: '#ced4da', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 15, fontSize: 16, color: '#343a40' },
    modalSaveButton: { backgroundColor: '#0077b6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    modalRemoveImageButton: { backgroundColor: '#f8f9fa', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 15, borderWidth: 1, borderColor: '#dc3545' },
    modalRemoveImageButtonText: { color: '#dc3545', fontWeight: '600', fontSize: 14 },
    modalButtonDisabled: { backgroundColor: '#adb5bd', opacity: 0.7 },
    buttonIcon: { marginRight: 8 },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }
});

export default CustomPageComponent;