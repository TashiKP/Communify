// src/components/CustomPageComponent.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, Image, TextInput,
    Dimensions, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Platform, ScrollView,
    Alert, FlatList
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faTimes, faPlus, faArrowLeft, faImage, faCheck, faPen, faTrash,
    faThLarge, faExclamationTriangle, faFolderPlus, faFolder,
    faChevronDown, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import {
    launchImageLibrary,
    ImageLibraryOptions,
    ImagePickerResponse,
} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useGrid, GridLayoutType } from '../context/GridContext';

// --- Storage Keys ---
const SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';
const CATEGORY_STORAGE_KEY = '@Communify:customCategories';

// --- Constants & Calculations ---
const screenWidth = Dimensions.get('window').width;
const getNumColumns = (layout: GridLayoutType): number => { switch (layout) { case 'simple': return 4; case 'standard': return 5; case 'dense': return 7; default: return 5; } };
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const gridPadding = 15; // Match listContainer padding
    const itemMargin = 4;   // Match symbolItemContainer_InSection margin
    return Math.max(80, Math.floor((screenWidth - (gridPadding * 2) - (itemMargin * 2 * numCols)) / numCols));
};

// --- Component Props Interface ---
interface CustomPageComponentProps {
    onBackPress: () => void;
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void;
}
// --- Data Structures ---
interface SymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; }
interface CategoryItem { id: string; name: string; }
interface GridSection { id: string | null; name: string; symbols: SymbolItem[]; }

