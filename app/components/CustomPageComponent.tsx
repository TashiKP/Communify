// src/components/customPage/CustomPageComponent.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, StyleSheet, Modal, SafeAreaView, Alert, FlatList,
    Dimensions, ActivityIndicator, Text // For initial loading text
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { GridLayoutType, useGrid } from '../context/GridContext';
import { useAppearance } from '../context/AppearanceContext';
import { CategoryItem, GridSection, SymbolItem } from './CustomPage/types';
import { CATEGORY_STORAGE_KEY, SYMBOLS_STORAGE_KEY } from './CustomPage/constants';
import SymbolModal, { SymbolModalData } from './CustomPage/SymbolModal';
import CategorySection from './CustomPage/CategorySection';
import { getLanguageSpecificTextStyle } from '../styles/typography';
import CustomPageHeader from './CustomPage/CustomPageHeader';
import PageLoadingIndicator from './CustomPage/PageLoadingIndicator';
import EmptyCustomSymbols from './CustomPage/EmptyCustomSymbols';


const screenWidth = Dimensions.get('window').width;
const getNumColumns = (layout: GridLayoutType): number => {
    switch (layout) {
        case 'simple': return 4;
        case 'standard': return 5;
        case 'dense': return 7;
        default: return 5;
    }
};
const calculateItemWidth = (layout: GridLayoutType, numCols: number): number => {
    const gridPadding = 16; // This is page container padding
    const itemMargin = 6; // Margin around each SymbolGridItem
    // The paddingHorizontal for symbolsGridContainer is 12, so total horizontal space for items is screenWidth - (pagePadding*2) - (gridContainerPadding*2)
    // Let's assume itemWidth calculation considers the direct container's width.
    // Original calculation was: (screenWidth - (gridPadding * 2) - (itemMargin * 2 * numCols)) / numCols
    // The gridPadding here means the padding of the overall CustomPageComponent container.
    // The symbolsGridContainer itself has padding of 12 on each side.
    // Effective width for items area = screenWidth - (16*2 for page) - (12*2 for section grid)
    // This seems to be for items directly in page container, not nested.
    // The current itemWidth calculation looks okay if it's for items within the symbolsGridContainer
    // that has its own padding.
    // Let's stick to the original calculation for now, assuming it targets the symbol card within its direct parent.
    // The parent of SymbolGridItem is symbolsGridContainer which has padding.
    // (availableWidth - (itemMargin * 2 * numCols)) / numCols
    // availableWidth = screenWidth - (pagePadding * 2) - (sectionGridPadding *2)
    const sectionGridPadding = 12; // From CategorySection styles.symbolsGridContainer.paddingHorizontal
    const availableWidthForGrid = screenWidth - (gridPadding * 2) - (sectionGridPadding * 2);
    return Math.max(80, Math.floor((availableWidthForGrid - (itemMargin * 2 * numCols)) / numCols));
};


interface CustomPageComponentProps {
    onBackPress: () => void;
    onSymbolsUpdate?: (symbols: SymbolItem[]) => void;
}

