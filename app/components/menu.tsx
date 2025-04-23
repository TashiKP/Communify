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
import * as KeychainService from '../services/keychainService'; // Adjust path if needed

// --- Import Components and Types --- (Adjust paths as necessary)
import DisplayOptionsScreen, { DisplaySettingsData } from './DisplayOptionsScreen';
import SelectionModeScreen, { SelectionModeScreenProps } from './SelectionModeScreen'; // Import component AND props interface
import ParentalControls from './ParentalControls';
import { ParentalSettingsData } from './parental/types'; // Import type from shared file
import SymbolVoiceOverScreen, { VoiceSettingData } from './SymbolVoiceOverScreen';
import AboutScreen from './AboutScreen';
import PasscodePromptModal from './PasscodePromptModal'; // Import Prompt Modal

// --- Types ---
type Mode = 'drag' | 'longClick'; // Local type

// --- Storage Keys ---
const DISPLAY_SETTINGS_STORAGE_KEY = '@Communify:displaySettings';
const SELECTION_MODE_STORAGE_KEY = '@Communify:selectionMode';
const PARENTAL_SETTINGS_STORAGE_KEY = '@Communify:parentalSettings';

// --- Default Values ---
const defaultDisplaySettingsData: DisplaySettingsData = { layout: 50, brightness: 50, layoutLocked: false, brightnessLocked: false, textSize: 'medium', darkModeEnabled: false };
const defaultSelectionMode: Mode | null = 'drag';
const defaultParentalSettings: ParentalSettingsData = { blockViolence: false, blockInappropriate: false, dailyLimitHours: '', asdLevel: null, downtimeEnabled: false, downtimeDays: [], downtimeStart: '21:00', downtimeEnd: '07:00', requirePasscode: false, notifyEmails: [] };

// --- Constants ---
const screenWidth = Dimensions.get('window').width;
export const menuWidth = screenWidth * 0.65; // Example width adjustment

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
    // State
    const [activeModal, setActiveModal] = useState<string | null>(null);
    // State for settings managed internally by Menu
    const [displaySettingsData, setDisplaySettingsData] = useState<DisplaySettingsData>(defaultDisplaySettingsData);
    const [selectionModeValue, setSelectionModeValue] = useState<Mode | null>(defaultSelectionMode);
    const [parentalSettings, setParentalSettings] = useState<ParentalSettingsData>(defaultParentalSettings);
    // Loading States for internally managed settings
    const [isLoadingDisplay, setIsLoadingDisplay] = useState(true);
    const [isLoadingSelection, setIsLoadingSelection] = useState(true);
    const [isLoadingParental, setIsLoadingParental] = useState(true);
    const [isSavingDisplay, setIsSavingDisplay] = useState(false);
    const [isSavingSelection, setIsSavingSelection] = useState(false); // Still needed for internal save
    const [isSavingParental, setIsSavingParental] = useState(false);

    // Passcode Prompt State
    const [isPasscodePromptVisible, setIsPasscodePromptVisible] = useState(false);
    const [targetModalId, setTargetModalId] = useState<string | null>(null);
    const [passcodeExists, setPasscodeExists] = useState(false);

    // Combined loading state
    const isLoadingSettings = isLoadingDisplay || isLoadingSelection || isLoadingParental;

    // --- Effect to load ALL settings on mount ---
    useEffect(() => {
        let isMounted = true;
        const loadAllSettings = async () => {
            if (!isMounted) return;
            setIsLoadingDisplay(true); setIsLoadingSelection(true); setIsLoadingParental(true);
            try {
                const [hasPC, displayJson, selectionJson, parentalJson] = await Promise.all([
                    KeychainService.hasPasscode(),
                    AsyncStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY),
                    AsyncStorage.getItem(SELECTION_MODE_STORAGE_KEY),
                    AsyncStorage.getItem(PARENTAL_SETTINGS_STORAGE_KEY),
                ]);

                if (!isMounted) return;

                setPasscodeExists(hasPC);

                if (displayJson) setDisplaySettingsData({ ...defaultDisplaySettingsData, ...JSON.parse(displayJson) });
                else setDisplaySettingsData(defaultDisplaySettingsData);

                if (selectionJson === 'drag' || selectionJson === 'longClick') setSelectionModeValue(selectionJson as Mode); // Cast here
                else if (selectionJson === 'null') setSelectionModeValue(null);
                else setSelectionModeValue(defaultSelectionMode);

                if (parentalJson) setParentalSettings({ ...defaultParentalSettings, ...JSON.parse(parentalJson) });
                else setParentalSettings(defaultParentalSettings);

            } catch (e) {
                console.error("Menu: Failed to load settings", e);
                if(isMounted) { setDisplaySettingsData(defaultDisplaySettingsData); setSelectionModeValue(defaultSelectionMode); setParentalSettings(defaultParentalSettings); Alert.alert("Load Error", "Could not load some settings.");}
            } finally {
                if(isMounted) { setIsLoadingDisplay(false); setIsLoadingSelection(false); setIsLoadingParental(false); }
            }
        };
        loadAllSettings();
        return () => { isMounted = false; }
    }, []);

    // --- Handlers ---
    const handleCloseSubModal = useCallback(() => { setActiveModal(null); }, []);

    const handleMenuPress = useCallback(async (itemId: string) => {
        const protectedItems = ['parental', 'voiceover', 'display', 'selection'];
        if (itemId === 'about') { setActiveModal(itemId); return; }
        if (isLoadingSettings && protectedItems.includes(itemId)) { Alert.alert("Loading", "Settings loading, please wait..."); return; }

        if (protectedItems.includes(itemId)) {
            const requirePasscode = parentalSettings.requirePasscode;
            const currentPasscodeExists = await KeychainService.hasPasscode(); // Re-check keychain status just before prompt
             setPasscodeExists(currentPasscodeExists); // Update state just in case

            if (requirePasscode && currentPasscodeExists) {
                setTargetModalId(itemId);
                setIsPasscodePromptVisible(true);
                return;
            } else if (requirePasscode && !currentPasscodeExists) {
                 Alert.alert("Set Passcode Required", "Passcode protection is enabled, but no passcode is set. Please set one via Parental Controls > Security.");
                 return;
            }
        }
        // Open non-protected or if check passes
        setActiveModal(itemId);
    }, [parentalSettings.requirePasscode, isLoadingSettings]); // Dependencies

    const handlePasscodeVerified = useCallback(() => { setIsPasscodePromptVisible(false); if (targetModalId) { setActiveModal(targetModalId); setTargetModalId(null); } }, [targetModalId]);
    const handlePasscodeCancel = useCallback(() => { setIsPasscodePromptVisible(false); setTargetModalId(null); }, []);

    // Save Handlers for settings managed INTERNALLY by Menu
    const handleDisplaySave = useCallback(async (settings: DisplaySettingsData) => {
        setIsSavingDisplay(true); try { await AsyncStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(settings)); setDisplaySettingsData(settings); Alert.alert("Settings Saved", "Display options updated."); } catch (error) { console.error("Menu: Failed save display:", error); Alert.alert("Error", "Could not save."); throw error; } finally { setIsSavingDisplay(false); handleCloseSubModal(); }
    }, [handleCloseSubModal]);

    // --- handleSelectionSave is passed TO SelectionModeScreen ---
    const handleSelectionSave = useCallback(async (mode: Mode | null) => {
        setIsSavingSelection(true);
        try {
            await AsyncStorage.setItem(SELECTION_MODE_STORAGE_KEY, String(mode)); // Save string representation ('null' if null)
            setSelectionModeValue(mode); // Update local state
            Alert.alert("Settings Saved", "Selection method updated.");
        } catch (error) { console.error("Menu: Failed save selection:", error); Alert.alert("Error", "Could not save selection method."); throw error; }
        finally { setIsSavingSelection(false); handleCloseSubModal();}
    }, [handleCloseSubModal]);
    // ------------------------------------------------------------

    const handleParentalSave = useCallback(async (settings: ParentalSettingsData) => {
        setIsSavingParental(true);
        try {
            await AsyncStorage.setItem(PARENTAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            setParentalSettings(settings);
            const hasPC = await KeychainService.hasPasscode(); setPasscodeExists(hasPC); // Recheck passcode status
            Alert.alert("Settings Saved", "Parental controls updated.");
        } catch (error) { console.error("Menu: Failed save parental:", error); Alert.alert("Error", "Could not save parental settings."); /* Don't re-throw */ }
        finally { setIsSavingParental(false); handleCloseSubModal(); }
    }, [handleCloseSubModal]);

    // --- Memoize Settings for Prop Stability ---
    const memoizedDisplaySettingsData = useMemo(() => displaySettingsData, [displaySettingsData]);
    const memoizedParentalSettings = useMemo(() => parentalSettings, [parentalSettings]);

    // Render loading state or main menu
     const renderMenuContent = () => (
         <ScrollView style={styles.menuScrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
             {menuItems.map((item) => (
                 <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item.id)} activeOpacity={0.7} disabled={isLoadingSettings && item.id !== 'about'} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ disabled: isLoadingSettings && item.id !== 'about' }}>
                     <View style={[styles.iconWrapper, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]}><FontAwesomeIcon icon={item.icon} size={18} color="#0077b6" /></View>
                     <Text style={[styles.menuText, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]}>{item.label}</Text>
                     <FontAwesomeIcon icon={faChevronRight} size={14} style={[styles.menuArrow, isLoadingSettings && item.id !== 'about' && { opacity: 0.5 }]} color="#ced4da" />
                 </TouchableOpacity>
             ))}
         </ScrollView>
     );

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Overlay & Menu Container */}
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}><TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} accessibilityLabel="Close menu" /></Animated.View>
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.menuHeader}><Text style={styles.menuTitle}>Settings</Text><TouchableOpacity onPress={closeMenu} style={styles.closeButtonInternal} hitSlop={styles.hitSlop}><FontAwesomeIcon icon={faTimes} size={20} color="#6c757d" /></TouchableOpacity></View>
                {isLoadingSettings ? <ActivityIndicator size="large" color="#0077b6" style={{ flex: 1 }} /> : renderMenuContent() }
                <View style={styles.menuFooter} />
            </Animated.View>

            {/* --- Sub-Modals / Screens --- */}
             <Modal visible={activeModal === 'display'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {/* Render only when modal is supposed to be active */}
                {activeModal === 'display' && <DisplayOptionsScreen onClose={handleCloseSubModal} initialSettings={memoizedDisplaySettingsData} onSave={handleDisplaySave} />}
            </Modal>
            <Modal visible={activeModal === 'selection'} animationType="slide" transparent={false} onRequestClose={handleCloseSubModal} >
                {/* --- Pass onSave back to SelectionModeScreen --- */}
                {activeModal === 'selection' && <SelectionModeScreen onClose={handleCloseSubModal} initialMode={selectionModeValue} onSave={handleSelectionSave} />}
                {/* ---------------------------------------------- */}
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

            {/* --- Passcode Prompt --- */}
            <PasscodePromptModal visible={isPasscodePromptVisible} onClose={handlePasscodeCancel} onVerified={handlePasscodeVerified}/>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', },
    menuContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: menuWidth, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 16, },
    menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e9ecef', },
    menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#343a40', },
    closeButtonInternal: { padding: 8, },
    menuScrollView: { flex: 1, },
    scrollContentContainer: { paddingVertical: 8, },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, },
    iconWrapper: { width: 30, alignItems: 'center', marginRight: 12, },
    menuText: { fontSize: 15, color: '#212529', flex: 1, fontWeight: '500', },
    menuArrow: { marginLeft: 8, color: '#ced4da', },
    menuFooter: { height: Platform.OS === 'ios' ? 40 : 30, backgroundColor: '#ffffff', },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }
});

export default Menu;