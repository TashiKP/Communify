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
import * as KeychainService from '../services/keychainService'; // Ensure path is correct
import { useTranslation } from 'react-i18next';

// --- Import Context Hooks & Types ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';

// --- Import Components and Types ---
import DisplayOptionsScreen from './DisplayOptionsScreen'; // Ensure path is correct
import SelectionModeScreen from './SelectionModeScreen';   // Ensure path is correct
import ParentalControls from './ParentalControls';       // Ensure path is correct
import { ParentalSettingsData } from './parental/types'; // Ensure path is correct
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen'; // Ensure path is correct
import AboutScreen from './AboutScreen';                 // Ensure path is correct
import PasscodePromptModal from './PasscodePromptModal';   // Ensure path is correct

// --- Types ---
type Mode = 'drag' | 'longClick';

// --- Storage Keys ---
const SELECTION_MODE_STORAGE_KEY = '@Communify:selectionMode';
const PARENTAL_SETTINGS_STORAGE_KEY = '@Communify:parentalSettings';

// --- Default Values ---
const defaultSelectionMode: Mode | null = 'drag';
const defaultParentalSettings: ParentalSettingsData = { blockViolence: false, blockInappropriate: false, dailyLimitHours: '', asdLevel: null, downtimeEnabled: false, downtimeDays: [], downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false, notifyEmails: [] };

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.25;
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 }; // Defined for closeButtonInternal

// --- Component Props Interface ---
interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
}

