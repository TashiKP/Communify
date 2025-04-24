// src/components/menu.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, ScrollView, TouchableOpacity, Animated, Modal, Text, StyleSheet, Platform, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faDesktop, faShapes, faCommentDots, faUserShield, faInfoCircle, faChevronRight, faTimes
} from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as KeychainService from '../services/keychainService';

// --- Import Context Hooks & Types ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Import Appearance context

// --- Import Components and Types ---
import DisplayOptionsScreen from './DisplayOptionsScreen';
import SelectionModeScreen from './SelectionModeScreen';
import ParentalControls from './ParentalControls';
import { ParentalSettingsData } from './parental/types';
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen';
import PasscodePromptModal from './PasscodePromptModal';

// --- Types ---
type Mode = 'drag' | 'longClick';

// --- Storage Keys ---
// Appearance context handles its own key now
const SELECTION_MODE_STORAGE_KEY = '@Communify:selectionMode';
const PARENTAL_SETTINGS_STORAGE_KEY = '@Communify:parentalSettings';

// --- Default Values ---
// Defaults for settings managed ONLY by Menu
const defaultSelectionMode: Mode | null = 'drag';
const defaultParentalSettings: ParentalSettingsData = { blockViolence: false, blockInappropriate: false, dailyLimitHours: '', asdLevel: null, downtimeEnabled: false, downtimeDays: [], downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false, notifyEmails: [] };

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.25;

// --- Component Props Interface ---
interface MenuProps {
    slideAnim: Animated.Value;
    overlayAnim: Animated.Value;
    closeMenu: () => void;
    currentTtsSettings: VoiceSettingData; // Passed from HomeScreen
    onTtsSettingsSave: (settings: VoiceSettingData) => void; // Passed from HomeScreen
}

// --- Menu Items Configuration ---
const menuItems = [
    { id: 'display', icon: faDesktop, label: 'Display Options' },
    { id: 'selection', icon: faShapes, label: 'Symbol Selection' },
    { id: 'voiceover', icon: faCommentDots, label: 'Voice & Speech' },
    { id: 'parental', icon: faUserShield, label: 'Parental Controls' },
    { id: 'about', icon: faInfoCircle, label: 'About Us' },
];

