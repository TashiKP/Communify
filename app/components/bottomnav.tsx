// src/components/bottomnav.tsx (BottomBar)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'; // Added useMemo
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Platform, Text
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faBoxes, faHome, faKeyboard, faCog
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Import Other Components/Screens/Types --- (Adjust paths as necessary)
import Menu, { menuWidth } from './menu';
import SearchScreen from './SearchScreen';
import CustomPageComponent from './CustomPageComponent';
import KeyboardInputComponent from './KeyboardInputComponent';
import { VoiceSettingData } from './SymbolVoiceOverScreen';
import { GridLayoutType } from '../context/GridContext';

// --- Constants ---
const BAR_HEIGHT = 65; // Ensure this matches the height used in HomeScreen animation

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void; // Callback for Home button press
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void; // Callback for symbol selected from Search
    onTextInputSubmit: (text: string) => void; // Callback for text submitted from Keyboard
    currentLanguage?: string; // Language passed down to SearchScreen
    onGridLayoutSave?: (layout: GridLayoutType) => void; // Optional callback if needed
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
    onGridLayoutSave,
    onCustomSymbolsUpdate,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    // --- Appearance Context ---
    const { theme, fonts } = useAppearance();

    // --- Dynamic Styles ---
    // Memoize styles to update only when theme or fonts change
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- State & Animation (Keep as before) ---
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
    // GridLayoutScreen is likely now opened from within Menu, so remove state for it here
    // const [isGridLayoutScreenVisible, setIsGridLayoutScreenVisible] = useState(false);
    const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
    const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);

    const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
    const menuOverlayAnim = useRef(new Animated.Value(0)).current;

    // --- Menu Handlers (Keep as before) ---
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

    // --- Other Modal/Screen Handlers (Keep as before, remove GridLayout specific ones) ---
    const openSearchScreen = useCallback(() => { setIsSearchScreenVisible(true); }, []);
    const closeSearchScreen = useCallback(() => { setIsSearchScreenVisible(false); }, []);
    const handleSymbolSelectFromSearch = useCallback((symbol: { keyword: string; pictogramUrl: string }) => {
        onSymbolSelected(symbol);
        closeSearchScreen();
    }, [onSymbolSelected, closeSearchScreen]);

    // GridLayoutScreen is likely opened from Menu now
    // const openGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(true); }, []);
    // const closeGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(false); }, []);
    // const notifyLayoutSaved = (layout: GridLayoutType) => { ... }; // Remove if not needed

    const openCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(true); }, []);
    const closeCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(false); }, []);

    const openKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(true); }, []);
    const closeKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(false); }, []);
    const handleKeyboardSubmitInternal = useCallback((text: string) => {
        onTextInputSubmit(text);
        // closeKeyboardInput(); // Keep or remove based on desired UX
    }, [onTextInputSubmit]);

    // --- Render ---
    return (
        <>
            <LinearGradient
                // Use theme colors for gradient
                colors={[theme.primary, theme.isDark ? theme.primaryMuted : theme.primary]} // Example: primary to muted on dark, solid on light
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent}>
                    {/* Buttons: Use theme colors and font sizes */}
                    <TouchableOpacity style={styles.button} onPress={openSearchScreen} accessibilityLabel="Search symbols">
                        <FontAwesomeIcon icon={faSearch} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openCustomPageModal} accessibilityLabel="Add custom symbols">
                        <FontAwesomeIcon icon={faPlus} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleHomePress} accessibilityLabel="Go home">
                        <FontAwesomeIcon icon={faHome} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openKeyboardInput} accessibilityLabel="Open keyboard">
                        <FontAwesomeIcon icon={faKeyboard} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openMenu} accessibilityLabel="Open settings">
                        <FontAwesomeIcon icon={faCog} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- Modals Rendered by BottomBar --- */}
            {/* Menu Modal - Menu itself will use the theme context */}
            <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu} >
                <Menu
                    slideAnim={menuSlideAnim}
                    overlayAnim={menuOverlayAnim}
                    closeMenu={closeMenu}
                    currentTtsSettings={currentTtsSettings}
                    onTtsSettingsSave={onTtsSettingsSave}
                />
            </Modal>

            {/* Search Screen Modal - Needs refactoring to use context */}
            {isSearchScreenVisible && (
                <SearchScreen
                    onCloseSearch={closeSearchScreen}
                    language={currentLanguage}
                    onSelectSymbol={handleSymbolSelectFromSearch}
                    // TODO: Pass theme/fonts or make SearchScreen use context
                />
             )}

            {/* Custom Page Component Modal - Needs refactoring to use context */}
             {isCustomPageModalVisible && (
                <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal}>
                    <CustomPageComponent
                        onBackPress={closeCustomPageModal}
                        onSymbolsUpdate={onCustomSymbolsUpdate}
                         // TODO: Pass theme/fonts or make CustomPageComponent use context
                    />
                </Modal>
             )}

             {/* Keyboard Input Component Modal - Needs refactoring to use context */}
             {isKeyboardInputVisible && (
                 <KeyboardInputComponent
                     visible={isKeyboardInputVisible}
                     onClose={closeKeyboardInput}
                     onSubmit={handleKeyboardSubmitInternal}
                     placeholder="Type word or sentence..."
                     // TODO: Pass theme/fonts or make KeyboardInputComponent use context
                 />
              )}
        </>
    );
});

// --- Helper Function for Themed Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes) => StyleSheet.create({
  bottomBarGradient: {
      height: BAR_HEIGHT,
      // Use theme border color if needed, or a subtle overlay
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
  },
  bottomBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    // Background color is handled by gradient
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    // Add ripple effect configuration if desired (Platform specific)
  },
  // Add styles for Modals/Screens if they need specific themed styling here
  // Or preferably, theme them within their own components using useAppearance()
});

export default BottomBar;