// --- Component ---
const Menu: React.FC<MenuProps> = ({
    slideAnim,
    overlayAnim,
    closeMenu,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    // --- Hooks ---
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation(); // Get t and i18n instance

    // --- State ---
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    const [isLoadingSelection, setIsLoadingSelection] = useState(true);
    const [isLoadingParental, setIsLoadingParental] = useState(true);
    const [isSavingSelection, setIsSavingSelection] = useState(false);
    const [isSavingParental, setIsSavingParental] = useState(false);
    const [isPasscodePromptVisible, setIsPasscodePromptVisible] = useState(false);
    const [targetModalId, setTargetModalId] = useState<string | null>(null);
    const [passcodeExists, setPasscodeExists] = useState(false);
    const isMountedRef = useRef(true);


    // --- Menu Items Configuration (using translation keys) ---
    const menuItems = useMemo(() => [
        { id: 'display', icon: faDesktop, labelKey: 'menu.displayOptions' },
        { id: 'selection', icon: faShapes, labelKey: 'menu.symbolSelection' },
        { id: 'voiceover', icon: faCommentDots, labelKey: 'menu.voiceAndSpeech' },
        { id: 'parental', icon: faUserShield, labelKey: 'menu.parentalControls' },
        { id: 'about', icon: faInfoCircle, labelKey: 'menu.aboutUs' },
    ], []); // Keys are static, so no dependencies on t or i18n.language here

    // Combined loading state
    const isLoadingSettings = isLoadingAppearance || isLoadingSelection || isLoadingParental;

    // --- Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        console.log('Menu.tsx: Mounted. typeof t =', typeof t, 'i18n initialized:', i18n.isInitialized);
        return () => { isMountedRef.current = false; };
    }, [t, i18n.isInitialized]);

    // --- Effect to load Menu-managed settings ---
    useEffect(() => {
        const loadMenuSettings = async () => {
            if (!isMountedRef.current) return;
            setIsLoadingSelection(true); setIsLoadingParental(true);
            try {
                const [hasPC, selectionJson, parentalJson] = await Promise.all([
                    KeychainService.hasPasscode(),
                    AsyncStorage.getItem(SELECTION_MODE_STORAGE_KEY),
                    AsyncStorage.getItem(PARENTAL_SETTINGS_STORAGE_KEY),
                ]);

                if (!isMountedRef.current) return;

                setPasscodeExists(hasPC);

                if (selectionJson === 'drag' || selectionJson === 'longClick') setSelectionModeValue(selectionJson as Mode);
                else if (selectionJson === 'null') setSelectionModeValue(null);
                else setSelectionModeValue(defaultSelectionMode);

                if (parentalJson) setParentalSettings({ ...defaultParentalSettings, ...JSON.parse(parentalJson) });
                else setParentalSettings(defaultParentalSettings);

            } catch (e) {
                console.error("Menu: Failed to load selection/parental settings", e);
                if(isMountedRef.current) {
                    setSelectionModeValue(defaultSelectionMode);
                    setParentalSettings(defaultParentalSettings);
                    if (typeof t === 'function') Alert.alert(t('common.error'), t('menu.errors.loadSettingsFail'));
                }
            } finally {
                if(isMountedRef.current) { setIsLoadingSelection(false); setIsLoadingParental(false); }
            }
        };
        loadMenuSettings();
    }, [t]); // Add t as a dependency because it's used in the catch block for Alert

    // --- Handlers ---
    const handleCloseSubModal = useCallback(() => { setActiveModal(null); }, []);

    const handleMenuPress = useCallback(async (itemId: string) => {
        if (typeof t !== 'function') return; // Guard if t is not ready

        const protectedItems = ['parental', 'voiceover', 'display', 'selection'];
        if (itemId === 'about') { setActiveModal(itemId); return; }

        if (isLoadingSettings && protectedItems.includes(itemId)) {
            Alert.alert(t('menu.loadingTitle'), t('menu.loadingMessage'));
            return;
        }

        if (protectedItems.includes(itemId)) {
            const requirePasscode = parentalSettings.requirePasscode;
            const currentPasscodeExists = await KeychainService.hasPasscode();
            if (isMountedRef.current) setPasscodeExists(currentPasscodeExists);

            if (requirePasscode && currentPasscodeExists) {
                setTargetModalId(itemId);
                setIsPasscodePromptVisible(true);
                return;
            } else if (requirePasscode && !currentPasscodeExists) {
                 Alert.alert(t('menu.errors.passcodeRequiredTitle'), t('menu.errors.passcodeRequiredMessage'));
                 return;
            }
        }
        setActiveModal(itemId);
    }, [parentalSettings.requirePasscode, isLoadingSettings, t]);

    const handlePasscodeVerified = useCallback(() => { setIsPasscodePromptVisible(false); if (targetModalId) { setActiveModal(targetModalId); setTargetModalId(null); } }, [targetModalId]);
    const handlePasscodeCancel = useCallback(() => { setIsPasscodePromptVisible(false); setTargetModalId(null); }, []);

    const handleSelectionSave = useCallback(async (mode: Mode | null) => {
        if (typeof t !== 'function') { console.error("Menu: t function not available for selection save."); return; }
        setIsSavingSelection(true);
        try {
            await AsyncStorage.setItem(SELECTION_MODE_STORAGE_KEY, String(mode));
            setSelectionModeValue(mode);
            Alert.alert(t('menu.saveSuccessTitle'), t('menu.saveSuccessSelection'));
        } catch (error) {
            console.error("Menu: Failed save selection:", error);
            Alert.alert(t('common.error'), t('menu.errors.saveSelectionFail'));
            throw error;
        } finally {
            if(isMountedRef.current) setIsSavingSelection(false);
            handleCloseSubModal();
        }
    }, [handleCloseSubModal, t]);

    const handleParentalSave = useCallback(async (settings: ParentalSettingsData) => {
        if (typeof t !== 'function') { console.error("Menu: t function not available for parental save."); return; }
        setIsSavingParental(true);
        try {
            await AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            setParentalSettings(settings);
            const hasPC = await KeychainService.hasPasscode();
            if(isMountedRef.current) setPasscodeExists(hasPC);
            Alert.alert(t('menu.saveSuccessTitle'), t('menu.saveSuccessParental'));
        } catch (error) {
            console.error("Menu: Failed save parental:", error);
            Alert.alert(t('common.error'), t('menu.errors.saveParentalFail'));
        } finally {
            if(isMountedRef.current) setIsSavingParental(false);
            handleCloseSubModal();
        }
    }, [handleCloseSubModal, t]);

    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);

    const styles = useMemo(() => createThemedMenuStyles(theme, fonts), [theme, fonts]);

    // --- Render Guard for i18n ---
    if (!i18n.isInitialized || typeof t !== 'function') {
        console.log("Menu.tsx: Rendering loading state because 't' function is not ready or i18n not initialized.");
        // Return a minimal loading state or null, avoid using 't' here
        return (
            <View style={[styles.menuContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary || '#0077b6'} />
            </View>
        );
    }

    const renderMenuContent = () => (
         <ScrollView style={styles.menuScrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
             {menuItems.map((item) => {
                 const label = t(item.labelKey);
                 return (
                     <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.id)}
                        activeOpacity={0.7}
                        disabled={isLoadingSettings && item.id !== 'about'}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        accessibilityState={{ disabled: isLoadingSettings && item.id !== 'about' }}
                     >
                         <View style={[styles.iconWrapper, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]}>
                             <FontAwesomeIcon icon={item.icon} size={fonts.body * 1.2} color={theme.primary} />
                         </View>
                         <Text style={[styles.menuText, isLoadingSettings && item.id !== 'about' && { color: theme.disabled }]}>{label}</Text>
                         <FontAwesomeIcon icon={faChevronRight} size={fonts.label} style={[styles.menuArrow, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]} color={theme.border} />
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
                {isLoadingSettings ? <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} /> : renderMenuContent() }
                <View style={styles.menuFooter} />
            </Animated.View>

            {/* Sub-Modals / Screens */}
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
                {activeModal === 'parental' && <ParentalControls onClose={handleCloseSubModal} initialSettings={memoizedParentalSettings} onSave={handleParentalSave} />}
            </Modal>
            <Modal visible={activeModal === 'about'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'about' && <AboutScreen onClose={handleCloseSubModal} />}
            </Modal>

            <PasscodePromptModal visible={isPasscodePromptVisible} onClose={handlePasscodeCancel} onVerified={handlePasscodeVerified}/>
        </View>
    );
};

// --- Themed Styles for Menu ---
const createThemedMenuStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', },
    menuContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: menuWidth, backgroundColor: theme.card, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 16, },
    menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: theme.border, },
    menuTitle: { fontSize: fonts.h1, fontWeight: 'bold', color: theme.text, },
    closeButtonInternal: { padding: 8, },
    menuScrollView: { flex: 1, },
    scrollContentContainer: { paddingVertical: 8, },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    iconWrapper: { width: 35, alignItems: 'center', marginRight: 15, },
    menuText: { fontSize: fonts.body, color: theme.text, flex: 1, fontWeight: '500', },
    menuArrow: { marginLeft: 8, color: theme.disabled, },
    menuFooter: { height: Platform.OS === 'ios' ? 40 : 30, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }
});

export default Menu;