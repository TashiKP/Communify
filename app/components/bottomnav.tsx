// src/components/bottomnav.tsx (Assuming this is your BottomBar component)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Platform, Text
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faBoxes, faHome, faKeyboard, faCog
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next'; // <-- Import i18next hook

// --- Import Appearance Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Import Other Components/Screens/Types --- (Adjust paths as necessary)
import Menu, { menuWidth } from './menu'; // Assuming menu.tsx exports menuWidth
import SearchScreen from './SearchScreen';
import CustomPageComponent from './CustomPageComponent';
import KeyboardInputComponent from './KeyboardInputComponent';
import { VoiceSettingData } from './SymbolVoiceOverScreen';
import { GridLayoutType } from '../context/GridContext';

// --- Constants ---
const BAR_HEIGHT = 65;

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void;
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void;
    onTextInputSubmit: (text: string) => void;
    currentLanguage?: string;
    onGridLayoutSave?: (layout: GridLayoutType) => void; // Still here, though Menu might handle directly
    onCustomSymbolsUpdate?: (symbols: any[]) => void; // Replace 'any' with actual SymbolItem[] type
    currentTtsSettings: VoiceSettingData;
    onTtsSettingsSave: (settings: VoiceSettingData) => void;
};

// --- Component ---
const BottomBar: React.FC<BottomBarProps> = React.memo(({
    handleHomePress,
    onSymbolSelected,
    onTextInputSubmit,
    currentLanguage = 'en', // Default if not provided
    // onGridLayoutSave, // Consider if Menu handles grid layout saving directly via context
    onCustomSymbolsUpdate,
    currentTtsSettings,
    onTtsSettingsSave,
}) => {
    // --- Hooks ---
    const { theme, fonts } = useAppearance();
    const { t, i18n } = useTranslation(); // <-- Use the translation hook

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts), [theme, fonts]);

    // --- State & Animation ---
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
    const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
    const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);
    const isMountedRef = useRef(true);


    const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
    const menuOverlayAnim = useRef(new Animated.Value(0)).current;

    // --- Mount/Unmount Effect ---
    useEffect(() => {
        isMountedRef.current = true;
        console.log('BottomBar.tsx: Mounted. typeof t =', typeof t, 'i18n initialized:', i18n.isInitialized);
        return () => { isMountedRef.current = false; };
    }, [t, i18n.isInitialized]);


    // --- Menu Handlers ---
    const openMenu = useCallback(() => {
        if (!isMountedRef.current) return;
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
        ]).start(() => { if(isMountedRef.current) setMenuVisible(false); });
    }, [menuSlideAnim, menuOverlayAnim]);

    // --- Other Modal/Screen Handlers ---
    const openSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(true); }, []);
    const closeSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(false); }, []);
    const handleSymbolSelectFromSearch = useCallback((symbol: { keyword: string; pictogramUrl: string }) => {
        onSymbolSelected(symbol);
        closeSearchScreen();
    }, [onSymbolSelected, closeSearchScreen]);

    const openCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(true); }, []);
    const closeCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(false); }, []);

    const openKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(true); }, []);
    const closeKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(false); }, []);
    const handleKeyboardSubmitInternal = useCallback((text: string) => {
        onTextInputSubmit(text);
        // Optional: closeKeyboardInput();
    }, [onTextInputSubmit]);


    // --- Render Guard for i18n ---
    if (!i18n.isInitialized || typeof t !== 'function') {
        console.log("BottomBar.tsx: Rendering minimal bar because 't' function is not ready or i18n not initialized.");
        // Render a minimal bar or null if t is not ready
        return (
            <LinearGradient
                colors={[theme.primary || '#0077b6', theme.isDark ? (theme.primaryMuted || '#005082') : (theme.primary || '#0077b6')]}
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent} />
            </LinearGradient>
        );
    }

    return (
        <>
            <LinearGradient
                colors={[theme.primary, theme.isDark ? theme.primaryMuted : theme.primary]}
                style={styles.bottomBarGradient}
            >
                <View style={styles.bottomBarContent}>
                    <TouchableOpacity style={styles.button} onPress={openSearchScreen} accessibilityLabel={t('bottomNav.search')}>
                        <FontAwesomeIcon icon={faSearch} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openCustomPageModal} accessibilityLabel={t('bottomNav.addCustom')}>
                        <FontAwesomeIcon icon={faPlus} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleHomePress} accessibilityLabel={t('bottomNav.home')}>
                        <FontAwesomeIcon icon={faHome} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openKeyboardInput} accessibilityLabel={t('bottomNav.keyboard')}>
                        <FontAwesomeIcon icon={faKeyboard} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={openMenu} accessibilityLabel={t('bottomNav.settings')}>
                        <FontAwesomeIcon icon={faCog} size={fonts.h1 * 0.9} color={theme.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Menu Modal */}
            <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu} >
                <Menu
                    slideAnim={menuSlideAnim}
                    overlayAnim={menuOverlayAnim}
                    closeMenu={closeMenu}
                    currentTtsSettings={currentTtsSettings}
                    onTtsSettingsSave={onTtsSettingsSave}
                    // onGridLayoutSave={onGridLayoutSave} // Pass if Menu still handles grid layout directly
                />
            </Modal>

            {/* Search Screen Modal */}
            {isSearchScreenVisible && ( // Render only when visible to ensure SearchScreen mounts and can use useTranslation
                <SearchScreen
                    onCloseSearch={closeSearchScreen}
                    language={currentLanguage} // Arasaac search language
                    onSelectSymbol={handleSymbolSelectFromSearch}
                />
             )}

             {/* Custom Page Component Modal */}
             {isCustomPageModalVisible && ( // Render only when visible
                <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal}>
                    <CustomPageComponent
                        onBackPress={closeCustomPageModal}
                        onSymbolsUpdate={onCustomSymbolsUpdate}
                    />
                </Modal>
             )}

             {/* Keyboard Input Component Modal */}
             {isKeyboardInputVisible && ( // Render only when visible
                 <KeyboardInputComponent
                     visible={isKeyboardInputVisible}
                     onClose={closeKeyboardInput}
                     onSubmit={handleKeyboardSubmitInternal}
                     placeholder={t('keyboardInput.defaultPlaceholder')} // Pass translated placeholder
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