// --- Main Component ---
const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    // --- Context ---
    const { gridLayout, isLoadingLayout } = useGrid();

    // --- State ---
    const [symbols, setSymbols] = useState<SymbolItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);
    const [modalSymbolName, setModalSymbolName] = useState('');
    const [modalImageUri, setModalImageUri] = useState<string | undefined>(undefined);
    const [modalSelectedCategoryId, setModalSelectedCategoryId] = useState<string | null | undefined>(undefined);
    const [isSavingModal, setIsSavingModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isLoadingStorage, setIsLoadingStorage] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
    const initialLoadComplete = useRef({ symbols: false, categories: false });

    // --- Calculate dynamic values ---
    const numInternalColumns = getNumColumns(gridLayout);
    const itemWidth = calculateItemWidth(gridLayout, numInternalColumns);

    // --- Load/Save useEffects ---
    useEffect(() => { /* Load Symbols */
        let isMounted = true; const loadSymbols = async () => { if (!isMounted) return; setIsLoadingStorage(true); initialLoadComplete.current.symbols = false; try { const jsonValue = await AsyncStorage.getItem(SYMBOLS_STORAGE_KEY); if (isMounted && jsonValue !== null) { const loaded = JSON.parse(jsonValue); if (Array.isArray(loaded)) setSymbols(loaded); else setSymbols([]); } else if (isMounted) { setSymbols([]); } } catch (e) { console.error('Failed load symbols', e); if (isMounted) setSymbols([]); } finally { if (isMounted) { setIsLoadingStorage(false); requestAnimationFrame(() => { initialLoadComplete.current.symbols = true; }); } } }; loadSymbols(); return () => { isMounted = false; }
     }, []);
    useEffect(() => { /* Load Categories */
        let isMounted = true; const loadCategories = async () => { if (!isMounted) return; setIsLoadingCategories(true); initialLoadComplete.current.categories = false; try { const jsonValue = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY); if (isMounted && jsonValue !== null) { const loaded = JSON.parse(jsonValue); if (Array.isArray(loaded)) setCategories(loaded); else setCategories([]); } else if (isMounted) { setCategories([]); } } catch (e) { console.error('Failed load categories', e); if (isMounted) setCategories([]); } finally { if (isMounted) { setIsLoadingCategories(false); requestAnimationFrame(() => { initialLoadComplete.current.categories = true; }); } } }; loadCategories(); return () => { isMounted = false; }
     }, []);
    useEffect(() => { /* Save Symbols */ if (!initialLoadComplete.current.symbols) return; const saveSymbols = async () => { try { await AsyncStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(symbols)); if (onSymbolsUpdate) onSymbolsUpdate(symbols); } catch (e) { console.error('Failed save symbols', e); Alert.alert('Save Error', 'Could not save symbols.'); } }; const timerId = setTimeout(saveSymbols, 300); return () => clearTimeout(timerId); }, [symbols, onSymbolsUpdate]);
    useEffect(() => { /* Save Categories */ if (!initialLoadComplete.current.categories) return; const saveCategories = async () => { try { await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories)); } catch (e) { console.error('Failed save categories', e); Alert.alert('Save Error', 'Could not save categories.'); } }; const timerId = setTimeout(saveCategories, 300); return () => clearTimeout(timerId); }, [categories]);

    // --- Data Transformation for Sections ---
    const sectionedListData = useMemo(() => {
        const groupedSymbols = new Map<string | null, SymbolItem[]>();
        symbols.forEach(symbol => { const key = symbol.categoryId ?? null; if (!groupedSymbols.has(key)) groupedSymbols.set(key, []); groupedSymbols.get(key)?.push(symbol); });
        groupedSymbols.forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));
        const sections: GridSection[] = [];
        const uncategorized = groupedSymbols.get(null);
        if (uncategorized && uncategorized.length > 0) { sections.push({ id: null, name: 'Uncategorized', symbols: uncategorized }); groupedSymbols.delete(null); }
        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
        sortedCategories.forEach(category => { const syms = groupedSymbols.get(category.id); sections.push({ id: category.id, name: category.name, symbols: syms || [] }); });
        setExpandedCategories(prevExpanded => { const currentKeys = new Set(Object.keys(prevExpanded)); const newExpandedState = {...prevExpanded}; let stateChanged = false; sections.forEach(sec => { const key = String(sec.id); if (!currentKeys.has(key)) { newExpandedState[key] = true; stateChanged = true; } }); return stateChanged ? newExpandedState : prevExpanded; });
        return sections;
    }, [symbols, categories]);

    // --- Toggle Folder Expansion ---
    const toggleCategoryExpansion = useCallback((categoryId: string | null) => { const key = String(categoryId); setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] })); }, []);

    // --- Modal, Image Picker, CRUD, Category Handlers ---
    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => { setModalMode(mode); setShowAddCategoryInput(false); setNewCategoryName(''); if (mode === 'edit' && symbol) { setEditingSymbol(symbol); setModalSymbolName(symbol.name); setModalImageUri(symbol.imageUri); setModalSelectedCategoryId(symbol.categoryId); } else { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); setModalSelectedCategoryId(undefined); } setIsModalVisible(true); };
    const closeModal = () => { setIsModalVisible(false); setTimeout(() => { setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined); setModalSelectedCategoryId(undefined); setIsSavingModal(false); }, 300); };
    const pickImage = () => { const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 }; launchImageLibrary(options, (response: ImagePickerResponse) => { if (response.didCancel) return; if (response.errorCode) { Alert.alert('Error', response.errorMessage || 'Could not select image.'); return; } if (response.assets?.[0]?.uri) setModalImageUri(response.assets[0].uri); }); };
    const handleAddNewCategory = () => { const trimmedName = newCategoryName.trim(); if (!trimmedName) { Alert.alert('Invalid Name', 'Please enter category name.'); return; } if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) { Alert.alert('Duplicate Name', 'Category exists.'); return; } Keyboard.dismiss(); const newCategory: CategoryItem = { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, name: trimmedName }; setCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name))); setModalSelectedCategoryId(newCategory.id); setNewCategoryName(''); setShowAddCategoryInput(false); };
    const handleSaveSymbol = () => { const name = modalSymbolName.trim(); if (!name) { Alert.alert('Validation Error', 'Name required.'); return; } setIsSavingModal(true); Keyboard.dismiss(); setTimeout(() => { const symbolData = { name, imageUri: modalImageUri, categoryId: modalSelectedCategoryId === undefined ? null : modalSelectedCategoryId }; if (modalMode === 'edit' && editingSymbol) { setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, ...symbolData } : s)); } else { const newSymbol: SymbolItem = { id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, ...symbolData }; setSymbols(prev => [newSymbol, ...prev]); } setIsSavingModal(false); closeModal(); }, 50); };
    const handleDeletePress = (symbol: SymbolItem) => { Alert.alert('Confirm Deletion', `Delete "${symbol.name}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(symbol.id) },]); };
    const confirmDelete = (symbolId: string) => { setIsDeleting(symbolId); setTimeout(() => { setSymbols(prev => prev.filter(s => s.id !== symbolId)); setIsDeleting(null); }, 300); };

    // --- RENDER ITEM FOR FLATLIST (Sections/Folders) ---
    const renderSection = ({ item: section }: { item: GridSection }) => {
        const sectionKey = String(section.id);
        const isExpanded = expandedCategories[sectionKey] ?? false;

        return (
            <View style={styles.sectionContainer}>
                <TouchableOpacity style={styles.folderHeader} onPress={() => toggleCategoryExpansion(section.id)} activeOpacity={0.7} accessibilityLabel={`Category ${section.name}, ${section.symbols.length} items, ${isExpanded ? 'expanded' : 'collapsed'}`} accessibilityRole="button" accessibilityState={{ expanded: isExpanded }}>
                    <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} size={14} color={darkGrey} style={styles.chevronIcon} />
                    <FontAwesomeIcon icon={faFolder} size={18} color={darkGrey} style={styles.folderIcon} />
                    <Text style={styles.folderName}>{section.name}</Text>
                    <Text style={styles.folderCount}>({section.symbols.length})</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.symbolsGridContainer}>
                        {section.symbols.map(symbol => (
                             <View key={symbol.id} style={styles.symbolItemContainer_InSection}>
                                <View style={[styles.symbolCard, { width: itemWidth }]}>
                                    <View style={styles.symbolImageWrapper}>
                                        {symbol.imageUri ? <Image source={{ uri: symbol.imageUri }} style={styles.symbolImage} resizeMode="contain" onError={(e) => console.warn(`Img Load Error: ${symbol.name}`, e.nativeEvent.error)} /> : <View style={styles.symbolPlaceholder}><FontAwesomeIcon icon={faImage} size={itemWidth * 0.4} color="#ced4da" /></View>}
                                    </View>
                                    <View style={styles.symbolInfo}>
                                        <Text style={styles.symbolName} numberOfLines={1}>{symbol.name}</Text>
                                        <View style={styles.symbolActions}>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => openModal('edit', symbol)} disabled={!!isDeleting} ><FontAwesomeIcon icon={faPen} size={14} color="#0077b6" /></TouchableOpacity>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePress(symbol)} disabled={!!isDeleting} >{isDeleting === symbol.id ? <ActivityIndicator size="small" color="#dc3545" /> : <FontAwesomeIcon icon={faTrash} size={14} color="#dc3545" />}</TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                         {section.symbols.length === 0 && (<Text style={styles.emptyFolderText}>This folder is empty.</Text>)}
                    </View>
                )}
            </View>
        );
    };

    // --- Combined Loading State ---
    const isLoading = isLoadingStorage || isLoadingCategories || isLoadingLayout;

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} style={styles.headerButton} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faArrowLeft} size={18} color="white" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Symbols</Text>
                    <TouchableOpacity onPress={() => openModal('add')} style={styles.headerButton} hitSlop={styles.hitSlop} disabled={isLoading}><FontAwesomeIcon icon={faPlus} size={20} color={isLoading ? '#a9d6e9' : 'white'} /></TouchableOpacity>
                </View>

                {/* Content Area */}
                {isLoading ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#0077b6" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                 ) : (
                    <FlatList
                        data={sectionedListData}
                        renderItem={renderSection}
                        keyExtractor={(item) => String(item.id) ?? 'uncategorized-section'}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<View style={styles.emptyContainer}><FontAwesomeIcon icon={faThLarge} size={50} color="#adb5bd" /><Text style={styles.emptyText}>No Custom Symbols</Text><Text style={styles.emptySubText}>Tap '+' to add.</Text></View>}
                        extraData={`${gridLayout}-${Object.keys(expandedCategories).length}-${symbols.length}-${categories.length}`} // More robust extraData
                    />
                )}

                {/* Add/Edit Symbol Modal */}
                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                   <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                         <View style={styles.modalOverlay}>
                             <TouchableWithoutFeedback accessible={false}>
                                 <View style={styles.modalContent}>
                                     <View style={styles.modalHeader}><Text style={styles.modalTitleText}>{modalMode === 'add' ? 'Add' : 'Edit'} Symbol</Text><TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}><FontAwesomeIcon icon={faTimes} size={18} color="#6c757d" /></TouchableOpacity></View>
                                     <ScrollView contentContainerStyle={styles.modalBody}>
                                         {/* Image, Name */}
                                        <Text style={styles.modalLabel}>Image (Optional)</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage}>{modalImageUri ? <Image source={{ uri: modalImageUri }} style={styles.modalPickedImage}/> : <View style={styles.modalImagePlaceholder}><FontAwesomeIcon icon={faImage} size={40} color="#adb5bd"/><Text style={styles.modalImagePickerText}>Choose</Text></View>}</TouchableOpacity>
                                        {modalImageUri && !modalImageUri.startsWith('file://') && <View style={styles.warningBox}><FontAwesomeIcon icon={faExclamationTriangle} size={14} color="#ffc107" style={styles.warningIcon}/><Text style={styles.warningText}>Gallery images might disappear.</Text></View>}
                                        <Text style={styles.modalLabel}>Symbol Name *</Text><TextInput placeholder="Enter name" value={modalSymbolName} onChangeText={setModalSymbolName} style={styles.modalInput}/>

                                         {/* Category Section */}
                                         <Text style={styles.modalLabel}>Category</Text>
                                         <View style={styles.categorySelectionContainer}>
                                             <View style={styles.pickerWrapper}>
                                                <Picker selectedValue={modalSelectedCategoryId} onValueChange={setModalSelectedCategoryId} style={styles.picker} itemStyle={styles.pickerItem} mode="dropdown" enabled={!showAddCategoryInput}>
                                                     <Picker.Item label="-- Uncategorized --" value={null} />
                                                     {categories.map(cat => (<Picker.Item key={cat.id} label={cat.name} value={cat.id} />))}
                                                 </Picker>
                                              </View>
                                             <TouchableOpacity style={styles.addCategoryButton} onPress={() => setShowAddCategoryInput(prev => !prev)}>
                                                  <FontAwesomeIcon icon={showAddCategoryInput ? faTimes : faFolderPlus} size={18} color={primaryColor} />
                                             </TouchableOpacity>
                                         </View>
                                         {showAddCategoryInput && (
                                             <View style={styles.addCategoryInputContainer}>
                                                 <TextInput style={styles.addCategoryInput} placeholder="New category name..." value={newCategoryName} onChangeText={setNewCategoryName} maxLength={30} returnKeyType="done" onSubmitEditing={handleAddNewCategory} autoFocus={true}/>
                                                 <TouchableOpacity style={[styles.addCategoryConfirmButton, !newCategoryName.trim() && styles.modalButtonDisabled]} onPress={handleAddNewCategory} disabled={!newCategoryName.trim()}><FontAwesomeIcon icon={faCheck} size={16} color={whiteColor} /></TouchableOpacity>
                                             </View>
                                         )}

                                         {/* Save, Remove Image Buttons */}
                                         <TouchableOpacity style={[styles.modalSaveButton, (!modalSymbolName.trim() || isSavingModal) && styles.modalButtonDisabled]} onPress={handleSaveSymbol} disabled={!modalSymbolName.trim() || isSavingModal}>{isSavingModal ? <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} /> : <FontAwesomeIcon icon={faCheck} size={16} color="#ffffff" style={styles.buttonIcon}/>}<Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add' : 'Save'}</Text></TouchableOpacity>
                                         {modalImageUri && modalMode === 'edit' && (<TouchableOpacity style={styles.modalRemoveImageButton} onPress={() => setModalImageUri(undefined)} disabled={isSavingModal}><FontAwesomeIcon icon={faTrash} size={14} color="#dc3545" style={styles.buttonIcon}/><Text style={styles.modalRemoveImageButtonText}>Remove Image</Text></TouchableOpacity>)}
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
const primaryColor = '#0077b6';
const whiteColor = '#ffffff';
const mediumGrey = '#ced4da';
const lightGrey = '#e9ecef';
const textColor = '#343a40';
const darkGrey = '#6c757d';
const placeholderColor = '#adb5bd';

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0077b6', },
    container: { flex: 1, backgroundColor: '#f8f9fa', },
    loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(248, 249, 250, 0.8)', },
    loadingText: { marginTop: 15, fontSize: 16, fontWeight: '500', color: '#6c757d', },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0077b6', height: Platform.OS === 'ios' ? 55 : 50, paddingHorizontal: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4, },
    headerButton: { padding: 10, minWidth: 40, alignItems: 'center', justifyContent: 'center', },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', },

    // --- List & Section Styles ---
    listContainer: { padding: 15, paddingBottom: 40, },
    sectionContainer: { marginBottom: 20, backgroundColor: whiteColor, borderRadius: 10, borderWidth: 1, borderColor: lightGrey, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, overflow: 'hidden', },
    folderHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: lightGrey, backgroundColor: '#f8f9fa', },
    chevronIcon: { marginRight: 10, width: 14, },
    folderIcon: { marginRight: 10, color: darkGrey, },
    folderName: { flex: 1, fontSize: 17, fontWeight: '600', color: textColor, },
    folderCount: { fontSize: 14, color: darkGrey, marginLeft: 8, },
    symbolsGridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 10, paddingBottom: 5, paddingHorizontal: 10, justifyContent: 'flex-start', },
    emptyFolderText: { paddingVertical: 20, textAlign: 'center', color: darkGrey, fontStyle: 'italic', width: '100%', },

    // --- Symbol Item Styles (Inside Folder) ---
    symbolItemContainer_InSection: { margin: 4, },
    symbolCard: { aspectRatio: 1, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef', overflow: 'hidden', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', },
    symbolImageWrapper: { width: '100%', flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', padding: '8%', },
    symbolImage: { width: '100%', height: '100%', },
    symbolPlaceholder: { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', },
    symbolInfo: { width: '100%', paddingHorizontal: 6, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#e9ecef', minHeight: 40, },
    symbolName: { fontSize: 13, fontWeight: '500', color: '#343a40', textAlign: 'center', marginBottom: 4, },
    symbolActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', },
    actionButton: { padding: 5, },

    // --- Empty State for the whole list ---
    emptyContainer: { flex: 1, minHeight: Dimensions.get('window').height * 0.6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6c757d', marginTop: 15, textAlign: 'center' },
    emptySubText: { fontSize: 14, color: '#adb5bd', marginTop: 8, textAlign: 'center' },

    // --- Modal Styles ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 15 },
    modalContent: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef', position: 'relative' },
    modalTitleText: { fontSize: 18, fontWeight: 'bold', color: '#343a40' },
    modalCloseButton: { position: 'absolute', right: 10, top: 10, padding: 8 },
    modalBody: { padding: 20, paddingBottom: 30 },
    modalLabel: { fontSize: 14, fontWeight: '600', color: darkGrey, marginBottom: 6, marginTop: 15 },
    modalImagePicker: { width: '100%', aspectRatio: 1.5, backgroundColor: '#f8f9fa', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 1.5, borderColor: mediumGrey, borderStyle: 'dashed', overflow: 'hidden' },
    modalPickedImage: { width: '100%', height: '100%' },
    modalImagePlaceholder: { alignItems: 'center' },
    modalImagePickerText: { color: darkGrey, fontWeight: '500', marginTop: 8, fontSize: 14 },
    warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3cd', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#ffeeba', },
    warningIcon: { marginRight: 8, },
    warningText: { flex: 1, fontSize: 12, color: '#856404', },
    modalInput: { backgroundColor: whiteColor, height: 48, borderColor: mediumGrey, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 15, fontSize: 16, color: textColor },
    modalSaveButton: { backgroundColor: primaryColor, paddingVertical: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
    modalButtonText: { color: whiteColor, fontWeight: 'bold', fontSize: 16 },
    modalRemoveImageButton: { backgroundColor: '#f8f9fa', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 15, borderWidth: 1, borderColor: '#dc3545' },
    modalRemoveImageButtonText: { color: '#dc3545', fontWeight: '600', fontSize: 14 },
    modalButtonDisabled: { backgroundColor: mediumGrey, opacity: 0.7 },
    buttonIcon: { marginRight: 8 },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    categorySelectionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, },
    pickerWrapper: { flex: 1, height: 50, borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, marginRight: 10, justifyContent: 'center', backgroundColor: whiteColor, },
    picker: { height: Platform.OS === 'ios' ? undefined : 50, color: textColor, },
    pickerItem: { fontSize: 16, color: textColor, },
    addCategoryButton: { padding: 10, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: mediumGrey, borderRadius: 8, backgroundColor: lightGrey, },
    addCategoryInputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 15, },
    addCategoryInput: { flex: 1, height: 44, borderColor: mediumGrey, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginRight: 10, fontSize: 15, backgroundColor: whiteColor, },
    addCategoryConfirmButton: { backgroundColor: primaryColor, padding: 10, height: 44, width: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', },
});

export default CustomPageComponent;