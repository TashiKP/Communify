import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated, // Import Animated
    Platform,
    Easing, // For animation timing
    Text // For potential labels on toggle button
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faSearch, faPlus, faBoxes, faHome, faKeyboard, faCog,
    faChevronUp, // Icon for showing the bar
    faChevronDown // Icon for hiding the bar
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient'; // Optional gradient

// Import Components/Screens
import Menu, { menuWidth } from '../components/menu';
import SearchScreen from './SearchScreen';
import GridLayoutScreen, { GridLayoutType } from './GridLayoutScreen';
import CustomPageComponent from './CustomPageComponent';
import KeyboardInputComponent from './KeyboardInputComponent';

// --- Constants ---
const BAR_HEIGHT = 65; // Estimated height of the bottom bar + border/padding
const TOGGLE_BUTTON_SIZE = 50;

// --- Props Interface ---
type BottomBarProps = {
    handleHomePress: () => void;
    onSymbolSelected: (symbol: { keyword: string; pictogramUrl: string }) => void;
    onTextInputSubmit: (text: string) => void;
    currentLanguage?: string;
    currentGridLayout?: GridLayoutType;
    onGridLayoutSave: (layout: GridLayoutType) => void;
    onCustomSymbolsUpdate?: (symbols: any[]) => void;
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
}) => {
  // --- State ---
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
  const [isGridLayoutScreenVisible, setIsGridLayoutScreenVisible] = useState(false);
  const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
  const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);
  const [isBarVisible, setIsBarVisible] = useState(true); // State to control bar visibility

  // --- Animation Values ---
  const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
  const menuOverlayAnim = useRef(new Animated.Value(0)).current;
  // Animation for the bar sliding up/down
  const barSlideAnim = useRef(new Animated.Value(0)).current; // 0 = visible, BAR_HEIGHT = hidden

  // --- Animation Logic ---
  useEffect(() => {
    // Animate bar based on isBarVisible state
    Animated.timing(barSlideAnim, {
      toValue: isBarVisible ? 0 : BAR_HEIGHT, // Target value based on state
      duration: 250, // Animation duration
      easing: Easing.out(Easing.ease), // Smooth easing
      useNativeDriver: true, // Use native driver for performance
    }).start();
  }, [isBarVisible, barSlideAnim]);

  // --- Toggle Bar Visibility ---
  const toggleBarVisibility = () => {
      setIsBarVisible(prev => !prev);
  };

  // --- Menu Handlers --- (remain the same)
  const openMenu = useCallback(() => { setMenuVisible(true); Animated.parallel([ Animated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 10 }), Animated.timing(menuOverlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }), ]).start(); }, [menuSlideAnim, menuOverlayAnim]);
  const closeMenu = useCallback(() => { Animated.parallel([ Animated.spring(menuSlideAnim, { toValue: -menuWidth, useNativeDriver: true, bounciness: 4, speed: 10 }), Animated.timing(menuOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }), ]).start(() => setMenuVisible(false)); }, [menuSlideAnim, menuOverlayAnim]);

  // --- Other Modal/Screen Handlers --- (remain the same)
  const openSearchScreen = useCallback(() => { setIsSearchScreenVisible(true); }, []);
  const closeSearchScreen = useCallback(() => { setIsSearchScreenVisible(false); }, []);
  const handleSymbolSelect = useCallback((symbol: { keyword: string; pictogramUrl: string }) => { onSymbolSelected(symbol); setIsSearchScreenVisible(false); }, [onSymbolSelected]);
  const openGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(true); }, []);
  const closeGridLayoutScreen = useCallback(() => { setIsGridLayoutScreenVisible(false); }, []);
  const handleSaveGridLayout = useCallback((layout: GridLayoutType) => { onGridLayoutSave(layout); }, [onGridLayoutSave]);
  const openCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(true); }, []);
  const closeCustomPageModal = useCallback(() => { setIsCustomPageModalVisible(false); }, []);
  const openKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(true); }, []);
  const closeKeyboardInput = useCallback(() => { setIsKeyboardInputVisible(false); }, []);
  const handleKeyboardSubmit = useCallback((text: string) => { onTextInputSubmit(text); closeKeyboardInput(); }, [onTextInputSubmit, closeKeyboardInput]);

  // --- Render ---
  return (
    // Use React.Fragment to render multiple root-level elements (Bar + Toggle Button + Modals)
    <>
        {/* The Animated Bottom Bar Container */}
        <Animated.View
            style={[
                styles.bottomBarContainer, // Absolute positioning
                { transform: [{ translateY: barSlideAnim }] } // Apply slide animation
            ]}
        >
             {/* Optional Gradient Background */}
            <LinearGradient
                 colors={['#0077b6', '#005f94']} // Example gradient colors
                 style={styles.bottomBarGradient}
            >
                {/* Actual Bar Content */}
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
        </Animated.View>

        {/* Floating Toggle Button - Rendered separately, positioned absolutely */}
        <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleBarVisibility}
            activeOpacity={0.8}
            accessibilityLabel={isBarVisible ? "Hide toolbar" : "Show toolbar"}
        >
             <FontAwesomeIcon icon={isBarVisible ? faChevronDown : faChevronUp} size={20} color="#0077b6" />
             {/* Optional Text Label: */}
             {/* <Text style={styles.toggleButtonText}>{isBarVisible ? 'Hide' : 'Show'}</Text> */}
        </TouchableOpacity>

        {/* --- Modals Rendered by BottomBar --- */}
        {/* (Modal rendering logic remains the same) */}
        <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu} >
            <Menu slideAnim={menuSlideAnim} overlayAnim={menuOverlayAnim} closeMenu={closeMenu} />
        </Modal>

        {isSearchScreenVisible && (
            <SearchScreen onCloseSearch={closeSearchScreen} language={currentLanguage} onSelectSymbol={handleSymbolSelect} />
        )}

        <Modal visible={isGridLayoutScreenVisible} animationType="slide" onRequestClose={closeGridLayoutScreen} >
            <GridLayoutScreen onClose={closeGridLayoutScreen} initialLayout={currentGridLayout} onSave={handleSaveGridLayout} />
        </Modal>

        <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal} >
            <CustomPageComponent onBackPress={closeCustomPageModal} onSymbolsUpdate={onCustomSymbolsUpdate} />
        </Modal>

        <KeyboardInputComponent
            visible={isKeyboardInputVisible}
            onClose={closeKeyboardInput}
            onSubmit={handleKeyboardSubmit}
            placeholder="Type word or sentence..."
        />
    </>
  );
});

