// src/components/CustomPageComponent.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Image, TextInput,
    Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform, ScrollView,
    Alert, FlatList // Ensure FlatList is imported
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faPlus, faArrowLeft, faImage, faCheck, faPen, faTrash,
    faThLarge, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
    launchImageLibrary,
    ImageLibraryOptions,
    Asset,
    ImagePickerResponse,
} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Storage Key ---
const STORAGE_KEY = '@Communify:customSymbols';

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
const NUM_COLUMNS = 5; // <--- ADJUST NUMBER OF COLUMNS (Try 4, 5, or 6)
const GRID_PADDING = 10; // Padding on the sides of the entire grid
const ITEM_MARGIN = 5;  // Margin around each individual item card

// Calculate item width dynamically
const itemWidth = (screenWidth - (GRID_PADDING * 2) - (ITEM_MARGIN * 2 * NUM_COLUMNS)) / NUM_COLUMNS;

// --- Component Props Interface ---
interface CustomPageComponentProps { /* ... as before ... */
    onBackPress: () => void;
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void;
}
// --- Symbol Data Structure ---
interface SymbolItem { /* ... as before ... */
    id: string;
    name: string;
    imageUri?: string;
}

// --- Main Component ---
const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    // --- State & Refs (Keep as before) ---
    const [symbols, setSymbols] = useState<SymbolItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);
    const [modalSymbolName, setModalSymbolName] = useState('');
    const [modalImageUri, setModalImageUri] = useState<string | undefined>(undefined);
    const [isSavingModal, setIsSavingModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);
    const initialLoadComplete = useRef(false);

    // --- Load/Save useEffects (Keep as before) ---
    useEffect(() => { /* ... Loading Logic ... */
        const loadSymbolsFromStorage = async () => {
            setIsLoadingStorage(true);
            initialLoadComplete.current = false;
            try {
                const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
                if (jsonValue !== null) {
                    const loadedSymbols: SymbolItem[] = JSON.parse(jsonValue);
                    if (Array.isArray(loadedSymbols)) {
                        setSymbols(loadedSymbols);
                        if (onSymbolsUpdate) onSymbolsUpdate(loadedSymbols);
                    } else { setSymbols([]); }
                } else { setSymbols([]); }
            } catch (e) { console.error('Failed load', e); Alert.alert('Load Error'); setSymbols([]); }
            finally { setIsLoadingStorage(false); requestAnimationFrame(() => { initialLoadComplete.current = true; }); }
        };
        loadSymbolsFromStorage();
     }, []);

    useEffect(() => { /* ... Saving Logic ... */
        if (!initialLoadComplete.current) return;
        const saveSymbolsToStorage = async () => {
            try {
                const jsonValue = JSON.stringify(symbols);
                await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
                if (onSymbolsUpdate) onSymbolsUpdate(symbols);
            } catch (e) { console.error('Failed save', e); Alert.alert('Save Error'); }
        };
        const timerId = setTimeout(() => { saveSymbolsToStorage(); }, 300);
        return () => clearTimeout(timerId);
     }, [symbols, onSymbolsUpdate]);

    // --- Modal Handling & Image Picker (Keep as before) ---
    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => { /* ... */ setModalMode(mode); if (mode === 'edit' && symbol) { setEditingSymbol(symbol); setModalSymbolName(symbol.name); setModalImageUri(symbol.imageUri); } else { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); } setIsModalVisible(true); };
    const closeModal = () => { /* ... */ setIsModalVisible(false); setTimeout(() => { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); setIsSavingModal(false); }, 300); };
    const pickImage = () => { /* ... */ const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 }; launchImageLibrary(options, (response: ImagePickerResponse) => { if (response.didCancel) return; if (response.errorCode) { Alert.alert('Error', response.errorMessage || 'Could not select image.'); return; } if (response.assets?.[0]?.uri) setModalImageUri(response.assets[0].uri); }); };

    // --- CRUD Operations (Keep as before) ---
    const handleSaveSymbol = () => { /* ... Update state logic ... */
        const name = modalSymbolName.trim(); if (!name) { Alert.alert('Validation Error', 'Please enter a name.'); return; }
        setIsSavingModal(true); Keyboard.dismiss();
        setTimeout(() => {
            if (modalMode === 'edit' && editingSymbol) { setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, name, imageUri: modalImageUri } : s)); }
            else { const newSymbol: SymbolItem = { id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, name, imageUri: modalImageUri }; setSymbols(prev => [newSymbol, ...prev]); }
            setIsSavingModal(false); closeModal();
        }, 50);
     };
    const handleDeletePress = (symbol: SymbolItem) => { /* ... Alert logic ... */ Alert.alert('Confirm Deletion', `Delete "${symbol.name}"? This cannot be undone.`, [ { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(symbol.id) }, ]); };
    const confirmDelete = (symbolId: string) => { /* ... Update state logic ... */ setIsDeleting(symbolId); setTimeout(() => { setSymbols(prev => prev.filter(s => s.id !== symbolId)); setIsDeleting(null); }, 300); };

    // --- Render Symbol Item (MODIFIED to use calculated width) ---
    const renderItem = ({ item }: { item: SymbolItem }) => (
        // Apply margin here instead of padding on container
        <View style={styles.symbolItemContainer}>
            <View style={[styles.symbolCard, { width: itemWidth }]}> {/* Apply calculated width */}
                <View style={styles.symbolImageWrapper}>
                    {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.symbolImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.symbolPlaceholder}>
                            <FontAwesomeIcon icon={faImage} size={itemWidth * 0.4} color="#ced4da" /> {/* Adjust icon size */}
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

    // --- Main Render (MODIFIED FlatList numColumns) ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar (Keep as before) */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} style={styles.headerButton} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faArrowLeft} size={18} color="white" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Symbols</Text>
                    <TouchableOpacity onPress={() => openModal('add')} style={styles.headerButton} hitSlop={styles.hitSlop} disabled={isLoadingStorage}><FontAwesomeIcon icon={faPlus} size={20} color={isLoadingStorage ? '#a9d6e9' : 'white'} /></TouchableOpacity>
                </View>

                {/* Content Area */}
                {isLoadingStorage ? ( /* ... Loading Overlay ... */ <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#0077b6" /><Text style={styles.loadingText}>Loading Symbols...</Text></View> )
                 : (
                    <FlatList
                        data={symbols}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={NUM_COLUMNS} // <-- Use constant for columns
                        contentContainerStyle={styles.gridContainer}
                        ListEmptyComponent={ /* ... Empty State Component ... */ <View style={styles.emptyContainer}><FontAwesomeIcon icon={faThLarge} size={50} color="#adb5bd" /><Text style={styles.emptyText}>No Custom Symbols Yet</Text><Text style={styles.emptySubText}>Tap the '+' button above to add your first symbol.</Text></View> }
                        // Performance tuning for FlatList
                        initialNumToRender={NUM_COLUMNS * 4} // Render a few rows initially
                        maxToRenderPerBatch={NUM_COLUMNS * 2}
                        windowSize={11}
                        removeClippedSubviews={true}
                    />
                )}

                {/* Add/Edit Symbol Modal (Keep as before) */}
                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                    {/* ... Modal Content Structure ... */}
                     <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                         <View style={styles.modalOverlay}>
                             <TouchableWithoutFeedback accessible={false}>
                                 <View style={styles.modalContent}>
                                     {/* ... Modal Header ... */}
                                     <View style={styles.modalHeader}><Text style={styles.modalTitleText}>{modalMode === 'add' ? 'Add New Symbol' : 'Edit Symbol'}</Text><TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faTimes} size={18} color="#6c757d" /></TouchableOpacity></View>
                                     {/* ... Modal Body ScrollView ... */}
                                     <ScrollView contentContainerStyle={styles.modalBody}>
                                        {/* ... Image Picker ... */}
                                        <Text style={styles.modalLabel}>Image (Optional)</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage} activeOpacity={0.7}>{modalImageUri ? (<Image source={{ uri: modalImageUri }} style={styles.modalPickedImage} resizeMode="contain"/>) : (<View style={styles.modalImagePlaceholder}><FontAwesomeIcon icon={faImage} size={40} color="#adb5bd"/><Text style={styles.modalImagePickerText}>Choose Image</Text></View>)}</TouchableOpacity>
                                        {/* ... Warning Box ... */}
                                        {modalImageUri && !modalImageUri.startsWith('file://') && (<View style={styles.warningBox}><FontAwesomeIcon icon={faExclamationTriangle} size={14} color="#ffc107" style={styles.warningIcon}/><Text style={styles.warningText}>Gallery images might disappear if deleted from source.</Text></View>)}
                                        {/* ... Name Input ... */}
                                        <Text style={styles.modalLabel}>Symbol Name *</Text><TextInput placeholder="Enter symbol name" value={modalSymbolName} onChangeText={setModalSymbolName} style={styles.modalInput} placeholderTextColor="#adb5bd" maxLength={40} returnKeyType="done" />
                                        {/* ... Save Button ... */}
                                        <TouchableOpacity style={[styles.modalSaveButton, (!modalSymbolName.trim() || isSavingModal) && styles.modalButtonDisabled]} onPress={handleSaveSymbol} disabled={!modalSymbolName.trim() || isSavingModal}>{isSavingModal ? <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} /> : <FontAwesomeIcon icon={faCheck} size={16} color="#ffffff" style={styles.buttonIcon}/>}<Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add Symbol' : 'Save Changes'}</Text></TouchableOpacity>
                                        {/* ... Remove Image Button ... */}
                                        {modalImageUri && modalMode === 'edit' && (<TouchableOpacity style={[styles.modalRemoveImageButton]} onPress={() => setModalImageUri(undefined)} disabled={isSavingModal}><FontAwesomeIcon icon={faTrash} size={14} color="#dc3545" style={styles.buttonIcon}/><Text style={styles.modalRemoveImageButtonText}>Remove Image</Text></TouchableOpacity>)}
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


