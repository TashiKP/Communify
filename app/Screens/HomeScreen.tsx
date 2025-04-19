import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
    Keyboard,
    Easing,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- REQUIRED IMPORTS ---
import IconInputComponent from '../components/input'; // Adjust path
import Navbar from '../components/navbar';          // Adjust path
import SymbolGrid from '../components/Symbols';       // Adjust path (was NavBarComponent)
import BottomBar from '../components/bottomnav';    // Adjust path
// --- END REQUIRED IMPORTS ---

// --- TYPE IMPORT ---
// Import ONLY the TYPE if needed for state management here
// Adjust path to where GridLayoutType is exported (could be BottomGrid.tsx or GridLayoutScreen.tsx)
import { GridLayoutType } from '../components/GridLayoutScreen';
// --- END TYPE IMPORT ---


// --- Define types needed ---
type SymbolInfo = { keyword: string; pictogramUrl: string };
// Define SymbolItem type if managing custom symbols here & using the callback
// interface SymbolItem { id: string; name: string; imageUri?: string; }

// --- Configuration ---
const HIDE_DELAY = 4000;
const ANIMATION_DURATION_IN = 250;
const ANIMATION_DURATION_OUT = 350;
const BOTTOM_BAR_HEIGHT = 60; // Adjust if necessary

const HomeScreen = () => {
    // --- State ---
    const [isBarVisible, setIsBarVisible] = useState(true);
    // State managed by HomeScreen and passed down
    const [currentLayout, setCurrentLayout] = useState<GridLayoutType>('standard');
    const [currentLang, setCurrentLang] = useState('en');
    // Example state for symbols in sentence bar (IconInputComponent would need props/context)
    // const [sentenceSymbols, setSentenceSymbols] = useState<SymbolInfo[]>([]);

    // --- Animation ---
    const bottomBarPosition = useRef(new Animated.Value(0)).current;
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Animation Functions (Slide Up/Down) ---
    const slideUp = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: 0, duration: ANIMATION_DURATION_IN, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]);
    const slideDown = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 10 : 0), duration: ANIMATION_DURATION_OUT, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]);

    // --- Timer Logic for Auto-Hide ---
    const showAndResetTimer = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (!isBarVisible) { setIsBarVisible(true); slideUp(); } // Slide up only if hidden
        hideTimerRef.current = setTimeout(() => {
            if (Keyboard.isVisible()) { showAndResetTimer(); return; } // Don't hide if keyboard is up
            setIsBarVisible(false); slideDown(); hideTimerRef.current = null;
        }, HIDE_DELAY);
    }, [isBarVisible, slideUp, slideDown]); // Include dependencies

    // --- Effect for Initial Show & Cleanup ---
    useEffect(() => {
        showAndResetTimer(); // Show bar on mount
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }; // Cleanup timer
    }, [showAndResetTimer]); // Dependency ensures it runs once correctly


    // --- Handlers Passed to BottomBar ---
    const handleHomePress = useCallback(() => {
        console.log('Home Pressed');
        // Add logic to go to default/home state if needed (e.g., clear filters)
        // Reset auto-hide timer on interaction
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleSymbolSelect = useCallback((symbol: SymbolInfo) => {
        console.log('Symbol Selected in HomeScreen:', symbol);
        // --- Add logic here to update IconInputComponent's state ---
        // Example: setSentenceSymbols(prev => [...prev, symbol]);
        // Reset auto-hide timer on interaction
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleLayoutSave = useCallback((newLayout: GridLayoutType) => {
        console.log("Layout updated in HomeScreen:", newLayout);
        setCurrentLayout(newLayout); // Update state managed by HomeScreen
        // --- Add persistence logic here (e.g., save to AsyncStorage) ---
        // Reset auto-hide timer on interaction
        showAndResetTimer();
    }, [showAndResetTimer]);

    // Optional: Handler for Custom Symbol Updates via BottomBar
    const handleCustomSymbolsUpdate = useCallback((updatedSymbols: any[]) => { // Replace 'any' with correct type if needed
        console.log('Custom symbols updated notification in HomeScreen:', updatedSymbols.length);
        // Potentially update something else based on custom symbols changing
        // Reset auto-hide timer on interaction
        showAndResetTimer();
    }, [showAndResetTimer]);

    // Optional: Handler for Keyboard button press
    const handleKeyboardPress = useCallback(() => {
        console.log('Keyboard button pressed');
        // Add logic to show/hide a custom keyboard if needed
        showAndResetTimer();
    }, [showAndResetTimer]);


    // --- Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Navbar />
                <IconInputComponent
                    // Pass needed props, e.g., symbols array, clear/backspace handlers
                    // selectedSymbols={sentenceSymbols}
                    // onClearPress={() => setSentenceSymbols([])}
                    // onBackspacePress={() => setSentenceSymbols(prev => prev.slice(0, -1))}
                />

                {/* Main content area */}
                {/* TouchableWithoutFeedback allows resetting the timer when tapping the content */}
                <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
                    <View style={styles.mainContent}>
                        <SymbolGrid
                            // layoutType={currentLayout} // Pass layout if SymbolGrid needs it
                        />
                    </View>
                </TouchableWithoutFeedback>

                {/* Animated Wrapper for BottomBar */}
                <Animated.View
                    style={[
                        styles.bottomBarContainer,
                        { transform: [{ translateY: bottomBarPosition }] }
                    ]}
                    pointerEvents={isBarVisible ? 'auto' : 'none'} // Make non-interactive when hidden
                >
                    <BottomBar
                        // Note: handlePlusPress is NOT passed, as BottomBar handles its modal internally
                        handleHomePress={handleHomePress}
                        handleKeyboardPress={handleKeyboardPress} // Pass handler if defined
                        onSymbolSelected={handleSymbolSelect}
                        currentLanguage={currentLang} // Pass current language state
                        currentGridLayout={currentLayout} // Pass current layout state
                        onGridLayoutSave={handleLayoutSave} // Pass save handler
                        onCustomSymbolsUpdate={handleCustomSymbolsUpdate} // Optional
                    />
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f9ff', // Or your app's primary background/Navbar color
    },
    container: {
        flex: 1,
        overflow: 'hidden', // Hide bottom bar when it moves below
    },
    mainContent: {
        flex: 1, // Crucial: Allows this area to expand and contract
        backgroundColor: '#f0f9ff', // Or your main content background
    },
    bottomBarContainer: {
        position: 'absolute', // Position over content
        bottom: 0,
        left: 0,
        right: 0,
        // Height is determined by the BottomBar component itself
    },
});

export default HomeScreen;