// --- Styles ---
const styles = StyleSheet.create({
  bottomBarContainer: { // Container for positioning and animation
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT, // Use constant height
    zIndex: 5, // Ensure bar is above content but potentially below modals
  },
  bottomBarGradient: { // Style for the gradient layer
      flex: 1, // Take full height of container
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)', // Lighter border on top
  },
  bottomBarContent: { // Holds the buttons
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5, // Keep horizontal padding
    paddingVertical: 5, // Adjust vertical padding if needed
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Adjust padding for slightly larger icons
     height: '100%', // Make button fill height
  },
  // --- Floating Toggle Button ---
  toggleButton: {
      position: 'absolute',
      // Center horizontally, adjust left/right if needed
      alignSelf: 'center',
      // Position above the bottom bar's height + some margin
      bottom: BAR_HEIGHT - (TOGGLE_BUTTON_SIZE / 2) + 10, // Overlap slightly when shown, clear when hidden
      width: TOGGLE_BUTTON_SIZE,
      height: TOGGLE_BUTTON_SIZE,
      borderRadius: TOGGLE_BUTTON_SIZE / 2, // Make it circular
      backgroundColor: '#ffffff', // White background
      justifyContent: 'center',
      alignItems: 'center',
      // Shadow/Elevation for FAB effect
      shadowColor: "#000",
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 10, // Ensure toggle button is above the bar
  },
  // Optional text style if adding text to toggle button
  // toggleButtonText: {
  //     fontSize: 10,
  //     color: '#0077b6',
  //     marginTop: 2,
  // },
});

export default BottomBar;