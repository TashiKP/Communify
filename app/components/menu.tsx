// src/components/menu.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, ScrollView, TouchableOpacity, Animated, Modal, Text, StyleSheet, Platform, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faDesktop, faShapes, faCommentDots, faUserShield, faInfoCircle, faChevronRight, faTimes
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as KeychainService from '../services/keychainService';
import { useTranslation } from 'react-i18next';

import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';

import DisplayOptionsScreen from './DisplayOptionsScreen';
import SelectionModeScreen from './SelectionModeScreen';
import ParentalControls from './ParentalControls';
import apiService, { ParentalSettingsData } from '../services/apiService'; // Import apiService and ParentalSettingsData
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen';
import PasscodePromptModal from './PasscodePromptModal';

type Mode = 'drag' | 'longClick';

const SELECTION_MODE_STORAGE_KEY = '@Communify:selectionMode';
const PARENTAL_SETTINGS_STORAGE_KEY = '@Communify:parentalSettings'; // For caching

const defaultSelectionMode: Mode | null = 'drag';
const defaultParentalSettings: ParentalSettingsData = {
    blockViolence: false,
    blockInappropriate: false,
    dailyLimitHours: '',
    asdLevel: null,
    downtimeEnabled: false,
    downtimeDays: [],
    downtimeStart: '21:00',
    downtimeEnd: '07:00',
    requirePasscode: false,
    notifyEmails: [],
    dataSharingPreference: false,
};

const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.25;
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
}

