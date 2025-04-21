// src/components/bottomnav.tsx (BottomBar)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Platform, Text // Added Text, Platform
} from 'react-native'; // Added other imports
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faBoxes, faHome, faKeyboard, faCog,
    faChevronUp, // Removed if toggle logic moved
    faChevronDown // Removed if toggle logic moved
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';

// --- Import Components/Screens/Types --- (Adjust paths as necessary)
import Menu, { menuWidth } from '../components/menu'; // Assuming Menu exports menuWidth
import SearchScreen from '../components/SearchScreen';
import GridLayoutScreen, { GridLayoutType } from '../components/GridLayoutScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import KeyboardInputComponent from '../components/KeyboardInputComponent';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // Import VoiceSettingData type

// --- Constants ---
const BAR_HEIGHT = 65; // Make sure this matches actual height
// const TOGGLE_BUTTON_SIZE = 50; // Removed if toggle logic moved

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void;
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void; // From Search modal
    onTextInputSubmit: (text: string) => void; // From Keyboard modal
    currentLanguage?: string;
    currentGridLayout?: GridLayoutType;
    onGridLayoutSave: (layout: GridLayoutType) => void;
    onCustomSymbolsUpdate?: (symbols: any[]) => void;
    // --- Add TTS Props ---
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
    // ---------------------
};

// --- Component ---
const BottomBar: React.FC<BottomBarProps> = React.memo(({
    handleHomePress,
    onSymbolSelected,
    onTextInputSubmit,
    currentLanguage = 'en',
    currentGridLayout = 'standard',
    onGridLayoutSave,
    onCustomSymbolsUpdate,
    // --- Destructure TTS Props ---
    currentTtsSettings,
    onTtsSettingsSave,
    // ---------------------------
}) => {
    // --- State & Animation ---
    // Modals visibility state
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
    const [isGridLayoutScreenVisible, setIsGridLayoutScreenVisible] = useState(false);
    const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
    const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);

    // Menu animation values
    const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
    const menuOverlayAnim = useRef(new Animated.Value(0)).current;

    // Removed bar visibility logic (controlled by HomeScreen)

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
        onSymbolSelected(symbol); // Call parent handler
        closeSearchScreen(); // Close the modal
    }, [onSymbolSelected, closeSearchScreen]);

    const openGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(true); }, []);
    const closeGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(false); }, []);
    // onSave for GridLayoutScreen calls the prop, parent handles feedback, screen closes itself via onClose
    const handleSaveGridLayout = useCallback((layout: GridLayoutType) => {
        onGridLayoutSave(layout); // Let parent handle saving/state update
        // The GridLayoutScreen itself calls its onClose prop when saving
    }, [onGridLayoutSave]);

    const openCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(true); }, []);
    const closeCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(false); }, []);

    const openKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(true); }, []);
    const closeKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(false); }, []);
    const handleKeyboardSubmitInternal = useCallback((text: string) => {
        onTextInputSubmit(text); // Call parent handler
        // Keep keyboard input open or close based on preference
        // closeKeyboardInput();
    }, [onTextInputSubmit /*, closeKeyboardInput */]);


    // --- Render ---
    return (
        // Use Fragment as the Animated wrapper is now in HomeScreen
        <>
            <LinearGradient
                colors={['#0077b6', '#005f94']} // Example gradient
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent}>
                    {/* Search Button */}
                    <TouchableOpacity style={styles.button} onPress={openSearchScreen} accessibilityLabel="Search symbols">
                    <FontAwesomeIcon icon={faSearch} size={26} color="#fff" />
                    </TouchableOpacity>

                    {/* Add Button */}
                    <TouchableOpacity style={styles.button} onPress={openCustomPageModal} accessibilityLabel="Add or manage custom symbols">
                    <FontAwesomeIcon icon={faPlus} size={26} color="#fff" />
                    </TouchableOpacity>

                    {/* Grid/Boxes Button */}
                    <TouchableOpacity style={styles.button} onPress={openGridLayoutScreen} accessibilityLabel="Change grid layout">
                    <FontAwesomeIcon icon={faBoxes} size={26} color="#fff" />
                    </TouchableOpacity>

                    {/* Home Button */}
                    <TouchableOpacity style={styles.button} onPress={handleHomePress} accessibilityLabel="Go to home screen">
                    <FontAwesomeIcon icon={faHome} size={26} color="#fff" />
                    </TouchableOpacity>

                    {/* Keyboard Button */}
                    <TouchableOpacity style={styles.button} onPress={openKeyboardInput} accessibilityLabel="Open keyboard input">
                    <FontAwesomeIcon icon={faKeyboard} size={26} color="#fff" />
                    </TouchableOpacity>

                    {/* Settings Button */}
                    <TouchableOpacity style={styles.button} onPress={openMenu} accessibilityLabel="Open settings menu">
                    <FontAwesomeIcon icon={faCog} size={26} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- Modals Rendered by BottomBar --- */}
            <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu} >
                {/* Pass TTS Settings and Save Handler to Menu */}
                <Menu
                    slideAnim={menuSlideAnim}
                    overlayAnim={menuOverlayAnim}
                    closeMenu={closeMenu}
                    currentTtsSettings={currentTtsSettings} // <-- Pass down
                    onTtsSettingsSave={onTtsSettingsSave}   // <-- Pass down
                />
            </Modal>

            {/* --- Other Modals --- */}
            {/* Search Screen is now a Modal itself */}
            {isSearchScreenVisible && (
                <SearchScreen
                    onCloseSearch={closeSearchScreen}
                    language={currentLanguage}
                    onSelectSymbol={handleSymbolSelectFromSearch}
                />
             )}

            {/* Grid Layout Screen presented as a Modal */}
             {isGridLayoutScreenVisible && (
                 <Modal visible={isGridLayoutScreenVisible} animationType="slide" onRequestClose={closeGridLayoutScreen} >
                    <GridLayoutScreen
                        onClose={closeGridLayoutScreen} // Allow screen to close itself
                        initialLayout={currentGridLayout}
                        onSave={handleSaveGridLayout} // Parent notified on save
                    />
                 </Modal>
             )}

            {/* Custom Page Component presented as a Modal */}
             {isCustomPageModalVisible && (
                <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal}>
                    <CustomPageComponent
                        onBackPress={closeCustomPageModal} // Allow screen to close itself
                        onSymbolsUpdate={onCustomSymbolsUpdate}
                    />
                </Modal>
             )}

             {/* Keyboard Input Component presented as a Modal */}
             {isKeyboardInputVisible && (
                 <KeyboardInputComponent
                     visible={isKeyboardInputVisible} // Controls modal visibility
                     onClose={closeKeyboardInput} // Allow screen to close itself
                     onSubmit={handleKeyboardSubmitInternal} // Parent notified on submit
                     placeholder="Type word or sentence..."
                 />
              )}
        </>
    );
});

// --- Styles ---
const styles = StyleSheet.create({
  // Removed container style
  bottomBarGradient: {
      // Removed flex: 1, height determined by container or content
      height: BAR_HEIGHT, // Set height explicitly
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomBarContent: {
    flex: 1, // Fill the gradient height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    // Removed paddingVertical: 5 if BAR_HEIGHT handles it
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed paddingVertical: 8
    height: '100%', // Make button fill height
  },
  // Removed toggle button styles
});

export default BottomBar;