const CustomPageComponent: React.FC<CustomPageComponentProps> = ({ onBackPress, onSymbolsUpdate }) => {
    const { gridLayout, isLoadingLayout: isLoadingGridLayout } = useGrid();
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();

    const [symbols, setSymbols] = useState<SymbolItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingSymbol, setEditingSymbol] = useState<SymbolItem | null>(null);
    const [isDeletingSymbolId, setIsDeletingSymbolId] = useState<string | null>(null);
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
    
    const initialLoadComplete = useRef({ symbols: false, categories: false }).current;
    const isMountedRef = useRef(true);

    const numInternalColumns = useMemo(() => getNumColumns(gridLayout), [gridLayout]);
    const itemWidth = useMemo(() => calculateItemWidth(gridLayout, numInternalColumns), [gridLayout, numInternalColumns]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Load Symbols
    useEffect(() => {
        let isMounted = true;
        const loadSymbols = async () => {
            if (!isMounted) return;
            setIsLoadingSymbols(true);
            initialLoadComplete.symbols = false;
            try {
                const jsonValue = await AsyncStorage.getItem(SYMBOLS_STORAGE_KEY);
                if (isMounted) {
                    const loaded = jsonValue !== null ? JSON.parse(jsonValue) : [];
                    setSymbols(Array.isArray(loaded) ? loaded : []);
                }
            } catch (e) {
                console.error('CustomPage: Failed load symbols', e);
                if (isMounted) setSymbols([]);
            } finally {
                if (isMounted) {
                    setIsLoadingSymbols(false);
                    requestAnimationFrame(() => { initialLoadComplete.symbols = true; });
                }
            }
        };
        loadSymbols();
        return () => { isMounted = false; };
    }, [initialLoadComplete]);

    // Load Categories
    useEffect(() => {
        let isMounted = true;
        const loadCategories = async () => {
            if (!isMounted) return;
            setIsLoadingCategories(true);
            initialLoadComplete.categories = false;
            try {
                const jsonValue = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
                if (isMounted) {
                    const loadedCategories = jsonValue !== null ? JSON.parse(jsonValue) : [];
                    const validCategories = Array.isArray(loadedCategories) ? loadedCategories : [];
                    setCategories(validCategories);
                    
                    const initialExpanded: { [key: string]: boolean } = { 'null': true }; // Uncategorized expanded by default
                    validCategories.forEach(cat => initialExpanded[cat.id] = true); // Expand all loaded categories by default
                    setExpandedCategories(initialExpanded);
                }
            } catch (e) {
                console.error('CustomPage: Failed load categories', e);
                if (isMounted) {
                    setCategories([]);
                    setExpandedCategories({ 'null': true });
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCategories(false);
                    requestAnimationFrame(() => { initialLoadComplete.categories = true; });
                }
            }
        };
        loadCategories();
        return () => { isMounted = false; };
    }, [initialLoadComplete]);

    // Save Symbols
    useEffect(() => {
        if (!initialLoadComplete.symbols || isLoadingSymbols) return;
        const save = async () => {
            try {
                await AsyncStorage.setItem(SYMBOLS_STORAGE_KEY, JSON.stringify(symbols));
                if (onSymbolsUpdate) onSymbolsUpdate(symbols);
            } catch (e) {
                console.error('CustomPage: Failed save symbols', e);
                Alert.alert(t('common.error'), t('customPage.errors.saveSymbolsFail'));
            }
        };
        const timerId = setTimeout(save, 500);
        return () => clearTimeout(timerId);
    }, [symbols, onSymbolsUpdate, isLoadingSymbols, initialLoadComplete.symbols, t]);

    // Save Categories
    useEffect(() => {
        if (!initialLoadComplete.categories || isLoadingCategories) return;
        const save = async () => {
            try {
                await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
            } catch (e) {
                console.error('CustomPage: Failed save categories', e);
                Alert.alert(t('common.error'), t('customPage.errors.saveCategoriesFail'));
            }
        };
        const timerId = setTimeout(save, 500);
        return () => clearTimeout(timerId);
    }, [categories, isLoadingCategories, initialLoadComplete.categories, t]);

    const sectionedListData = useMemo(() => {
        const groupedSymbols = new Map<string | null, SymbolItem[]>();
        symbols.forEach(symbol => {
            const key = symbol.categoryId ?? null;
            if (!groupedSymbols.has(key)) groupedSymbols.set(key, []);
            groupedSymbols.get(key)?.push(symbol);
        });
        groupedSymbols.forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));

        const sections: GridSection[] = [];
        const uncategorizedSymbols = groupedSymbols.get(null);
        const uncategorizedLabel = t('customPage.uncategorizedCategoryLabel');

        // Add Uncategorized section first if it has symbols or if no categories exist yet
        if ((uncategorizedSymbols && uncategorizedSymbols.length > 0) || categories.length === 0) {
             sections.push({ id: null, name: uncategorizedLabel, symbols: uncategorizedSymbols || [] });
        }
        groupedSymbols.delete(null); // Remove so it's not processed again

        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
        sortedCategories.forEach(category => {
            sections.push({ id: category.id, name: category.name, symbols: groupedSymbols.get(category.id) || [] });
        });
        
        // Ensure new sections are expanded by default
        setExpandedCategories(prevExpanded => {
            const newExpandedState = {...prevExpanded};
            let stateChanged = false;
            sections.forEach(sec => {
                const key = String(sec.id);
                if (!(key in newExpandedState)) {
                    newExpandedState[key] = true; // Default new sections to expanded
                    stateChanged = true;
                }
            });
            return stateChanged ? newExpandedState : prevExpanded;
        });

        return sections;
    }, [symbols, categories, t]);

    const toggleCategoryExpansion = useCallback((categoryId: string | null) => {
        const key = String(categoryId);
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const openSymbolModal = (mode: 'add' | 'edit', symbol?: SymbolItem) => {
        setModalMode(mode);
        setEditingSymbol(symbol || null);
        setIsModalVisible(true);
    };

    const closeSymbolModal = useCallback(() => {
        setIsModalVisible(false);
        // Reset modal related state after a short delay for modal closing animation
        setTimeout(() => {
            if (isMountedRef.current) {
                setEditingSymbol(null);
                // Modal internal states are reset by SymbolModal's useEffect [isVisible]
            }
        }, 300);
    }, []);

    const handleAddNewCategoryInModal = useCallback((name: string): CategoryItem | null => {
        const trimmedName = name.trim();
        // Duplication check is done in modal, but good to double check or rely on modal
        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
             Alert.alert(t('customPage.errors.duplicateCategoryTitle'), t('customPage.errors.duplicateCategoryMessage'));
             return null;
        }
        const newCategory: CategoryItem = { id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, name: trimmedName };
        setCategories(prev => [...prev, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
        Alert.alert(t('customPage.categoryAddedTitle'), t('customPage.categoryAddedMessage', { name: trimmedName }));
        return newCategory;
    }, [categories, t]);

    const handleSaveSymbolFromModal = useCallback((data: SymbolModalData, originalSymbolId?: string) => {
        if (modalMode === 'edit' && originalSymbolId) {
            setSymbols(prev => prev.map(s => s.id === originalSymbolId ? { ...s, ...data } : s));
        } else {
            const newSymbol: SymbolItem = { 
                id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, 
                ...data 
            };
            setSymbols(prev => [newSymbol, ...prev]);
        }
        closeSymbolModal();
    }, [modalMode, closeSymbolModal]);

    const handleDeleteSymbolPress = (symbol: SymbolItem) => {
        Alert.alert(
            t('customPage.deleteConfirmTitle'),
            t('customPage.deleteConfirmMessage', { name: symbol.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => confirmDeleteSymbol(symbol.id) },
            ]
        );
    };

    const confirmDeleteSymbol = (symbolId: string) => {
        if (!isMountedRef.current) return;
        setIsDeletingSymbolId(symbolId);
        setTimeout(() => { // Simulate deletion delay / allow UI update
            if (isMountedRef.current) {
                setSymbols(prev => prev.filter(s => s.id !== symbolId));
                setIsDeletingSymbolId(null);
            }
        }, 300);
    };
    
    const renderSectionItem = ({ item: section }: { item: GridSection }) => {
        return (
            <CategorySection
                section={section}
                isExpanded={expandedCategories[String(section.id)] ?? false}
                onToggleExpansion={toggleCategoryExpansion}
                onEditSymbol={(symbol: SymbolItem | undefined) => openSymbolModal('edit', symbol)}
                onDeleteSymbol={handleDeleteSymbolPress}
                deletingSymbolId={isDeletingSymbolId}
                itemWidth={itemWidth}
                theme={theme}
                fonts={fonts}
            />
        );
    };

    const isLoadingPage = isLoadingSymbols || isLoadingCategories || isLoadingGridLayout || isLoadingAppearance;

    // Styles for CustomPageComponent itself (minimal, mostly for layout)
    const styles = useMemo(() => StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        pageContent: { // Was 'container' in original styles, renamed to avoid conflict
            flex: 1,
            padding: 16, // Page padding
        },
        listContainer: {
            paddingVertical: 12, // Padding for FlatList content
            paddingBottom: 48, // Ensure space at bottom
        },
         // For initial i18n loading
        initialLoadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
        },
        initialLoadingText: {
            ...getLanguageSpecificTextStyle('body', fonts, i18n.language),
            marginTop: 12,
            color: theme.text,
        }
    }), [theme, fonts, i18n.language]);


    if (!i18n.isInitialized || typeof t !== 'function') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.initialLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary || '#007bff'} />
                    <Text style={styles.initialLoadingText}>Loading Interface...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <CustomPageHeader
                    onBackPress={onBackPress}
                    onAddPress={() => openSymbolModal('add')}
                    title={t('customPage.title')}
                    isLoading={isLoadingPage}
                    theme={theme}
                    fonts={fonts}
                />
                <View style={styles.pageContent}>
                    {isLoadingPage ? (
                        <PageLoadingIndicator
                            message={t('customPage.loadingSymbols')}
                            theme={theme}
                            fonts={fonts}
                        />
                    ) : (
                        <FlatList
                            data={sectionedListData}
                            renderItem={renderSectionItem}
                            keyExtractor={(item) => String(item.id) ?? 'uncategorized-section'}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                <EmptyCustomSymbols theme={theme} fonts={fonts} />
                            }
                            extraData={`${gridLayout}-${categories.length}-${symbols.length}-${JSON.stringify(expandedCategories)}-${i18n.language}-${itemWidth}-${isDeletingSymbolId}`}
                        />
                    )}
                </View>

                {isModalVisible && ( // Conditionally render modal to ensure fresh state if preferred over useEffect updates
                    <SymbolModal
                        isVisible={isModalVisible}
                        mode={modalMode}
                        editingSymbol={editingSymbol}
                        categories={categories}
                        onClose={closeSymbolModal}
                        onSave={handleSaveSymbolFromModal}
                        onAddNewCategory={handleAddNewCategoryInModal}
                        theme={theme}
                        fonts={fonts}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default CustomPageComponent;