// --- Styles --- (MODIFIED grid/item styles)
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0077b6', },
    container: { flex: 1, backgroundColor: '#f8f9fa', },
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(248, 249, 250, 0.8)', },
    loadingText: { marginTop: 15, fontSize: 16, fontWeight: '500', color: '#6c757d', },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0077b6', height: Platform.OS === 'ios' ? 55 : 50, paddingHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4, },
    headerButton: { padding: 10, minWidth: 40, alignItems: 'center', justifyContent: 'center', },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', },
    // --- Grid Styles ---
    gridContainer: {
        padding: GRID_PADDING, // Use constant for grid padding
        // Remove paddingHorizontal/Vertical if using GRID_PADDING
    },
    symbolItemContainer: {
        margin: ITEM_MARGIN, // Use constant for margin around items
        // width is set dynamically on the symbolCard below
    },
    symbolCard: {
        // width: itemWidth, // Width is applied inline in renderItem
        aspectRatio: 1, // Keep square
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'column',
        alignItems: 'center', // Center content horizontally
        justifyContent: 'space-between', // Distribute space vertically
    },
    symbolImageWrapper: {
        width: '100%', // Take full width of card
        flex: 1, // Allow image area to grow
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8%', // Padding relative to card size
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
        width: '100%', // Take full width
        paddingHorizontal: 6,
        paddingVertical: 5, // Reduced vertical padding
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        // justifyContent: 'space-between', // Removed, let content determine height
        minHeight: 40, // Ensure minimum height for text/buttons
    },
    symbolName: {
        fontSize: 13, // Slightly larger font
        fontWeight: '500',
        color: '#343a40',
        textAlign: 'center',
        marginBottom: 4, // Increased space below name
    },
    symbolActions: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Space out buttons
        alignItems: 'center',
        // marginTop: 2, // Removed
    },
    actionButton: {
        padding: 5, // Slightly larger tap area
    },
    // --- Empty State Styles ---
    emptyContainer: { flex: 1, minHeight: Dimensions.get('window').height * 0.6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6c757d', marginTop: 15, textAlign: 'center' },
    emptySubText: { fontSize: 14, color: '#adb5bd', marginTop: 8, textAlign: 'center' },
    // --- Modal Styles (Keep as before) ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 15 },
    modalContent: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef', position: 'relative' },
    modalTitleText: { fontSize: 18, fontWeight: 'bold', color: '#343a40' },
    modalCloseButton: { position: 'absolute', right: 10, top: 10, padding: 8 },
    modalBody: { padding: 20 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: '#495057', marginBottom: 6, marginTop: 12 },
    modalImagePicker: { width: '100%', aspectRatio: 1.5, backgroundColor: '#f8f9fa', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 1.5, borderColor: '#dee2e6', borderStyle: 'dashed', overflow: 'hidden' },
    modalPickedImage: { width: '100%', height: '100%' },
    modalImagePlaceholder: { alignItems: 'center' },
    modalImagePickerText: { color: '#6c757d', fontWeight: '500', marginTop: 8, fontSize: 14 },
    warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3cd', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#ffeeba', },
    warningIcon: { marginRight: 8, },
    warningText: { flex: 1, fontSize: 12, color: '#856404', },
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