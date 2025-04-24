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
} from 'react-native-image-picker'; // Ensure installed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker'; // Ensure installed

// --- Import Context Hooks & Types ---
import { useGrid, GridLayoutType } from '../context/GridContext'; // Adjust path if needed
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path if needed

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
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void; // Optional: Inform parent of changes
}
// --- Data Structures ---
interface SymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; }
interface CategoryItem { id: string; name: string; }
interface GridSection { id: string | null; name: string; symbols: SymbolItem[]; }

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// --- Main Component ---
const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    // --- Context ---
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance(); // Use appearance context

    // --- State ---
    const [symbols, setSymbols] = useState<SymbolItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);
    const [modalSymbolName, setModalSymbolName] = useState('');
    const [modalImageUri, setModalImageUri] = useState<string | undefined>(undefined);
    const [modalSelectedCategoryId, setModalSelectedCategoryId] = useState<string | null | undefined>(undefined); // Start undefined
    const [isSavingModal, setIsSavingModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting symbol ID
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true); // Separate loading states
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({}); // Initialize empty
    const initialLoadComplete = useRef({ symbols: false, categories: false }).current;

    // --- Calculate dynamic values ---
    const numInternalColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numInternalColumns), [gridLayout, numInternalColumns]);

    // --- Load/Save useEffects ---
    useEffect(() => { /* Load Symbols */
        let isMounted = true;
        const loadSymbols = async () => {
            if (!isMounted) return; setIsLoadingSymbols(true); initialLoadComplete.symbols = false;
            try {
                const jsonValue = await AsyncStorage.getItem(SYMBOLS_STORAGE_KEY);
                if (isMounted) {
                    const loaded = jsonValue !== null ? JSON.parse(jsonValue) : [];
                    if (Array.isArray(loaded)) setSymbols(loaded); else setSymbols([]);
                }
            } catch (e) { console.error('CustomPage: Failed load symbols', e); if (isMounted) setSymbols([]); }
            finally { if (isMounted) { setIsLoadingSymbols(false); requestAnimationFrame(() => { initialLoadComplete.symbols = true; }); } }
        };
        loadSymbols(); return () => { isMounted = false; }
     }, []);

    useEffect(() => { /* Load Categories */
        let isMounted = true;
        const loadCategories = async () => {
            if (!isMounted) return; setIsLoadingCategories(true); initialLoadComplete.categories = false;
            try {
                const jsonValue = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
                if (isMounted) {
                    const loaded = jsonValue !== null ? JSON.parse(jsonValue) : [];
                    if (Array.isArray(loaded)) {
                        setCategories(loaded);
                        // Initialize expanded state after loading categories
                        const initialExpanded: { [key: string]: boolean } = {};
                        loaded.forEach(cat => initialExpanded[cat.id] = true);
                        initialExpanded['null'] = true; // Ensure uncategorized starts expanded
                        setExpandedCategories(initialExpanded);
                    } else {
                        setCategories([]);
                        setExpandedCategories({'null': true}); // Default expansion if no categories loaded
                    }
                }
            } catch (e) { console.error('CustomPage: Failed load categories', e); if (isMounted) { setCategories([]); setExpandedCategories({'null': true}); } }
            finally { if (isMounted) { setIsLoadingCategories(false); requestAnimationFrame(() => { initialLoadComplete.categories = true; }); } }
        };
        loadCategories(); return () => { isMounted = false; }
     }, []);

    useEffect(() => { /* Save Symbols */
        if (!initialLoadComplete.symbols || isLoadingSymbols) return; // Don't save until loaded
        const saveSymbols = async () => {
            try { await AsyncStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(symbols)); if (onSymbolsUpdate) onSymbolsUpdate(symbols); }
            catch (e) { console.error('CustomPage: Failed save symbols', e); Alert.alert('Save Error', 'Could not save symbols.'); }
        };
        const timerId = setTimeout(saveSymbols, 500); // Debounce saving
        return () => clearTimeout(timerId);
     }, [symbols, onSymbolsUpdate, isLoadingSymbols]); // Depend on loading state too

    useEffect(() => { /* Save Categories */
        if (!initialLoadComplete.categories || isLoadingCategories) return; // Don't save until loaded
        const saveCategories = async () => {
            try { await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories)); }
            catch (e) { console.error('CustomPage: Failed save categories', e); Alert.alert('Save Error', 'Could not save categories.'); }
        };
        const timerId = setTimeout(saveCategories, 500); // Debounce saving
        return () => clearTimeout(timerId);
     }, [categories, isLoadingCategories]); // Depend on loading state too

    // --- Data Transformation for Sections ---
    const sectionedListData = useMemo(() => {
        const groupedSymbols = new Map<string | null, SymbolItem[]>();
        symbols.forEach(symbol => { const key = symbol.categoryId ?? null; if (!groupedSymbols.has(key)) groupedSymbols.set(key, []); groupedSymbols.get(key)?.push(symbol); });
        // Sort symbols within each group
        groupedSymbols.forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));

        const sections: GridSection[] = [];
        const uncategorized = groupedSymbols.get(null);
        // Add Uncategorized section only if it has symbols OR if there are no other categories yet
        if (uncategorized && uncategorized.length > 0) {
            sections.push({ id: null, name: 'Uncategorized', symbols: uncategorized });
            groupedSymbols.delete(null); // Remove from map
        } else if (categories.length === 0 && uncategorized) {
            // Show empty uncategorized if no other categories exist yet but symbols might be added
             sections.push({ id: null, name: 'Uncategorized', symbols: [] });
             groupedSymbols.delete(null);
        }


        // Sort categories alphabetically by name for display
        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

        // Add categorized sections
        sortedCategories.forEach(category => {
            const syms = groupedSymbols.get(category.id) || []; // Get symbols or empty array
            sections.push({ id: category.id, name: category.name, symbols: syms });
        });

        // Update expanded state only for newly added categories (less disruptive)
        setExpandedCategories(prevExpanded => {
            const currentKeys = new Set(Object.keys(prevExpanded));
            const newExpandedState = {...prevExpanded};
            let stateChanged = false;
            sections.forEach(sec => {
                const key = String(sec.id);
                if (!currentKeys.has(key)) { // If this section ID wasn't in the state before
                    newExpandedState[key] = true; // Expand it by default
                    stateChanged = true;
                }
            });
            return stateChanged ? newExpandedState : prevExpanded;
        });


        return sections;
    }, [symbols, categories]); // Recalculate when symbols or categories change

    // --- Toggle Folder Expansion ---
    const toggleCategoryExpansion = useCallback((categoryId: string | null) => {
        const key = String(categoryId); // Use 'null' as string key for uncategorized
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // --- Modal, Image Picker, CRUD, Category Handlers ---
    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => {
        setModalMode(mode);
        setShowAddCategoryInput(false); // Reset add category input visibility
        setNewCategoryName(''); // Clear new category name
        if (mode === 'edit' && symbol) {
            setEditingSymbol(symbol);
            setModalSymbolName(symbol.name);
            setModalImageUri(symbol.imageUri);
            // Handle undefined categoryId explicitly for picker
            setModalSelectedCategoryId(symbol.categoryId === null ? null : symbol.categoryId);
        } else {
            setEditingSymbol(null);
            setModalSymbolName('');
            setModalImageUri(undefined);
            setModalSelectedCategoryId(null); // Default to Uncategorized for new symbols
        }
        setIsModalVisible(true);
     };

    const closeModal = () => {
        setIsModalVisible(false);
        // Delay resetting state to allow modal fade out animation
        setTimeout(() => {
            setEditingSymbol(null);
            setModalSymbolName('');
            setModalImageUri(undefined);
            setModalSelectedCategoryId(undefined); // Reset fully
            setIsSavingModal(false); // Reset saving indicator
            setShowAddCategoryInput(false); // Hide add category input
            setNewCategoryName(''); // Clear new category name
        }, 300);
    };

    const pickImage = () => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) { console.log('Image picker cancelled'); return; }
            if (response.errorCode) { console.error('ImagePicker Error: ', response.errorMessage); Alert.alert('Error', response.errorMessage || 'Could not select image.'); return; }
            if (response.assets && response.assets[0]?.uri) {
                setModalImageUri(response.assets[0].uri);
            }
        });
     };

    const handleAddNewCategory = () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) { Alert.alert('Invalid Name', 'Please enter a valid category name.'); return; }
        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) { Alert.alert('Duplicate Name', 'A category with this name already exists.'); return; }

        Keyboard.dismiss();
        const newCategory: CategoryItem = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name: trimmedName
        };
        // Add new category and keep list sorted
        setCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
        // Automatically select the newly added category in the modal
        setModalSelectedCategoryId(newCategory.id);
        // Clear input and hide the input field
        setNewCategoryName('');
        setShowAddCategoryInput(false);
        Alert.alert('Category Added', `"${trimmedName}" created successfully.`);
     };

    const handleSaveSymbol = () => {
        const name = modalSymbolName.trim();
        if (!name) { Alert.alert('Validation Error', 'Symbol name is required.'); return; }

        setIsSavingModal(true);
        Keyboard.dismiss();

        // Use setTimeout for visual feedback on save
        setTimeout(() => {
            const symbolData = {
                name,
                imageUri: modalImageUri,
                 // Ensure categoryId is null if '-- Uncategorized --' was selected
                 categoryId: modalSelectedCategoryId === undefined ? null : modalSelectedCategoryId,
            };

            if (modalMode === 'edit' && editingSymbol) {
                // Update existing symbol
                setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, ...symbolData } : s));
            } else {
                // Add new symbol
                const newSymbol: SymbolItem = {
                    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                    ...symbolData
                };
                setSymbols(prev => [newSymbol, ...prev]); // Add to beginning or end? Beginning for visibility.
            }
            // No need to set saving false here, closeModal resets it
            closeModal(); // Close modal after simulated delay
        }, 100); // Short delay
    };

    const handleDeletePress = (symbol: SymbolItem) => {
        Alert.alert(
            'Confirm Deletion',
            `Are you sure you want to delete the symbol "${symbol.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(symbol.id) },
            ]
        );
     };

    const confirmDelete = (symbolId: string) => {
        setIsDeleting(symbolId); // Set deleting state for visual feedback
        // Use setTimeout for visual feedback on delete
        setTimeout(() => {
            setSymbols(prev => prev.filter(s => s.id !== symbolId));
            setIsDeleting(null); // Clear deleting state
        }, 300);
    };


    // --- RENDER ITEM FOR FLATLIST (Sections/Folders) ---
    const renderSection = ({ item: section }: { item: GridSection }) => {
        const sectionKey = String(section.id); // Use 'null' for uncategorized key
        const isExpanded = expandedCategories[sectionKey] ?? false; // Default to false if not set

        return (
            <View style={styles.sectionContainer}>
                <TouchableOpacity
                    style={styles.folderHeader}
                    onPress={() => toggleCategoryExpansion(section.id)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Category ${section.name}, ${section.symbols.length} items, ${isExpanded ? 'expanded' : 'collapsed'}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                >
                    <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} size={fonts.caption} color={theme.textSecondary} style={styles.chevronIcon} />
                    <FontAwesomeIcon icon={faFolder} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.folderIcon} />
                    <Text style={styles.folderName}>{section.name}</Text>
                    <Text style={styles.folderCount}>({section.symbols.length})</Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.symbolsGridContainer}>
                        {section.symbols.map(symbol => (
                             <View key={symbol.id} style={styles.symbolItemContainer_InSection}>
                                {/* Pass width calculated from context */}
                                <View style={[styles.symbolCard, { width: itemWidth }]}>
                                    <View style={styles.symbolImageWrapper}>
                                        {symbol.imageUri ? (
                                            <Image source={{ uri: symbol.imageUri }} style={styles.symbolImage} resizeMode="contain" onError={(e) => console.warn(`Img Load Error: ${symbol.name}`, e.nativeEvent.error)} />
                                         ) : (
                                            <View style={styles.symbolPlaceholder}>
                                                {/* Use themed icon */}
                                                <FontAwesomeIcon icon={faImage} size={itemWidth * 0.4} color={theme.disabled} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.symbolInfo}>
                                        <Text style={styles.symbolName} numberOfLines={1}>{symbol.name}</Text>
                                        <View style={styles.symbolActions}>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => openModal('edit', symbol)} disabled={!!isDeleting} accessibilityLabel={`Edit symbol ${symbol.name}`}>
                                                <FontAwesomeIcon icon={faPen} size={fonts.caption * 1.1} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePress(symbol)} disabled={!!isDeleting} accessibilityLabel={`Delete symbol ${symbol.name}`}>
                                                {isDeleting === symbol.id ? (
                                                    <ActivityIndicator size="small" color={theme.primary} /> // Use theme color? Or an error color?
                                                ) : (
                                                    <FontAwesomeIcon icon={faTrash} size={fonts.caption * 1.1} color={"#dc3545"} /> // Keep error color distinct
                                                )}
                                            </TouchableOpacity>
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

    // --- Combined Loading State for overall screen ---
    const isLoading = isLoadingSymbols || isLoadingCategories || isLoadingGridLayout || isLoadingAppearance;

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} style={styles.headerButton} hitSlop={hitSlop} accessibilityLabel="Go back">
                        <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Symbols</Text>
                    <TouchableOpacity onPress={() => openModal('add')} style={styles.headerButton} hitSlop={hitSlop} disabled={isLoading} accessibilityLabel="Add new symbol">
                        <FontAwesomeIcon icon={faPlus} size={fonts.h2} color={isLoading ? theme.disabled : theme.white} />
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                {isLoading ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={styles.loadingText}>Loading Custom Symbols...</Text>
                    </View>
                 ) : (
                    <FlatList
                        data={sectionedListData}
                        renderItem={renderSection}
                        keyExtractor={(item) => String(item.id) ?? 'uncategorized-section'}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <FontAwesomeIcon icon={faThLarge} size={50} color={theme.disabled} />
                                <Text style={styles.emptyText}>No Custom Symbols Yet</Text>
                                <Text style={styles.emptySubText}>Tap '+' in the header to add your first symbol.</Text>
                            </View>
                        }
                        // Update extraData for re-renders on relevant changes
                        extraData={`${gridLayout}-${categories.length}-${symbols.length}-${JSON.stringify(expandedCategories)}`}
                    />
                )}

                {/* Add/Edit Symbol Modal */}
                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                   <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                         <View style={styles.modalOverlay}>
                             {/* Prevent closing modal by tapping content */}
                             <TouchableWithoutFeedback accessible={false}>
                                 <View style={styles.modalContent}>
                                     <View style={styles.modalHeader}>
                                         <Text style={styles.modalTitleText}>{modalMode === 'add' ? 'Add' : 'Edit'} Symbol</Text>
                                         <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} accessibilityLabel="Close modal">
                                             <FontAwesomeIcon icon={faTimes} size={fonts.body} color={theme.textSecondary} />
                                         </TouchableOpacity>
                                     </View>
                                     <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                                        {/* Image Picker */}
                                        <Text style={styles.modalLabel}>Image (Optional)</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage}>
                                            {modalImageUri ? (
                                                <Image source={{ uri: modalImageUri }} style={styles.modalPickedImage}/>
                                            ) : (
                                                <View style={styles.modalImagePlaceholder}>
                                                    <FontAwesomeIcon icon={faImage} size={fonts.h1 * 1.5} color={theme.disabled}/>
                                                    <Text style={styles.modalImagePickerText}>Choose Image</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {modalImageUri && Platform.OS !== 'web' && !modalImageUri.startsWith('file://') && (
                                            <View style={styles.warningBox}>
                                                <FontAwesomeIcon icon={faExclamationTriangle} size={fonts.caption} color={theme.text} style={styles.warningIcon}/>
                                                <Text style={styles.warningText}>Selected image might not persist after app updates. Consider saving it locally.</Text>
                                            </View>
                                        )}

                                        {/* Symbol Name */}
                                        <Text style={styles.modalLabel}>Symbol Name *</Text>
                                        <TextInput
                                            placeholder="Enter name"
                                            placeholderTextColor={theme.disabled}
                                            value={modalSymbolName}
                                            onChangeText={setModalSymbolName}
                                            style={styles.modalInput}
                                            autoCapitalize="words"
                                        />

                                         {/* Category Section */}
                                         <Text style={styles.modalLabel}>Category</Text>
                                         <View style={styles.categorySelectionContainer}>
                                             <View style={styles.pickerWrapper}>
                                                {/* Use Platform check for Picker styling */}
                                                <Picker
                                                    selectedValue={modalSelectedCategoryId}
                                                    onValueChange={(itemValue) => setModalSelectedCategoryId(itemValue)}
                                                    style={styles.picker}
                                                    itemStyle={styles.pickerItem} // iOS only
                                                    mode="dropdown" // Android only
                                                    enabled={!showAddCategoryInput}
                                                    dropdownIconColor={theme.textSecondary} // Android dropdown icon color
                                                >
                                                     <Picker.Item label="-- Uncategorized --" value={null} color={theme.text} />
                                                     {categories.map(cat => (
                                                         <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={theme.text}/>
                                                     ))}
                                                 </Picker>
                                              </View>
                                             {/* Add Category Button */}
                                             <TouchableOpacity
                                                 style={[styles.addCategoryButton, showAddCategoryInput && styles.addCategoryButtonActive]}
                                                 onPress={() => setShowAddCategoryInput(prev => !prev)}
                                                 accessibilityLabel={showAddCategoryInput ? "Cancel adding category" : "Add new category"}
                                            >
                                                  <FontAwesomeIcon icon={showAddCategoryInput ? faTimes : faFolderPlus} size={fonts.body * 1.1} color={theme.primary} />
                                             </TouchableOpacity>
                                         </View>

                                         {/* Add Category Input Field (Conditional) */}
                                         {showAddCategoryInput && (
                                             <View style={styles.addCategoryInputContainer}>
                                                 <TextInput
                                                     style={styles.addCategoryInput}
                                                     placeholder="New category name..."
                                                     placeholderTextColor={theme.disabled}
                                                     value={newCategoryName}
                                                     onChangeText={setNewCategoryName}
                                                     maxLength={30}
                                                     returnKeyType="done"
                                                     onSubmitEditing={handleAddNewCategory}
                                                     autoFocus={true}
                                                />
                                                 <TouchableOpacity
                                                    style={[styles.addCategoryConfirmButton, !newCategoryName.trim() && styles.modalButtonDisabled]}
                                                    onPress={handleAddNewCategory}
                                                    disabled={!newCategoryName.trim()}
                                                    accessibilityLabel="Confirm adding category"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} size={fonts.body} color={theme.white} />
                                                </TouchableOpacity>
                                             </View>
                                         )}

                                         {/* Action Buttons */}
                                         <TouchableOpacity
                                             style={[styles.modalSaveButton, (!modalSymbolName.trim() || isSavingModal) && styles.modalButtonDisabled]}
                                             onPress={handleSaveSymbol}
                                             disabled={!modalSymbolName.trim() || isSavingModal}
                                             accessibilityLabel={modalMode === 'add' ? 'Add symbol' : 'Save changes'}
                                            >
                                                {isSavingModal ? (
                                                     <ActivityIndicator size="small" color={theme.white} style={styles.buttonIcon} />
                                                ) : (
                                                     <FontAwesomeIcon icon={faCheck} size={fonts.button} color={theme.white} style={styles.buttonIcon}/>
                                                )}
                                                <Text style={styles.modalButtonText}>{modalMode === 'add' ? 'Add Symbol' : 'Save Changes'}</Text>
                                        </TouchableOpacity>

                                         {/* Remove Image Button (Edit mode only) */}
                                         {modalImageUri && modalMode === 'edit' && (
                                            <TouchableOpacity
                                                style={styles.modalRemoveImageButton}
                                                onPress={() => setModalImageUri(undefined)}
                                                disabled={isSavingModal}
                                                accessibilityLabel="Remove image from symbol"
                                            >
                                                <FontAwesomeIcon icon={faTrash} size={fonts.caption} color={"#dc3545"} style={styles.buttonIcon}/>
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


// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.primary, // Match header
    },
    container: {
        flex: 1,
        backgroundColor: theme.background, // Use theme background
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background, // Use theme background
    },
    loadingText: {
        marginTop: 15,
        fontSize: fonts.body, // Use font size
        fontWeight: '500',
        color: theme.textSecondary, // Use theme secondary text color
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.primary, // Use theme primary
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
        color: theme.white, // Use theme white
        fontSize: fonts.h2, // Use font size
        fontWeight: 'bold',
    },

    // --- List & Section Styles ---
    listContainer: {
        padding: 15,
        paddingBottom: 40,
    },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: theme.card, // Use theme card color
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth, // Subtle border
        borderColor: theme.border, // Use theme border color
        // Shadow adapted for theme
        shadowColor: theme.isDark ? theme.white : theme.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.isDark ? 0.15 : 0.1,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden', // Keep shadows contained
    },
    folderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border, // Use theme border
        backgroundColor: theme.isDark ? theme.card : theme.background, // Slightly different bg for header if needed
    },
    chevronIcon: {
        marginRight: 10,
        width: fonts.caption,
    },
    folderIcon: {
        marginRight: 10,
        color: theme.textSecondary, // Use theme secondary text
    },
    folderName: {
        flex: 1,
        fontSize: fonts.h2 * 0.9, // Use font size
        fontWeight: '600',
        color: theme.text, // Use theme text color
    },
    folderCount: {
        fontSize: fonts.caption, // Use font size
        color: theme.textSecondary, // Use theme secondary text
        marginLeft: 8,
    },
    symbolsGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingTop: 10,
        paddingBottom: 5,
        paddingHorizontal: 10,
        justifyContent: 'flex-start', // Align items to start
    },
    emptyFolderText: {
        paddingVertical: 20,
        textAlign: 'center',
        color: theme.textSecondary, // Use theme secondary text
        fontStyle: 'italic',
        width: '100%',
        fontSize: fonts.body, // Use font size
    },

    // --- Symbol Item Styles (Inside Folder) ---
    symbolItemContainer_InSection: {
        margin: 4, // Keep margin
    },
    symbolCard: {
        aspectRatio: 1, // Keep square
        backgroundColor: theme.card, // Use theme card color
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border, // Use theme border color
        overflow: 'hidden',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    symbolImageWrapper: {
        width: '100%',
        flex: 1,
        backgroundColor: theme.background, // Use theme background for image area
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8%', // Relative padding
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
        width: '100%',
        paddingHorizontal: 6,
        paddingVertical: 5,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border, // Use theme border color
        minHeight: 40, // Keep min height
        backgroundColor: theme.card, // Ensure info bg matches card
    },
    symbolName: {
        fontSize: fonts.caption, // Use font size
        fontWeight: '500',
        color: theme.text, // Use theme text color
        textAlign: 'center',
        marginBottom: 4,
    },
    symbolActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    actionButton: {
        padding: 5,
    },

    // --- Empty State for the whole list ---
    emptyContainer: {
        flex: 1,
        minHeight: Dimensions.get('window').height * 0.6,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        fontSize: fonts.h2, // Use font size
        fontWeight: '600',
        color: theme.textSecondary, // Use theme secondary text
        marginTop: 15,
        textAlign: 'center'
    },
    emptySubText: {
        fontSize: fonts.body, // Use font size
        color: theme.disabled, // Use theme disabled color
        marginTop: 8,
        textAlign: 'center'
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.6)', // Adapt overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        backgroundColor: theme.card, // Use theme card color
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.border, // Use theme border color
        position: 'relative',
        backgroundColor: theme.background, // Slightly different header bg
    },
    modalTitleText: {
        fontSize: fonts.h2, // Use font size
        fontWeight: 'bold',
        color: theme.text, // Use theme text color
    },
    modalCloseButton: {
        position: 'absolute',
        right: 10,
        top: 10, // Adjust position based on padding
        padding: 8
    },
    modalBody: {
        padding: 20,
        paddingBottom: 30
    },
    modalLabel: {
        fontSize: fonts.label, // Use font size
        fontWeight: '600',
        color: theme.textSecondary, // Use theme secondary text
        marginBottom: 6,
        marginTop: 15
    },
    modalImagePicker: {
        width: '100%',
        aspectRatio: 1.5,
        backgroundColor: theme.background, // Use theme background
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1.5,
        borderColor: theme.border, // Use theme border
        borderStyle: 'dashed',
        overflow: 'hidden'
    },
    modalPickedImage: {
        width: '100%',
        height: '100%'
    },
    modalImagePlaceholder: {
        alignItems: 'center'
    },
    modalImagePickerText: {
        color: theme.textSecondary, // Use theme secondary text
        fontWeight: '500',
        marginTop: 8,
        fontSize: fonts.caption // Use font size
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.isDark ? '#5e5300' : '#fff3cd', // Adapt warning bg
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: theme.isDark ? '#b38f00' : '#ffeeba', // Adapt warning border
    },
    warningIcon: {
        marginRight: 8,
    },
    warningText: {
        flex: 1,
        fontSize: fonts.caption, // Use font size
        color: theme.isDark ? '#f0e68c' : '#856404', // Adapt warning text color
    },
    modalInput: {
        backgroundColor: theme.background, // Use theme background for input
        height: 48,
        borderColor: theme.border, // Use theme border
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        fontSize: fonts.body, // Use font size
        color: theme.text, // Use theme text color
    },
    modalSaveButton: {
        backgroundColor: theme.primary, // Use theme primary
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    modalButtonText: {
        color: theme.white, // Use theme white
        fontWeight: 'bold',
        fontSize: fonts.button, // Use font size
    },
    modalRemoveImageButton: {
        backgroundColor: theme.card, // Use theme card
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        borderWidth: 1,
        borderColor: "#dc3545" // Keep error color distinct
    },
    modalRemoveImageButtonText: {
        color: "#dc3545", // Keep error color distinct
        fontWeight: '600',
        fontSize: fonts.label, // Use font size
    },
    modalButtonDisabled: {
        backgroundColor: theme.disabled, // Use theme disabled color
        opacity: 0.7
    },
    buttonIcon: {
        marginRight: 8
    },
    // --- Category Picker Styles ---
    categorySelectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    pickerWrapper: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: theme.border, // Use theme border
        borderRadius: 8,
        marginRight: 10,
        justifyContent: 'center',
        backgroundColor: theme.background, // Use theme background
    },
    picker: {
        height: Platform.OS === 'ios' ? undefined : 50,
        color: theme.text, // Use theme text color
    },
    pickerItem: {
        // iOS specific styling for items in the picker dropdown
        fontSize: fonts.body, // Use font size
        color: theme.text, // Use theme text color (might need adjustment based on iOS picker behavior)
        // backgroundColor: theme.card, // Optional: background for picker items
    },
    addCategoryButton: {
        padding: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border, // Use theme border
        borderRadius: 8,
        backgroundColor: theme.card, // Use theme card color
    },
    addCategoryButtonActive: {
        backgroundColor: theme.primaryMuted, // Indicate active state
    },
    addCategoryInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 15,
    },
    addCategoryInput: {
        flex: 1,
        height: 44,
        borderColor: theme.border, // Use theme border
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        fontSize: fonts.body, // Use font size
        backgroundColor: theme.background, // Use theme background
        color: theme.text, // Use theme text
    },
    addCategoryConfirmButton: {
        backgroundColor: theme.primary, // Use theme primary
        padding: 10,
        height: 44,
        width: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomPageComponent;