// src/components/bottomnav.tsx (BottomBar)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Platform, Text
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faBoxes, faHome, faKeyboard, faCog
    // Removed Chevron icons as toggle logic is likely in HomeScreen now
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';

// --- Import Components/Screens/Types --- (Adjust paths as necessary)
// Assuming Menu exports menuWidth correctly
import Menu, { menuWidth } from './menu'; // Use relative path if in same dir
import SearchScreen from './SearchScreen'; // Use relative path
import GridLayoutScreen from './GridLayoutScreen'; // Use relative path
import CustomPageComponent from './CustomPageComponent'; // Use relative path
import KeyboardInputComponent from './KeyboardInputComponent'; // Use relative path
import { VoiceSettingData } from './SymbolVoiceOverScreen'; // Import VoiceSettingData type
// --- FIX: Import GridLayoutType from context ---
import { GridLayoutType } from '../context/GridContext'; // Import type from context file

// --- Constants ---
const BAR_HEIGHT = 65; // Ensure this matches the height used in HomeScreen animation

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void; // Callback for Home button press
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void; // Callback for symbol selected from Search
    onTextInputSubmit: (text: string) => void; // Callback for text submitted from Keyboard
    currentLanguage?: string; // Language passed down to SearchScreen
    // currentGridLayout?: GridLayoutType; // No longer needed to pass down to GridLayoutScreen as it uses context
    onGridLayoutSave?: (layout: GridLayoutType) => void; // Optional: Callback IF HomeScreen needs to know immediately when layout is saved (e.g., reset timer). Context handles the actual state change.
    onCustomSymbolsUpdate?: (symbols: any[]) => void; // Callback for custom symbol updates (replace 'any' with SymbolItem[] if defined)
    currentTtsSettings: VoiceSettingData; // Current TTS settings passed down to Menu
    onTtsSettingsSave: (settings: VoiceSettingData) => void; // Callback to save TTS settings passed down to Menu
};

// --- Component ---
const BottomBar: React.FC<BottomBarProps> = React.memo(({
    handleHomePress,
    onSymbolSelected,
    onTextInputSubmit,
    currentLanguage = 'en',
    // currentGridLayout, // No longer needed to destructure
    onGridLayoutSave, // Keep destructuring if prop is kept
    onCustomSymbolsUpdate,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    // --- State & Animation ---
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
    const [isGridLayoutScreenVisible, setIsGridLayoutScreenVisible] = useState(false);
    const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
    const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);

    const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
    const menuOverlayAnim = useRef(new Animated.Value(0)).current;

    // --- Menu Handlers ---
    const openMenu = useCallback(() => {
        setMenuVisible(true);
        Animated.parallel([
            Animated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 10 }),
            Animated.timing(menuOverlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    }, [menuSlideAnim, menuOverlayAnim]);

    const closeMenu = useCallback(() => {
        Animated.parallel([
            Animated.spring(menuSlideAnim, { toValue: -menuWidth, useNativeDriver: true, bounciness: 4, speed: 10 }),
            Animated.timing(menuOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setMenuVisible(false));
    }, [menuSlideAnim, menuOverlayAnim]);

    // --- Other Modal/Screen Handlers ---
    const openSearchScreen = useCallback(() => { setIsSearchScreenVisible(true); }, []);
    const closeSearchScreen = useCallback(() => { setIsSearchScreenVisible(false); }, []);
    const handleSymbolSelectFromSearch = useCallback((symbol: { keyword: string; pictogramUrl: string }) => {
        onSymbolSelected(symbol); // Notify parent (HomeScreen)
        closeSearchScreen();
    }, [onSymbolSelected, closeSearchScreen]);

    const openGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(true); }, []);
    const closeGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(false); }, []);
    // handleSaveGridLayout is removed as GridLayoutScreen handles saving via context.
    // If HomeScreen needs notification for timer reset, it can be passed via onGridLayoutSave prop.
    const notifyLayoutSaved = (layout: GridLayoutType) => {
         if (onGridLayoutSave) {
            onGridLayoutSave(layout); // Call the prop if it exists
         }
    };


    const openCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(true); }, []);
    const closeCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(false); }, []);

    const openKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(true); }, []);
    const closeKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(false); }, []);
    const handleKeyboardSubmitInternal = useCallback((text: string) => {
        onTextInputSubmit(text); // Notify parent
        // closeKeyboardInput(); // Optionally close after submit
    }, [onTextInputSubmit]);

    // --- Render ---
    return (
        // Use Fragment as the Animated wrapper is in HomeScreen
        <>
            <LinearGradient
                colors={['#0077b6', '#005f94']} // Example gradient
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent}>
                    {/* Buttons: Search, Add, Grid, Home, Keyboard, Settings */}
                    <TouchableOpacity style={styles.button} onPress={openSearchScreen} accessibilityLabel="Search symbols"><FontAwesomeIcon icon={faSearch} size={26} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openCustomPageModal} accessibilityLabel="Add custom symbols"><FontAwesomeIcon icon={faPlus} size={26} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openGridLayoutScreen} accessibilityLabel="Change grid layout"><FontAwesomeIcon icon={faBoxes} size={26} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleHomePress} accessibilityLabel="Go home"><FontAwesomeIcon icon={faHome} size={26} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openKeyboardInput} accessibilityLabel="Open keyboard"><FontAwesomeIcon icon={faKeyboard} size={26} color="#fff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openMenu} accessibilityLabel="Open settings"><FontAwesomeIcon icon={faCog} size={26} color="#fff" /></TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- Modals Rendered by BottomBar --- */}
            <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu} >
                <Menu
                    slideAnim={menuSlideAnim}
                    overlayAnim={menuOverlayAnim}
                    closeMenu={closeMenu}
                    currentTtsSettings={currentTtsSettings}
                    onTtsSettingsSave={onTtsSettingsSave}
                />
            </Modal>

            {/* Search Screen Modal */}
            {isSearchScreenVisible && (
                <SearchScreen
                    onCloseSearch={closeSearchScreen}
                    language={currentLanguage}
                    onSelectSymbol={handleSymbolSelectFromSearch}
                />
             )}

            {/* Grid Layout Screen Modal - Removed unused props */}
             {isGridLayoutScreenVisible && (
                 <Modal visible={isGridLayoutScreenVisible} animationType="slide" onRequestClose={closeGridLayoutScreen} >
                    <GridLayoutScreen
                        onClose={closeGridLayoutScreen} // Screen closes itself
                        // Note: If you need to notify HomeScreen immediately on save,
                        // you'd modify GridLayoutScreen to accept an onSave prop again
                        // and call it within its handleLayoutSelect function *after* context update.
                        // Then pass notifyLayoutSaved (or onGridLayoutSave directly) here.
                    />
                 </Modal>
             )}

            {/* Custom Page Component Modal */}
             {isCustomPageModalVisible && (
                <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal}>
                    <CustomPageComponent
                        onBackPress={closeCustomPageModal}
                        onSymbolsUpdate={onCustomSymbolsUpdate} // Pass optional update handler
                    />
                </Modal>
             )}

             {/* Keyboard Input Component Modal */}
             {isKeyboardInputVisible && (
                 <KeyboardInputComponent
                     visible={isKeyboardInputVisible}
                     onClose={closeKeyboardInput}
                     onSubmit={handleKeyboardSubmitInternal}
                     placeholder="Type word or sentence..."
                 />
              )}
        </>
    );
});

// --- Styles ---
const styles = StyleSheet.create({
  bottomBarGradient: {
      height: BAR_HEIGHT, // Set height explicitly
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomBarContent: {
    flex: 1, // Fill the gradient height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%', // Make button fill height
  },
});

export default BottomBar;