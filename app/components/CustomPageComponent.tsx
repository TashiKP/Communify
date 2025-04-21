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
import { useGrid, GridLayoutType } from '../context/GridContext'; // <-- Import context hook and type

// --- Storage Key ---
const STORAGE_KEY = '@Communify:customSymbols';

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
// --- Calculate Columns based on Context ---
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 4;
        case 'standard': return 5;
        case 'dense': return 7;
        default: return 5;
    }
};
// Recalculate Item Width based on dynamic columns
const calculateItemWidth = (layout: GridLayoutType): number => {
    const numColumns = getNumColumns(layout);
    const gridPadding = 10; // Match style
    const itemMargin = 4;   // Match style
    return (screenWidth - (gridPadding * 2) - (itemMargin * 2 * numColumns)) / numColumns;
};
// -------------------------------------

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
    // --- Use Context ---
    const { gridLayout, isLoadingLayout } = useGrid(); // <-- Get layout from context
    // -----------------

    // --- State & Refs ---
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

    // --- Calculate dynamic values based on context ---
    const numGridColumns = getNumColumns(gridLayout);
    const itemWidth = calculateItemWidth(gridLayout);
    // -----------------------------------------------

    // --- Load/Save useEffects ---
    useEffect(() => {
        // ... Loading Logic using AsyncStorage ...
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
    }, []); // Run once

    useEffect(() => {
        // ... Saving Logic using AsyncStorage ...
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
    }, [symbols, onSymbolsUpdate]); // Run when symbols change

    // --- Modal Handling & Image Picker ---
    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => {
        setModalMode(mode);
        if (mode === 'edit' && symbol) { setEditingSymbol(symbol); setModalSymbolName(symbol.name); setModalImageUri(symbol.imageUri); }
        else { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); }
        setIsModalVisible(true);
    };
    const closeModal = () => {
        setIsModalVisible(false); setTimeout(() => { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); setIsSavingModal(false); }, 300);
    };
    const pickImage = () => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Error', response.errorMessage || 'Could not select image.'); return; }
            if (response.assets?.[0]?.uri) setModalImageUri(response.assets[0].uri);
        });
    };

    // --- CRUD Operations ---
    const handleSaveSymbol = () => {
        const name = modalSymbolName.trim(); if (!name) { Alert.alert('Validation Error', 'Name required.'); return; }
        setIsSavingModal(true); Keyboard.dismiss();
        setTimeout(() => {
            if (modalMode === 'edit' && editingSymbol) { setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, name, imageUri: modalImageUri } : s)); }
            else { const newSymbol: SymbolItem = { id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, name, imageUri: modalImageUri }; setSymbols(prev => [newSymbol, ...prev]); }
            setIsSavingModal(false); closeModal();
        }, 50);
    };
    const handleDeletePress = (symbol: SymbolItem) => {
        Alert.alert('Confirm Deletion', `Delete "${symbol.name}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(symbol.id) },]);
    };
    const confirmDelete = (symbolId: string) => {
        setIsDeleting(symbolId); setTimeout(() => { setSymbols(prev => prev.filter(s => s.id !== symbolId)); setIsDeleting(null); }, 300);
    };

    // --- Render Symbol Item ---
    const renderItem = ({ item }: { item: SymbolItem }) => (
        <View style={styles.symbolItemContainer}>
            {/* Apply calculated width */}
            <View style={[styles.symbolCard, { width: itemWidth }]}>
                <View style={styles.symbolImageWrapper}>
                    {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.symbolImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.symbolPlaceholder}>
                            {/* Adjust icon size based on calculated width */}
                            <FontAwesomeIcon icon={faImage} size={itemWidth * 0.4} color="#ced4da" />
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} style={styles.headerButton} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faArrowLeft} size={18} color="white" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Symbols</Text>
                    <TouchableOpacity onPress={() => openModal('add')} style={styles.headerButton} hitSlop={styles.hitSlop} disabled={isLoadingStorage}><FontAwesomeIcon icon={faPlus} size={20} color={isLoadingStorage ? '#a9d6e9' : 'white'} /></TouchableOpacity>
                </View>

                {/* Content Area */}
                {isLoadingStorage || isLoadingLayout ? ( // Show loading if either storage or layout context is loading
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#0077b6" />
                        <Text style={styles.loadingText}>Loading Symbols...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={symbols}
                        renderItem={renderItem}
                        keyExtractor={(item) => `${item.id}-${gridLayout}`} // Add gridLayout to key
                        numColumns={numGridColumns} // Use dynamic columns
                        key={numGridColumns} // Force remount on column change
                        contentContainerStyle={styles.gridContainer}
                        ListEmptyComponent={<View style={styles.emptyContainer}><FontAwesomeIcon icon={faThLarge} size={50} color="#adb5bd" /><Text style={styles.emptyText}>No Custom Symbols</Text><Text style={styles.emptySubText}>Tap '+' to add.</Text></View>}
                        initialNumToRender={numGridColumns * 4}
                        maxToRenderPerBatch={numGridColumns * 2}
                        windowSize={11}
                        removeClippedSubviews={true}
                        extraData={gridLayout} // Pass gridLayout as extraData
                    />
                )}

                {/* Add/Edit Symbol Modal */}
                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback accessible={false}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}><Text style={styles.modalTitleText}>{modalMode === 'add' ? 'Add' : 'Edit'} Symbol</Text><TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faTimes} size={18} color="#6c757d" /></TouchableOpacity></View>
                                    <ScrollView contentContainerStyle={styles.modalBody}>
                                        <Text style={styles.modalLabel}>Image (Optional)</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage} activeOpacity={0.7}>{modalImageUri ? (<Image source={{ uri: modalImageUri }} style={styles.modalPickedImage} resizeMode="contain"/>) : (<View style={styles.modalImagePlaceholder}><FontAwesomeIcon icon={faImage} size={40} color="#adb5bd"/><Text style={styles.modalImagePickerText}>Choose</Text></View>)}</TouchableOpacity>
                                        {modalImageUri && !modalImageUri.startsWith('file://') && (<View style={styles.warningBox}><FontAwesomeIcon icon={faExclamationTriangle} size={14} color="#ffc107" style={styles.warningIcon}/><Text style={styles.warningText}>Gallery images might disappear.</Text></View>)}
                                        <Text style={styles.modalLabel}>Name *</Text><TextInput placeholder="Enter symbol name" value={modalSymbolName} onChangeText={setModalSymbolName} style={styles.modalInput} placeholderTextColor="#adb5bd" maxLength={40} returnKeyType="done" />
                                        <TouchableOpacity style={[styles.modalSaveButton, (!modalSymbolName.trim() || isSavingModal) && styles.modalButtonDisabled]} onPress={handleSaveSymbol} disabled={!modalSymbolName.trim() || isSavingModal}>{isSavingModal ? <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} /> : <FontAwesomeIcon icon={faCheck} size={16} color="#ffffff" style={styles.buttonIcon}/>}<Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add' : 'Save'}</Text></TouchableOpacity>
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


// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0077b6', },
    container: { flex: 1, backgroundColor: '#f8f9fa', },
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(248, 249, 250, 0.8)', },
    loadingText: { marginTop: 15, fontSize: 16, fontWeight: '500', color: '#6c757d', },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0077b6', height: Platform.OS === 'ios' ? 55 : 50, paddingHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4, },
    headerButton: { padding: 10, minWidth: 40, alignItems: 'center', justifyContent: 'center', },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', },
    gridContainer: { padding: 10, /* GRID_PADDING */ }, // Use calculated padding
    symbolItemContainer: { margin: 4, /* ITEM_MARGIN */ }, // Use calculated margin
    symbolCard: {
        // width applied inline
        aspectRatio: 1, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
    },
    symbolImageWrapper: { width: '100%', flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', padding: '8%', },
    symbolImage: { width: '100%', height: '100%', },
    symbolPlaceholder: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', },
    symbolInfo: { width: '100%', paddingHorizontal: 6, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#e9ecef', minHeight: 40, },
    symbolName: { fontSize: 13, fontWeight: '500', color: '#343a40', textAlign: 'center', marginBottom: 4, },
    symbolActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', },
    actionButton: { padding: 5, },
    emptyContainer: { flex: 1, minHeight: Dimensions.get('window').height * 0.6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6c757d', marginTop: 15, textAlign: 'center' },
    emptySubText: { fontSize: 14, color: '#adb5bd', marginTop: 8, textAlign: 'center' },
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