// --- Component ---
const Menu: React.FC<MenuProps> = ({
    slideAnim,
    overlayAnim,
    closeMenu,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    // --- Context ---
    const { theme, fonts, isLoadingAppearance } = useAppearance(); // Use context for styling

    // State for Modals and settings *not* in AppearanceContext
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    // Loading States for settings managed by Menu
    const [isLoadingSelection, setIsLoadingSelection] = useState(true);
    const [isLoadingParental, setIsLoadingParental] = useState(true);
    // Saving states for Menu-managed saves
    const [isSavingSelection, setIsSavingSelection] = useState(false);
    const [isSavingParental, setIsSavingParental] = useState(false);

    // Passcode Prompt State
    const [isPasscodePromptVisible, setIsPasscodePromptVisible] = useState(false);
    const [targetModalId, setTargetModalId] = useState<string | null>(null);
    const [passcodeExists, setPasscodeExists] = useState(false);

    // Combined loading state (includes appearance context loading)
    const isLoadingSettings = isLoadingAppearance || isLoadingSelection || isLoadingParental;

    // --- Effect to load Menu-managed settings ---
    useEffect(() => {
        let isMounted = true;
        const loadMenuSettings = async () => {
            if (!isMounted) return;
            setIsLoadingSelection(true); setIsLoadingParental(true);
            try {
                const [hasPC, selectionJson, parentalJson] = await Promise.all([
                    KeychainService.hasPasscode(),
                    AsyncStorage.getItem(SELECTION_MODE_STORAGE_KEY),
                    AsyncStorage.getItem(PARENTAL_SETTINGS_STORAGE_KEY),
                    // Display settings are loaded by AppearanceContext
                ]);

                if (!isMounted) return;

                setPasscodeExists(hasPC);

                if (selectionJson === 'drag' || selectionJson === 'longClick') setSelectionModeValue(selectionJson as Mode);
                else if (selectionJson === 'null') setSelectionModeValue(null);
                else setSelectionModeValue(defaultSelectionMode);

                if (parentalJson) setParentalSettings({ ...defaultParentalSettings, ...JSON.parse(parentalJson) });
                else setParentalSettings(defaultParentalSettings);

            } catch (e) {
                console.error("Menu: Failed to load selection/parental settings", e);
                if(isMounted) { setSelectionModeValue(defaultSelectionMode); setParentalSettings(defaultParentalSettings); Alert.alert("Load Error", "Could not load some settings.");}
            } finally {
                if(isMounted) { setIsLoadingSelection(false); setIsLoadingParental(false); }
            }
        };
        loadMenuSettings();
        return () => { isMounted = false; }
    }, []);

    // --- Handlers ---
    const handleCloseSubModal = useCallback(() => { setActiveModal(null); }, []);

    const handleMenuPress = useCallback(async (itemId: string) => {
        const protectedItems = ['parental', 'voiceover', 'display', 'selection'];
        if (itemId === 'about') { setActiveModal(itemId); return; }

        // Check if ANY required settings are loading
        if (isLoadingSettings && protectedItems.includes(itemId)) {
            Alert.alert("Loading", "Settings are still loading, please wait...");
            return;
        }

        // Passcode Check (remains the same logic)
        if (protectedItems.includes(itemId)) {
            const requirePasscode = parentalSettings.requirePasscode;
            const currentPasscodeExists = await KeychainService.hasPasscode();
             setPasscodeExists(currentPasscodeExists);

            if (requirePasscode && currentPasscodeExists) {
                setTargetModalId(itemId);
                setIsPasscodePromptVisible(true);
                return;
            } else if (requirePasscode && !currentPasscodeExists) {
                 Alert.alert("Set Passcode Required", "Parental Controls require a passcode, but none is set. Please configure one in Parental Controls > Security first.");
                 return;
            }
        }
        setActiveModal(itemId);
    }, [parentalSettings.requirePasscode, isLoadingSettings]); // Depend on isLoadingSettings

    const handlePasscodeVerified = useCallback(() => { setIsPasscodePromptVisible(false); if (targetModalId) { setActiveModal(targetModalId); setTargetModalId(null); } }, [targetModalId]);
    const handlePasscodeCancel = useCallback(() => { setIsPasscodePromptVisible(false); setTargetModalId(null); }, []);

    // --- Save Handlers for Menu-managed state ---
    // NO handleDisplaySave needed here anymore

    const handleSelectionSave = useCallback(async (mode: Mode | null) => {
        setIsSavingSelection(true);
        try {
            await AsyncStorage.setItem(SELECTION_MODE_STORAGE_KEY, String(mode));
            setSelectionModeValue(mode);
            Alert.alert("Settings Saved", "Selection method updated.");
        } catch (error) { console.error("Menu: Failed save selection:", error); Alert.alert("Error", "Could not save selection method."); throw error; }
        finally { setIsSavingSelection(false); handleCloseSubModal();}
    }, [handleCloseSubModal]);

    const handleParentalSave = useCallback(async (settings: ParentalSettingsData) => {
        setIsSavingParental(true);
        try {
            await AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            setParentalSettings(settings);
            const hasPC = await KeychainService.hasPasscode(); setPasscodeExists(hasPC);
            Alert.alert("Settings Saved", "Parental controls updated.");
        } catch (error) { console.error("Menu: Failed save parental:", error); Alert.alert("Error", "Could not save parental settings."); }
        finally { setIsSavingParental(false); handleCloseSubModal(); }
    }, [handleCloseSubModal]);

    // --- Memoize Settings for Prop Stability ---
    // No need to memoize displaySettingsData here anymore
    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);

    // --- Dynamic Styles ---
    const styles = createThemedMenuStyles(theme, fonts); // Use themed styles

    // Render loading state or main menu
     const renderMenuContent = () => (
         <ScrollView style={styles.menuScrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
             {menuItems.map((item) => (
                 <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item.id)}
                    activeOpacity={0.7}
                    disabled={isLoadingSettings && item.id !== 'about'} // Disable based on combined loading
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ disabled: isLoadingSettings && item.id !== 'about' }}
                 >
                     <View style={[styles.iconWrapper, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]}>
                         {/* Use theme primary color for icon */}
                         <FontAwesomeIcon icon={item.icon} size={fonts.body * 1.2} color={theme.primary} />
                     </View>
                     <Text style={[styles.menuText, isLoadingSettings && item.id !== 'about' && { color: theme.disabled }]}>{item.label}</Text>
                     <FontAwesomeIcon icon={faChevronRight} size={fonts.label} style={[styles.menuArrow, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]} color={theme.border} />
                 </TouchableOpacity>
             ))}
         </ScrollView>
     );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Overlay & Menu Container */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}><TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} accessibilityLabel="Close menu" /></Animated.View>
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Settings</Text>
                    <TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={styles.hitSlop} accessibilityLabel="Close menu">
                        <FontAwesomeIcon icon={faTimes} size={fonts.h2} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
                {/* Use combined loading state */}
                {isLoadingSettings ? <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} /> : renderMenuContent() }
                <View style={styles.menuFooter} />
            </Animated.View>

            {/* --- Sub-Modals / Screens --- */}
             <Modal visible={activeModal === 'display'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {/* DisplayOptionsScreen no longer needs initialSettings or onSave for appearance */}
                {activeModal === 'display' &&
                    <DisplayOptionsScreen onClose={handleCloseSubModal} />
                }
            </Modal>
            {/* Other modals remain the same, but could also be themed */}
             <Modal visible={activeModal === 'selection'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'selection' && <SelectionModeScreen onClose={handleCloseSubModal} initialMode={selectionModeValue} onSave={handleSelectionSave} />}
            </Modal>
             <Modal visible={activeModal === 'voiceover'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'voiceover' && <SymbolVoiceOverScreen onClose={handleCloseSubModal} initialSettings={currentTtsSettings} onSave={onTtsSettingsSave} />}
            </Modal>
             <Modal visible={activeModal === 'parental'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {/* Pass memoized settings */}
                {activeModal === 'parental' && <ParentalControls onClose={handleCloseSubModal} initialSettings={memoizedParentalSettings} onSave={handleParentalSave} />}
            </Modal>
            <Modal visible={activeModal === 'about'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {activeModal === 'about' && <AboutScreen onClose={handleCloseSubModal} />}
            </Modal>

            {/* --- Passcode Prompt --- */}
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
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, // Add subtle separator
    iconWrapper: { width: 35, alignItems: 'center', marginRight: 15, },
    menuText: { fontSize: fonts.body, color: theme.text, flex: 1, fontWeight: '500', },
    menuArrow: { marginLeft: 8, color: theme.disabled, },
    menuFooter: { height: Platform.OS === 'ios' ? 40 : 30, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border }, // Themed footer
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }
});

export default Menu;