const Menu: React.FC<MenuProps> = ({
    slideAnim,
    overlayAnim,
    closeMenu,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    
    // parentalSettings is now primarily sourced from API
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    
    const [isLoadingSelection, setIsLoadingSelection] = useState(true);
    const [isLoadingParentalSettings, setIsLoadingParentalSettings] = useState(true); // For fetching parental settings initially
    const [isCheckingPasscodeForMenu, setIsCheckingPasscodeForMenu] = useState(false); // For specific backend check on menu press

    const [isSavingSelection, setIsSavingSelection] = useState(false);
    // isSavingParental (for AsyncStorage cache update)
    const [isUpdatingParentalCache, setIsUpdatingParentalCache] = useState(false); 
    
    const [isPasscodePromptVisible, setIsPasscodePromptVisible] = useState(false);
    const [targetModalId, setTargetModalId] = useState<string | null>(null);
    // passcodeExists can still reflect local keychain for UI hints in ParentalControls,
    // but menu decision uses backend check.
    const [localKeychainPasscodeExists, setLocalKeychainPasscodeExists] = useState(false); 
    const isMountedRef = useRef(true);

    const menuItems = useMemo(() => [
        { id: 'display', icon: faDesktop, labelKey: 'menu.displayOptions' },
        { id: 'selection', icon: faShapes, labelKey: 'menu.symbolSelection' },
        { id: 'voiceover', icon: faCommentDots, labelKey: 'menu.voiceAndSpeech' },
        { id: 'parental', icon: faUserShield, labelKey: 'menu.parentalControls' },
        { id: 'about', icon: faInfoCircle, labelKey: 'menu.aboutUs' },
    ], []);

    // Combined loading state for initial settings
    const isLoadingInitialSettings = isLoadingAppearance || isLoadingSelection || isLoadingParentalSettings;

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const styles = useMemo(() => createThemedMenuStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);

    // Effect to load all necessary initial settings
    useEffect(() => {
        const loadAllMenuData = async () => {
            if (!isMountedRef.current || typeof t !== 'function') return;
            
            setIsLoadingSelection(true);
            setIsLoadingParentalSettings(true);

            try {
                const [selectionJson, fetchedParentalSettings, keychainHasPasscode] = await Promise.all([
                    AsyncStorage.getItem(SELECTION_MODE_STORAGE_KEY),
                    apiService.fetchParentalSettings(), // Fetch parental settings from API
                    KeychainService.hasPasscode() // Check local keychain status
                ]);

                if (!isMountedRef.current) return;

                // Set selection mode
                if (selectionJson === 'drag' || selectionJson === 'longClick') setSelectionModeValue(selectionJson as Mode);
                else if (selectionJson === 'null') setSelectionModeValue(null);
                else setSelectionModeValue(defaultSelectionMode);

                // Set parental settings from API
                setParentalSettings({ ...defaultParentalSettings, ...fetchedParentalSettings });
                // Cache fetched parental settings
                AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(fetchedParentalSettings)).catch(cacheError => {
                    console.warn("Menu: Failed to cache parental settings", cacheError);
                });


                setLocalKeychainPasscodeExists(keychainHasPasscode);

            } catch (error) {
                console.error("Menu: Failed to load initial menu data", error);
                if(isMountedRef.current && typeof t === 'function') {
                    Alert.alert(t('common.error'), t('menu.errors.loadSettingsFail'));
                    // Fallback to defaults
                    setSelectionModeValue(defaultSelectionMode);
                    setParentalSettings(defaultParentalSettings);
                    setLocalKeychainPasscodeExists(false);
                }
            } finally {
                if(isMountedRef.current) {
                    setIsLoadingSelection(false);
                    setIsLoadingParentalSettings(false);
                }
            }
        };

        if (typeof t === 'function' && i18n.isInitialized) {
            loadAllMenuData();
        }
    }, [t, i18n.isInitialized]);

    const handleCloseSubModal = useCallback(() => { setActiveModal(null); }, []);

    const handleMenuPress = useCallback(async (itemId: string) => {
        if (!isMountedRef.current || typeof t !== 'function' || isCheckingPasscodeForMenu) return;

        const protectedItems = ['parental', 'voiceover', 'display', 'selection'];

        if (itemId === 'about') {
            setActiveModal(itemId);
            return;
        }

        if (isLoadingInitialSettings) { // Check if initial settings (including parental) are still loading
            Alert.alert(t('menu.loadingTitle', 'Loading...'), t('menu.loadingMessage', 'Settings are loading, please wait.'));
            return;
        }

        if (protectedItems.includes(itemId)) {
            // parentalSettings.requirePasscode is now sourced from the backend via fetchParentalSettings
            if (parentalSettings.requirePasscode) {
                setIsCheckingPasscodeForMenu(true);
                setTargetModalId(itemId); // Optimistically set target modal
                try {
                    const backendPasscodeStatus = await apiService.checkBackendHasParentalPasscode();
                    if (!isMountedRef.current) return;

                    if (backendPasscodeStatus.exists) {
                        // Passcode IS REQUIRED by settings AND it EXISTS on the backend. Show prompt.
                        setIsPasscodePromptVisible(true);
                    } else {
                        // Passcode IS REQUIRED by settings, BUT NOT SET UP on the backend.
                        Alert.alert(
                            t('menu.errors.passcodeIssueTitle', 'Passcode Setup Issue'),
                            t('menu.errors.passcodeRequiredButNotConfiguredMenu', 'A passcode is required by your settings, but it appears none is configured on the server. Please visit Parental Controls to set up a passcode.'),
                            // Decide action: either block or allow with warning.
                            // For "if not set allow access", this would mean:
                            // [{ text: t('common.ok'), onPress: () => { setActiveModal(itemId); } }]
                            // For now, just an OK button, not opening the item.
                            [{ text: t('common.ok') }]
                        );
                        setTargetModalId(null); // Clear target as we are not proceeding to prompt
                    }
                } catch (error) {
                    if (!isMountedRef.current) return;
                    console.error("Menu: Error checking backend passcode status for menu access:", error);
                    Alert.alert(t('common.error'), t('menu.errors.passcodeStatusCheckFailedMenu', 'Could not verify passcode status. Please try again.'));
                    setTargetModalId(null); // Clear target on error
                } finally {
                    if (isMountedRef.current) setIsCheckingPasscodeForMenu(false);
                }
            } else {
                // parentalSettings.requirePasscode is FALSE. Allow access directly.
                setActiveModal(itemId);
            }
        } else {
            // Item is not in the protectedItems list. Allow access directly.
            setActiveModal(itemId);
        }
    }, [parentalSettings, isLoadingInitialSettings, isCheckingPasscodeForMenu, t, i18n.language, targetModalId]);


    const handlePasscodeVerified = useCallback(() => {
        if (isMountedRef.current) {
            setIsPasscodePromptVisible(false);
            if (targetModalId) {
                setActiveModal(targetModalId);
            }
            setTargetModalId(null);
        }
    }, [targetModalId]);

    const handlePasscodeCancel = useCallback(() => {
        if (isMountedRef.current) {
            setIsPasscodePromptVisible(false);
            setTargetModalId(null);
        }
    }, []);

    const handleSelectionSave = useCallback(async (mode: Mode | null) => {
        if (typeof t !== 'function' || !isMountedRef.current) return;
        setIsSavingSelection(true);
        try {
            await AsyncStorage.setItem(SELECTION_MODE_STORAGE_KEY, String(mode));
            setSelectionModeValue(mode);
            Alert.alert(t('menu.saveSuccessTitle'), t('menu.saveSuccessSelection'));
        } catch (error) {
            console.error("Menu: Failed save selection:", error);
            if(isMountedRef.current) Alert.alert(t('common.error'), t('menu.errors.saveSelectionFail'));
            throw error;
        } finally {
            if(isMountedRef.current) setIsSavingSelection(false);
            handleCloseSubModal();
        }
    }, [handleCloseSubModal, t]);

    const handleParentalSettingsUpdate = useCallback(async (updatedSettingsFromApi: ParentalSettingsData) => {
        if (typeof t !== 'function' || !isMountedRef.current) return;
        
        setIsUpdatingParentalCache(true);
        try {
            // Update Menu's local state with the latest from ParentalControls (which got it from API)
            setParentalSettings(updatedSettingsFromApi);
            
            // Update AsyncStorage cache
            await AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettingsFromApi));
            
            // Re-check local keychain status as it might have changed (e.g., passcode set/removed)
            const hasPC = await KeychainService.hasPasscode();
            if(isMountedRef.current) setLocalKeychainPasscodeExists(hasPC);

        } catch (error) {
            console.error("Menu: Failed to update local parental settings cache after API save:", error);
            if (isMountedRef.current && typeof t === 'function') {
                Alert.alert(t('common.error'), t('menu.errors.saveParentalFail'));
            }
        } finally {
            if(isMountedRef.current) setIsUpdatingParentalCache(false);
        }
    }, [t]);

    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);

    if (!i18n.isInitialized || typeof t !== 'function' || isLoadingAppearance) {
        return (
            <View style={[styles.menuContainerIfLoading, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary || '#0077b6'} />
            </View>
        );
    }

    const renderMenuContent = () => (
         <ScrollView style={styles.menuScrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
             {menuItems.map((item) => {
                 const label = t(item.labelKey);
                 // Item is disabled if initial settings are loading OR if a passcode check is underway for THIS item
                 const isDisabledByLoading = isLoadingInitialSettings || (isCheckingPasscodeForMenu && targetModalId === item.id);
                 const isProtectedItem = ['parental', 'voiceover', 'display', 'selection'].includes(item.id);

                 return (
                     <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.id)}
                        activeOpacity={0.7}
                        disabled={isDisabledByLoading && isProtectedItem && item.id !== 'about'}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ disabled: isDisabledByLoading && isProtectedItem && item.id !== 'about' }}
                     >
                         <View style={[styles.iconWrapper, isDisabledByLoading && isProtectedItem && item.id !== 'about' && { opacity: 0.5 }]}>
                            {(isCheckingPasscodeForMenu && targetModalId === item.id && isProtectedItem) ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <FontAwesomeIcon icon={item.icon} size={fonts.body * 1.2} color={theme.primary} />
                            )}
                         </View>
                         <Text style={[styles.menuText, isDisabledByLoading && isProtectedItem && item.id !== 'about' && { color: theme.disabled }]}>{label}</Text>
                         <FontAwesomeIcon icon={faChevronRight} size={fonts.label} style={[styles.menuArrow, isDisabledByLoading && isProtectedItem && item.id !== 'about' && { opacity: 0.5 }]} color={theme.border} />
                     </TouchableOpacity>
                 );
             })}
         </ScrollView>
     );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} accessibilityLabel={t('menu.closeMenuAccessibilityLabel')} />
            </Animated.View>
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>{t('menu.title')}</Text>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={hitSlop} accessibilityLabel={t('menu.closeMenuAccessibilityLabel')}>
                        <FontAwesomeIcon icon={faTimes} size={fonts.h2} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
                {isLoadingInitialSettings ? <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} /> : renderMenuContent() }
                <View style={styles.menuFooter} />
            </Animated.View>

            <Modal visible={activeModal === 'display'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'display' && <DisplayOptionsScreen onClose={handleCloseSubModal} />}
            </Modal>
             <Modal visible={activeModal === 'selection'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'selection' && <SelectionModeScreen onClose={handleCloseSubModal} initialMode={selectionModeValue} onSave={handleSelectionSave} />}
            </Modal>
             <Modal visible={activeModal === 'voiceover'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'voiceover' && <SymbolVoiceOverScreen onClose={handleCloseSubModal} initialSettings={currentTtsSettings} onSave={onTtsSettingsSave} />}
            </Modal>
             <Modal visible={activeModal === 'parental'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'parental' && <ParentalControls onClose={handleCloseSubModal} initialSettings={memoizedParentalSettings} onSaveSuccess={handleParentalSettingsUpdate} />}
            </Modal>
            <Modal visible={activeModal === 'about'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'about' && <AboutScreen onClose={handleCloseSubModal} />}
            </Modal>

            <PasscodePromptModal visible={isPasscodePromptVisible} onClose={handlePasscodeCancel} onVerified={handlePasscodeVerified}/>
        </View>
    );
};

const createThemedMenuStyles = (theme: ThemeColors, baseFonts: FontSizes, language: string) => StyleSheet.create({
    menuContainerIfLoading: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: menuWidth,
        backgroundColor: theme.card || '#FFFFFF',
    },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', },
    menuContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: menuWidth, backgroundColor: theme.card, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 16, },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    menuTitle: {
        fontWeight: 'bold',
        color: theme.text,
        ...getLanguageSpecificTextStyle('h1', baseFonts, language),
    },
    closeButtonInternal: { padding: 8, },
    menuScrollView: { flex: 1, },
    scrollContentContainer: { paddingVertical: 8, },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    iconWrapper: { width: 35, alignItems: 'center', justifyContent: 'center', marginRight: 15, }, // Added justifyContent
    menuText: {
        color: theme.text,
        flex: 1,
        fontWeight: '500',
        ...getLanguageSpecificTextStyle('body', baseFonts, language),
    },
    menuArrow: { marginLeft: 8, color: theme.disabled, },
    menuFooter: { height: Platform.OS === 'ios' ? 40 : 30, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
});

export default Menu;