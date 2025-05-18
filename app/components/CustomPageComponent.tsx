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
import { useTranslation } from 'react-i18next';

import { useGrid, GridLayoutType } from '../context/GridContext';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';

const SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';
const CATEGORY_STORAGE_KEY = '@Communify:customCategories';

const screenWidth = Dimensions.get('window').width;
const getNumColumns = (layout: GridLayoutType): number => { switch (layout) { case 'simple': return 4; case 'standard': return 5; case 'dense': return 7; default: return 5; } };
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const gridPadding = 16;
    const itemMargin = 6;
    return Math.max(80, Math.floor((screenWidth - (gridPadding * 2) - (itemMargin * 2 * numCols)) / numCols));
};

interface CustomPageComponentProps {
    onBackPress: () => void;
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void;
}

interface SymbolItem { id: string; name: string; imageUri?: string; categoryId?: string | null; }
interface CategoryItem { id: string; name: string; }
interface GridSection { id: string | null; name: string; symbols: SymbolItem[]; }

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();

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
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
    const initialLoadComplete = useRef({ symbols: false, categories: false }).current;
    const isMountedRef = useRef(true);

    const numInternalColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numInternalColumns), [gridLayout, numInternalColumns]);

    useEffect(() => {
        isMountedRef.current = true;
        console.log('CustomPageComponent: Mounted. typeof t =', typeof t, 'i18n initialized:', i18n.isInitialized);
        return () => { isMountedRef.current = false; };
    }, [t, i18n.isInitialized]);

    useEffect(() => {
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

    useEffect(() => {
        let isMounted = true;
        const loadCategories = async () => {
            if (!isMounted) return; setIsLoadingCategories(true); initialLoadComplete.categories = false;
            try {
                const jsonValue = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
                if (isMounted) {
                    const loaded = jsonValue !== null ? JSON.parse(jsonValue) : [];
                    if (Array.isArray(loaded)) {
                        setCategories(loaded);
                        const initialExpanded: { [key: string]: boolean } = {};
                        loaded.forEach(cat => initialExpanded[cat.id] = true);
                        initialExpanded['null'] = true;
                        setExpandedCategories(initialExpanded);
                    } else {
                        setCategories([]);
                        setExpandedCategories({'null': true});
                    }
                }
            } catch (e) { console.error('CustomPage: Failed load categories', e); if (isMounted) { setCategories([]); setExpandedCategories({'null': true}); } }
            finally { if (isMounted) { setIsLoadingCategories(false); requestAnimationFrame(() => { initialLoadComplete.categories = true; }); } }
        };
        loadCategories(); return () => { isMounted = false; }
     }, []);

    useEffect(() => {
        if (!initialLoadComplete.symbols || isLoadingSymbols) return;
        const saveSymbols = async () => {
            try { await AsyncStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(symbols)); if (onSymbolsUpdate) onSymbolsUpdate(symbols); }
            catch (e) { console.error('CustomPage: Failed save symbols', e); Alert.alert(t('common.error'), t('customPage.errors.saveSymbolsFail')); }
        };
        const timerId = setTimeout(saveSymbols, 500);
        return () => clearTimeout(timerId);
     }, [symbols, onSymbolsUpdate, isLoadingSymbols, t]);

    useEffect(() => {
        if (!initialLoadComplete.categories || isLoadingCategories) return;
        const saveCategories = async () => {
            try { await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories)); }
            catch (e) { console.error('CustomPage: Failed save categories', e); Alert.alert(t('common.error'), t('customPage.errors.saveCategoriesFail')); }
        };
        const timerId = setTimeout(saveCategories, 500);
        return () => clearTimeout(timerId);
     }, [categories, isLoadingCategories, t]);

    const sectionedListData = useMemo(() => {
        const groupedSymbols = new Map<string | null, SymbolItem[]>();
        symbols.forEach(symbol => { const key = symbol.categoryId ?? null; if (!groupedSymbols.has(key)) groupedSymbols.set(key, []); groupedSymbols.get(key)?.push(symbol); });
        groupedSymbols.forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));

        const sections: GridSection[] = [];
        const uncategorizedSymbols = groupedSymbols.get(null);
        const uncategorizedLabel = t('customPage.uncategorizedCategoryLabel');

        if (uncategorizedSymbols && uncategorizedSymbols.length > 0) {
            sections.push({ id: null, name: uncategorizedLabel, symbols: uncategorizedSymbols });
            groupedSymbols.delete(null);
        } else if (categories.length === 0 && (uncategorizedSymbols || symbols.length === 0)) {
             sections.push({ id: null, name: uncategorizedLabel, symbols: [] });
             groupedSymbols.delete(null);
        }

        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
        sortedCategories.forEach(category => {
            sections.push({ id: category.id, name: category.name, symbols: groupedSymbols.get(category.id) || [] });
        });

        setExpandedCategories(prevExpanded => {
            const currentKeys = new Set(Object.keys(prevExpanded));
            const newExpandedState = {...prevExpanded};
            let stateChanged = false;
            sections.forEach(sec => { const key = String(sec.id); if (!currentKeys.has(key)) { newExpandedState[key] = true; stateChanged = true; }});
            return stateChanged ? newExpandedState : prevExpanded;
        });
        return sections;
    }, [symbols, categories, t]);

    const toggleCategoryExpansion = useCallback((categoryId: string | null) => {
        const key = String(categoryId);
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const openModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => {
        setModalMode(mode); setShowAddCategoryInput(false); setNewCategoryName('');
        if (mode === 'edit' && symbol) {
            setEditingSymbol(symbol); setModalSymbolName(symbol.name);
            setModalImageUri(symbol.imageUri);
            setModalSelectedCategoryId(symbol.categoryId === null ? null : symbol.categoryId);
        } else {
            setEditingSymbol(null); setModalSymbolName('');
            setModalImageUri(undefined); setModalSelectedCategoryId(null);
        }
        setIsModalVisible(true);
     };

    const closeModal = () => {
        setIsModalVisible(false);
        setTimeout(() => {
            if(isMountedRef.current) {
                setEditingSymbol(null); setModalSymbolName(''); setModalImageUri(undefined);
                setModalSelectedCategoryId(undefined); setIsSavingModal(false);
                setShowAddCategoryInput(false); setNewCategoryName('');
            }
        }, 300);
    };

    const pickImage = () => {
        const options: ImageLibraryOptions = { mediaType: 'photo', quality: 0.7, selectionLimit: 1 };
        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) { return; }
            if (response.errorCode) { console.error('ImagePicker Error: ', response.errorMessage); Alert.alert(t('common.error'), response.errorMessage || t('customPage.errors.imageSelectFail')); return; }
            if (response.assets && response.assets[0]?.uri) {
                setModalImageUri(response.assets[0].uri);
            }
        });
     };

    const handleAddNewCategory = () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) { Alert.alert(t('customPage.errors.invalidCategoryNameTitle'), t('customPage.errors.invalidCategoryNameMessage')); return; }
        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) { Alert.alert(t('customPage.errors.duplicateCategoryTitle'), t('customPage.errors.duplicateCategoryMessage')); return; }
        Keyboard.dismiss();
        const newCategory: CategoryItem = { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, name: trimmedName };
        setCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
        setModalSelectedCategoryId(newCategory.id);
        setNewCategoryName(''); setShowAddCategoryInput(false);
        Alert.alert(t('customPage.categoryAddedTitle'), t('customPage.categoryAddedMessage', { name: trimmedName }));
     };

    const handleSaveSymbol = () => {
        const name = modalSymbolName.trim();
        if (!name) { Alert.alert(t('customPage.errors.validationErrorTitle'), t('customPage.errors.symbolNameRequired')); return; }
        setIsSavingModal(true); Keyboard.dismiss();
        setTimeout(() => {
            if(!isMountedRef.current) { setIsSavingModal(false); return; }
            const symbolData = { name, imageUri: modalImageUri, categoryId: modalSelectedCategoryId === undefined ? null : modalSelectedCategoryId, };
            if (modalMode === 'edit' && editingSymbol) {
                setSymbols(prev => prev.map(s => s.id === editingSymbol.id ? { ...s, ...symbolData } : s));
            } else {
                const newSymbol: SymbolItem = { id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, ...symbolData };
                setSymbols(prev => [newSymbol, ...prev]);
            }
            closeModal();
        }, 100);
    };

    const handleDeletePress = (symbol: SymbolItem) => {
        Alert.alert(t('customPage.deleteConfirmTitle'), t('customPage.deleteConfirmMessage', { name: symbol.name }),
            [ { text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => confirmDelete(symbol.id) }, ]
        );
     };

    const confirmDelete = (symbolId: string) => {
        if(!isMountedRef.current) return;
        setIsDeleting(symbolId);
        setTimeout(() => {
            if(isMountedRef.current) {
                setSymbols(prev => prev.filter(s => s.id !== symbolId));
                setIsDeleting(null);
            }
        }, 300);
    };

    const renderSection = ({ item: section }: { item: GridSection }) => {
        const sectionKey = String(section.id);
        const isExpanded = expandedCategories[sectionKey] ?? false;
        const sectionName = section.id === null ? t('customPage.uncategorizedCategoryLabel') : section.name;
        const accessibilityLabel = t('customPage.categoryAccessibilityLabel', { name: sectionName, count: section.symbols.length, state: isExpanded ? t('common.expanded') : t('common.collapsed') });

        return (
            <View style={styles.sectionContainer}>
                <TouchableOpacity style={styles.folderHeader} onPress={() => toggleCategoryExpansion(section.id)} activeOpacity={0.6} accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ expanded: isExpanded }}>
                    <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} size={fonts.caption} color={theme.textSecondary} style={styles.chevronIcon} />
                    <FontAwesomeIcon icon={faFolder} size={fonts.body * 1.2} color={theme.primary} style={styles.folderIcon} />
                    <Text style={[styles.folderName, { color: theme.text }]}>{sectionName}</Text>
                    <Text style={[styles.folderCount, { color: theme.textSecondary }]}>({section.symbols.length})</Text>
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.symbolsGridContainer}>
                        {section.symbols.map(symbol => (
                             <View key={symbol.id} style={styles.symbolItemContainer_InSection}>
                                <View style={[styles.symbolCard, { width: itemWidth }]}>
                                    <View style={styles.symbolImageWrapper}>
                                        {symbol.imageUri ? ( <Image source={{ uri: symbol.imageUri }} style={styles.symbolImage} resizeMode="contain" accessibilityLabel="" onError={(e) => console.warn(`Img Load Error: ${symbol.name}`, e.nativeEvent.error)} /> ) : (
                                            <View style={styles.symbolPlaceholder}> <FontAwesomeIcon icon={faImage} size={itemWidth * 0.35} color={theme.disabled} /> </View>
                                        )}
                                    </View>
                                    <View style={styles.symbolInfo}>
                                        <Text style={[styles.symbolName, { color: theme.text }]} numberOfLines={2} ellipsizeMode="tail">{symbol.name}</Text>
                                        <View style={styles.symbolActions}>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => openModal('edit', symbol)} disabled={!!isDeleting} activeOpacity={0.6} accessibilityLabel={t('customPage.editSymbolAccessibilityLabel', { name: symbol.name })} accessibilityRole="button">
                                                <FontAwesomeIcon icon={faPen} size={fonts.caption * 1.2} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePress(symbol)} disabled={!!isDeleting} activeOpacity={0.6} accessibilityLabel={t('customPage.deleteSymbolAccessibilityLabel', { name: symbol.name })} accessibilityRole="button">
                                                {isDeleting === symbol.id ? ( <ActivityIndicator size="small" color={theme.primary} /> ) : ( <FontAwesomeIcon icon={faTrash} size={fonts.caption * 1.2} color={theme.error} /> )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                         {section.symbols.length === 0 && (<Text style={[styles.emptyFolderText, { color: theme.textSecondary }]}>{t('customPage.emptyFolderText')}</Text>)}
                    </View>
                )}
            </View>
        );
    };

    const isLoading = isLoadingSymbols || isLoadingCategories || isLoadingGridLayout || isLoadingAppearance;

    const styles = useMemo(() => createThemedStyles(theme, fonts, i18n.language), [theme, fonts, i18n.language]);

    if (!i18n.isInitialized || typeof t !== 'function') {
        console.log("CustomPageComponent: Rendering loading state because 't' function is not ready.");
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                    <ActivityIndicator size="large" color={theme.primary || '#007bff'} />
                    <Text style={[{color: theme.text || '#1a1d21'}, styles.loadingText]}>Loading Interface...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={onBackPress} hitSlop={hitSlop} activeOpacity={0.6} accessibilityLabel={t('common.goBack')} accessibilityRole="button">
                        <FontAwesomeIcon icon={faArrowLeft} size={fonts.body * 1.2} color={theme.white} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.white }]}>{t('customPage.title')}</Text>
                    <TouchableOpacity onPress={() => openModal('add')} hitSlop={hitSlop} disabled={isLoading} activeOpacity={0.6} accessibilityLabel={t('customPage.addSymbolAccessibilityLabel')} accessibilityRole="button">
                        <FontAwesomeIcon icon={faPlus} size={fonts.body * 1.2} color={isLoading ? theme.disabled : theme.white} />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('customPage.loadingSymbols')}</Text>
                    </View>
                 ) : (
                    <FlatList
                        data={sectionedListData}
                        renderItem={renderSection}
                        keyExtractor={(item) => String(item.id) ?? 'uncategorized-section'}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <FontAwesomeIcon icon={faThLarge} size={48} color={theme.disabled} />
                                <Text style={[styles.emptyText, { color: theme.text }]}>{t('customPage.noSymbolsTitle')}</Text>
                                <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>{t('customPage.noSymbolsSubtitle')}</Text>
                            </View>
                        }
                        extraData={`${gridLayout}-${categories.length}-${symbols.length}-${JSON.stringify(expandedCategories)}-${i18n.language}`}
                    />
                )}

                <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeModal}>
                   <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                         <View style={styles.modalOverlay}>
                             <TouchableWithoutFeedback accessible={false}>
                                 <View style={styles.modalContent}>
                                     <View style={styles.modalHeader}>
                                         <Text style={[styles.modalTitleText, { color: theme.text }]}>{modalMode === 'add' ? t('customPage.modal.addTitle') : t('customPage.modal.editTitle')}</Text>
                                         <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} activeOpacity={0.6} accessibilityLabel={t('customPage.modal.closeAccessibilityLabel')} accessibilityRole="button">
                                             <FontAwesomeIcon icon={faTimes} size={fonts.body * 1.2} color={theme.textSecondary} />
                                         </TouchableOpacity>
                                     </View>
                                     <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                                        <Text style={[styles.modalLabel, { color: theme.text }]}>{t('customPage.modal.imageLabel')}</Text>
                                        <TouchableOpacity style={styles.modalImagePicker} onPress={pickImage} activeOpacity={0.6} accessibilityLabel={t('customPage.modal.chooseImageButton')} accessibilityRole="button">
                                            {modalImageUri ? ( <Image source={{ uri: modalImageUri }} style={styles.modalPickedImage} accessibilityLabel=""/> ) : (
                                                <View style={styles.modalImagePlaceholder}>
                                                    <FontAwesomeIcon icon={faImage} size={fonts.h1 * 1.3} color={theme.disabled}/>
                                                    <Text style={[styles.modalImagePickerText, { color: theme.textSecondary }]}>{t('customPage.modal.chooseImageButton')}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {modalImageUri && Platform.OS !== 'web' && !modalImageUri.startsWith('file://') && (
                                            <View style={styles.warningBox}>
                                                <FontAwesomeIcon icon={faExclamationTriangle} size={fonts.caption} color={theme.error} style={styles.warningIcon}/>
                                                <Text style={[styles.warningText, { color: theme.text }]}>{t('customPage.modal.imageWarning')}</Text>
                                            </View>
                                        )}

                                        <Text style={[styles.modalLabel, { color: theme.text }]}>{t('customPage.modal.nameLabel')}</Text>
                                        <TextInput
                                            placeholder={t('customPage.modal.namePlaceholder')}
                                            placeholderTextColor={theme.textSecondary} value={modalSymbolName}
                                            onChangeText={setModalSymbolName} style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} autoCapitalize="words"
                                            accessibilityLabel={t('customPage.modal.nameInputAccessibilityLabel')}
                                        />

                                         <Text style={[styles.modalLabel, { color: theme.text }]}>{t('customPage.modal.categoryLabel')}</Text>
                                         <View style={styles.categorySelectionContainer}>
                                             <View style={[styles.pickerWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                                <Picker
                                                    selectedValue={modalSelectedCategoryId}
                                                    onValueChange={(itemValue) => setModalSelectedCategoryId(itemValue)}
                                                    style={styles.picker} itemStyle={[styles.pickerItem, { color: theme.text }]} mode="dropdown"
                                                    enabled={!showAddCategoryInput} dropdownIconColor={theme.textSecondary}
                                                >
                                                     <Picker.Item label={t('customPage.uncategorizedCategoryLabel')} value={null} color={theme.text} />
                                                     {categories.map(cat => ( <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={theme.text}/> ))}
                                                 </Picker>
                                              </View>
                                             <TouchableOpacity
                                                 style={[styles.addCategoryButton, showAddCategoryInput && styles.addCategoryButtonActive, { borderColor: theme.border, backgroundColor: showAddCategoryInput ? theme.primaryMuted : theme.card }]}
                                                 onPress={() => setShowAddCategoryInput(prev => !prev)}
                                                 activeOpacity={0.6}
                                                 accessibilityLabel={showAddCategoryInput ? t('customPage.modal.cancelAddCategory') : t('customPage.modal.addNewCategory')}
                                                 accessibilityRole="button"
                                            >
                                                  <FontAwesomeIcon icon={showAddCategoryInput ? faTimes : faFolderPlus} size={fonts.body * 1.2} color={theme.primary} />
                                             </TouchableOpacity>
                                         </View>

                                         {showAddCategoryInput && (
                                             <View style={styles.addCategoryInputContainer}>
                                                 <TextInput
                                                     style={[styles.addCategoryInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                                     placeholder={t('customPage.modal.newCategoryPlaceholder')}
                                                     placeholderTextColor={theme.textSecondary} value={newCategoryName}
                                                     onChangeText={setNewCategoryName} maxLength={30} returnKeyType="done"
                                                     onSubmitEditing={handleAddNewCategory} autoFocus={true}
                                                     accessibilityLabel={t('customPage.modal.newCategoryInputAccessibilityLabel')}
                                                />
                                                 <TouchableOpacity style={[styles.addCategoryConfirmButton, !newCategoryName.trim() && styles.modalButtonDisabled, { backgroundColor: newCategoryName.trim() ? theme.primary : theme.disabled }]} onPress={handleAddNewCategory} disabled={!newCategoryName.trim()} activeOpacity={0.6} accessibilityLabel={t('customPage.modal.confirmAddCategory')} accessibilityRole="button">
                                                    <FontAwesomeIcon icon={faCheck} size={fonts.body * 1.2} color={theme.white} />
                                                </TouchableOpacity>
                                             </View>
                                         )}

                                         <TouchableOpacity
                                             style={[styles.modalSaveButton, (!modalSymbolName.trim() || isSavingModal) && styles.modalButtonDisabled, { backgroundColor: (modalSymbolName.trim() && !isSavingModal) ? theme.primary : theme.disabled }]}
                                             onPress={handleSaveSymbol} disabled={!modalSymbolName.trim() || isSavingModal}
                                             activeOpacity={0.6}
                                             accessibilityLabel={modalMode === 'add' ? t('customPage.modal.addSymbolButton') : t('customPage.modal.saveChangesButton')}
                                             accessibilityRole="button"
                                            >
                                                {isSavingModal ? ( <ActivityIndicator size="small" color={theme.white} style={styles.buttonIcon} /> ) : ( <FontAwesomeIcon icon={faCheck} size={fonts.body * 1.2} color={theme.white} style={styles.buttonIcon}/> )}
                                                <Text style={[styles.modalButtonText, { color: theme.white }]}>{modalMode === 'add' ? t('customPage.modal.addSymbolButton') : t('customPage.modal.saveChangesButton')}</Text>
                                        </TouchableOpacity>

                                         {modalImageUri && modalMode === 'edit' && (
                                            <TouchableOpacity style={[styles.modalRemoveImageButton, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setModalImageUri(undefined)} disabled={isSavingModal} activeOpacity={0.6} accessibilityLabel={t('customPage.modal.removeImageButton')} accessibilityRole="button">
                                                <FontAwesomeIcon icon={faTrash} size={fonts.caption * 1.2} color={theme.error} style={styles.buttonIcon}/>
                                                <Text style={[styles.modalRemoveImageButtonText, { color: theme.error }]}>{t('customPage.modal.removeImageButton')}</Text>
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

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);

    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        container: {
            flex: 1,
            backgroundColor: theme.background,
            padding: 16,
        },
        loadingOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
        },
        loadingText: {
            ...bodyStyles,
            fontWeight: '500',
            marginTop: 12,
            textAlign: 'center',
            color: theme.textSecondary,
        },
        headerBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
        },
        headerTitle: {
            ...h2Styles,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: 0.5,
        },
        listContainer: {
            paddingVertical: 12,
            paddingBottom: 48,
        },
        sectionContainer: {
            marginBottom: 16,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        folderHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
            borderRadius: 12,
        },
        chevronIcon: {
            marginRight: 12,
            width: fonts.caption,
        },
        folderIcon: {
            marginRight: 12,
        },
        folderName: {
            ...h2Styles,
            fontWeight: '700',
            flex: 1,
            letterSpacing: 0.3,
        },
        folderCount: {
            ...bodyStyles,
            fontWeight: '500',
            marginLeft: 8,
            opacity: 0.7,
        },
        symbolsGridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingVertical: 12,
            paddingHorizontal: 12,
            justifyContent: 'flex-start',
        },
        emptyFolderText: {
            ...bodyStyles,
            fontWeight: '500',
            fontStyle: 'italic',
            paddingVertical: 16,
            textAlign: 'center',
            width: '100%',
            color: theme.textSecondary,
        },
        symbolItemContainer_InSection: {
            margin: 6,
        },
        symbolCard: {
            aspectRatio: 1,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        symbolImageWrapper: {
            width: '100%',
            flex: 1,
            backgroundColor: theme.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        symbolImage: {
            width: '100%',
            height: '100%',
            borderRadius: 8,
        },
        symbolPlaceholder: {
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: theme.background,
            borderRadius: 8,
        },
        symbolInfo: {
            width: '100%',
            paddingHorizontal: 8,
            paddingVertical: 8,
            minHeight: 48,
            backgroundColor: theme.card,
        },
        symbolName: {
            ...bodyStyles,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 6,
            paddingHorizontal: 4,
        },
        symbolActions: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
        },
        actionButton: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: theme.background,
            minWidth: 40,
            minHeight: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyContainer: {
            flex: 1,
            minHeight: Dimensions.get('window').height * 0.6,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        emptyText: {
            ...h2Styles,
            fontWeight: '700',
            marginTop: 12,
            textAlign: 'center',
            letterSpacing: 0.3,
        },
        emptySubText: {
            ...bodyStyles,
            fontWeight: '500',
            marginTop: 8,
            textAlign: 'center',
            opacity: 0.7,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
        },
        modalContent: {
            width: '100%',
            maxWidth: 400,
            maxHeight: '90%',
            backgroundColor: theme.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 8,
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
        },
        modalTitleText: {
            ...h2Styles,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        modalCloseButton: {
            position: 'absolute',
            right: 12,
            top: 12,
            padding: 8,
            borderRadius: 12,
            backgroundColor: theme.background,
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
        },
        modalBody: {
            padding: 20,
            paddingBottom: 32,
        },
        modalLabel: {
            ...bodyStyles,
            fontWeight: '600',
            marginBottom: 8,
            marginTop: 16,
            color: theme.text,
        },
        modalImagePicker: {
            width: '100%',
            aspectRatio: 1.5,
            backgroundColor: theme.background,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
            borderWidth: 1,
            borderColor: theme.border,
            borderStyle: 'dashed',
            overflow: 'hidden',
        },
        modalPickedImage: {
            width: '100%',
            height: '100%',
            borderRadius: 12,
        },
        modalImagePlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        modalImagePickerText: {
            ...bodyStyles,
            fontWeight: '500',
            marginTop: 8,
            color: theme.textSecondary,
        },
        warningBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.isDark ? '#4a3c00' : '#fef3c7',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.isDark ? '#a68b00' : '#fed7aa',
        },
        warningIcon: {
            marginRight: 8,
        },
        warningText: {
            ...bodyStyles,
            fontWeight: '500',
            flex: 1,
            color: theme.isDark ? '#facc15' : '#92400e',
        },
        modalInput: {
            ...bodyStyles,
            fontWeight: '500',
            minHeight: 48,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 12,
            backgroundColor: theme.background,
        },
        modalSaveButton: {
            borderRadius: 12,
            paddingVertical: 12,
            minHeight: 48,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        modalButtonText: {
            ...bodyStyles,
            fontWeight: '700',
            letterSpacing: 0.3,
        },
        modalRemoveImageButton: {
            borderRadius: 12,
            paddingVertical: 10,
            minHeight: 48,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 12,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        modalRemoveImageButtonText: {
            ...bodyStyles,
            fontWeight: '600',
        },
        modalButtonDisabled: {
            opacity: 0.5,
        },
        buttonIcon: {
            marginRight: 8,
        },
        categorySelectionContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
        },
        pickerWrapper: {
            flex: 1,
            minHeight: 48,
            borderWidth: 1,
            borderRadius: 12,
            justifyContent: 'center',
            backgroundColor: theme.background,
        },
        picker: {
            height: Platform.OS === 'ios' ? undefined : 48,
        },
        pickerItem: {
            ...bodyStyles,
            fontWeight: '500',
            color: theme.text,
        },
        addCategoryButton: {
            padding: 10,
            minHeight: 48,
            minWidth: 48,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderRadius: 12,
            backgroundColor: theme.card,
        },
        addCategoryButtonActive: {
            backgroundColor: theme.primaryMuted,
        },
        addCategoryInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 12,
            gap: 8,
        },
        addCategoryInput: {
            ...bodyStyles,
            fontWeight: '500',
            flex: 1,
            minHeight: 48,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.background,
        },
        addCategoryConfirmButton: {
            borderRadius: 12,
            padding: 10,
            minHeight: 48,
            minWidth: 48,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
    });
};

export default CustomPageComponent;