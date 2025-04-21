// src/Screens/HomeScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
    Keyboard,
    Easing,
    Platform,
    Text, // Added for rendering input items
    Alert, // Added for TTS errors
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts from 'react-native-tts'; // Added for TTS

// --- REQUIRED IMPORTS --- (Adjust paths as necessary)
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import SymbolGrid from '../components/Symbols'; // Renamed from NavBarComponent
import BottomBar from '../components/bottomnav';
// --- END REQUIRED IMPORTS ---

// --- TYPE IMPORTS --- (Adjust paths as necessary)
import { GridLayoutType } from '../components/GridLayoutScreen';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // Needed for TTS state

// --- Define types needed ---
type SearchSymbolInfo = { keyword: string; pictogramUrl: string }; // For search results passed to BottomBar handler
type SelectedSymbol = { id: string; keyword: string }; // For items in the sentence bar

// --- Default TTS Settings (Load these properly in a real app) ---
const defaultTtsSettings: VoiceSettingData = {
    pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false,
    volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false,
};

// --- Configuration ---
const HIDE_DELAY = 4000;
const ANIMATION_DURATION_IN = 250;
const ANIMATION_DURATION_OUT = 350;
const BOTTOM_BAR_HEIGHT = 60; // Adjust if BottomBar height changes

const HomeScreen = () => {
    // --- State ---
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [currentLayout, setCurrentLayout] = useState<GridLayoutType>('standard');
    const [currentLang, setCurrentLang] = useState('en');
    // State for sentence bar content
    const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);
    // State for TTS
    // TODO: Load actual TTS settings from storage or context
    const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
    const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
    const [isTtsInitialized, setIsTtsInitialized] = useState(false);

    // --- Animation ---
    const bottomBarPosition = useRef(new Animated.Value(0)).current;
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Animation Functions (Slide Up/Down) ---
    const slideUp = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: 0, duration: ANIMATION_DURATION_IN, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]);
    const slideDown = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 30 : 10), duration: ANIMATION_DURATION_OUT, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]); // Increased slide down value

    // --- Timer Logic for Auto-Hide ---
    const showAndResetTimer = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (!isBarVisible) { setIsBarVisible(true); slideUp(); }
        hideTimerRef.current = setTimeout(() => {
             // Check if keyboard is visible before hiding
             // Note: Keyboard.isVisible() is not officially documented/reliable.
             // A more robust solution involves keyboard event listeners if this check fails.
            // if (Keyboard.isVisible()) {
            //     console.log("Keyboard visible, resetting timer");
            //     showAndResetTimer();
            //     return;
            // }
            setIsBarVisible(false); slideDown(); hideTimerRef.current = null;
        }, HIDE_DELAY);
    }, [isBarVisible, slideUp, slideDown]);

    // --- Effect for Initial Show & Cleanup ---
    useEffect(() => {
        showAndResetTimer();
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    }, [showAndResetTimer]);

    // --- TTS Initialization and Listeners ---
    useEffect(() => {
        let isMounted = true;
        let startListener: any = null;
        let finishListener: any = null;
        let cancelListener: any = null;

        const initializeTts = async () => {
            console.log("Attempting TTS Initialization...");
            try {
                await Tts.setDefaultLanguage(currentLang); // Use current language
                if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
                await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
                await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
                await Tts.getInitStatus();

                startListener = Tts.addEventListener('tts-start', () => isMounted && setIsTtsSpeaking(true));
                finishListener = Tts.addEventListener('tts-finish', () => isMounted && setIsTtsSpeaking(false));
                cancelListener = Tts.addEventListener('tts-cancel', () => isMounted && setIsTtsSpeaking(false));

                if (isMounted) setIsTtsInitialized(true);
                console.log("TTS Initialized Successfully");

            } catch (err: any) {
                 console.error('TTS Initialization failed:', err);
                 if (isMounted && err.message !== 'TTS engine is not ready') {
                     Alert.alert('TTS Error', `Text-to-Speech engine failed to initialize. (${err.message})`);
                 }
                 if (isMounted) setIsTtsInitialized(false);
            }
        };

        initializeTts();

        return () => {
            isMounted = false; Tts.stop();
            startListener?.remove(); finishListener?.remove(); cancelListener?.remove();
            console.log("TTS Listeners Cleaned Up");
        };
     // Re-init if language or core voice settings change that require it
     }, [currentLang, ttsSettings.selectedVoiceId, ttsSettings.pitch, ttsSettings.speed]);


    // --- Handlers for SymbolGrid and IconInputComponent ---
    const handleSymbolPress = useCallback((keyword: string) => {
        // console.log(`HomeScreen: Symbol Pressed - ${keyword}`);
        setSelectedItems(prev => [
            ...prev,
            { keyword, id: `${Date.now()}-${keyword}-${prev.length}` }
        ]);
        showAndResetTimer(); // Reset timer on interaction
    }, [showAndResetTimer]); // Dependency on timer reset function

    const handleSpeakPress = useCallback(async () => {
        showAndResetTimer(); // Reset timer on interaction
        if (!isTtsInitialized) { Alert.alert("TTS Error", "Text-to-Speech is not ready."); return; }
        if (isTtsSpeaking) { Tts.stop(); return; } // Listener handles setIsTtsSpeaking(false)
        if (selectedItems.length === 0) return;

        const sentence = selectedItems.map(item => item.keyword).join(' ');
        console.log(`HomeScreen: Speaking - "${sentence}"`);
        try {
            // Ensure settings are applied (optional if done in init/effect)
             if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
             await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
             await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
            Tts.speak(sentence); // Listener handles setIsTtsSpeaking(true)
        } catch (error) {
            console.error("TTS Speak error:", error); setIsTtsSpeaking(false);
            Alert.alert("Speak Error", "Could not speak the sentence.");
        }
    }, [selectedItems, isTtsSpeaking, ttsSettings, isTtsInitialized, showAndResetTimer]); // Dependencies

    const handleBackspacePress = useCallback(() => {
        setSelectedItems(prev => prev.slice(0, -1));
        showAndResetTimer(); // Reset timer on interaction
    }, [showAndResetTimer]);

    const handleClearPress = useCallback(() => {
        setSelectedItems([]);
        if (isTtsSpeaking) Tts.stop(); // Stop speech if clearing
        showAndResetTimer(); // Reset timer on interaction
    }, [isTtsSpeaking, showAndResetTimer]);


    // --- Handlers Passed to BottomBar ---
    const handleHomePress = useCallback(() => {
        console.log('Home Pressed');
        // Add logic like setSelectedItems([]) or reset filters in SymbolGrid if needed
        showAndResetTimer();
    }, [showAndResetTimer]);

    // Handler for symbols selected via the SEARCH modal (from BottomBar)
    const handleSearchSymbolSelect = useCallback((symbol: SearchSymbolInfo) => {
        console.log('Search Symbol Selected in HomeScreen:', symbol);
        setSelectedItems(prev => [
            ...prev,
            { keyword: symbol.keyword, id: `${Date.now()}-${symbol.keyword}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);

    // Handler for text submitted via the KEYBOARD INPUT modal (from BottomBar)
    const handleTextInputSubmit = useCallback((text: string) => {
        console.log('Text Input Submitted in HomeScreen:', text);
         // Treat the whole text as one "symbol" or word
         setSelectedItems(prev => [
            ...prev,
            { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);


    const handleLayoutSave = useCallback((newLayout: GridLayoutType) => {
        console.log("Layout updated in HomeScreen:", newLayout);
        setCurrentLayout(newLayout);
        // Add persistence logic here
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleCustomSymbolsUpdate = useCallback((updatedSymbols: any[]) => {
        console.log('Custom symbols updated notification:', updatedSymbols.length);
        showAndResetTimer();
    }, [showAndResetTimer]);


    // --- Render Input Bar Children ---
    const renderInputItems = () => {
        if (selectedItems.length === 0) return null;
        return selectedItems.map((item) => (
            <View key={item.id} style={styles.inputItemChip}>
                <Text style={styles.inputItemText}>{item.keyword}</Text>
            </View>
        ));
    };

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}> {/* Control safe area edges */}
            <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
                 <View style={styles.container}>
                    <Navbar />
                    <IconInputComponent
                        onSpeakPress={handleSpeakPress}
                        onBackspacePress={handleBackspacePress}
                        onClearPress={handleClearPress}
                        isSpeakDisabled={selectedItems.length === 0 || isTtsSpeaking || !isTtsInitialized}
                        isBackspaceDisabled={selectedItems.length === 0}
                        isClearDisabled={selectedItems.length === 0}
                    >
                        {renderInputItems()}
                    </IconInputComponent>

                    {/* Main content area */}
                    {/* Added key to potentially help reset/remount SymbolGrid if needed, e.g., on layout change */}
                    <View style={styles.mainContent} key={`layout-${currentLayout}`}>
                        <SymbolGrid
                            // Pass layoutType={currentLayout} // If SymbolGrid uses it
                            onSymbolPress={handleSymbolPress} // Pass symbol press handler
                            key={currentLang} // Force re-render if language changes
                        />
                    </View>

                    {/* Animated Wrapper for BottomBar */}
                    {/* Note: BottomBar logic for its own hide/show toggle needs review/integration if kept */}
                    <Animated.View
                        style={[
                            styles.bottomBarContainer,
                            { transform: [{ translateY: bottomBarPosition }] }
                        ]}
                        pointerEvents={isBarVisible ? 'auto' : 'none'}
                    >
                        <BottomBar
                            // --- Pass Handlers from HomeScreen ---
                            handleHomePress={handleHomePress}
                            onSymbolSelected={handleSearchSymbolSelect} // Handler for SEARCH modal results
                            onTextInputSubmit={handleTextInputSubmit} // Handler for KEYBOARD modal results
                            currentLanguage={currentLang}
                            currentGridLayout={currentLayout}
                            onGridLayoutSave={handleLayoutSave}
                            onCustomSymbolsUpdate={handleCustomSymbolsUpdate}
                            // Pass TTS state if BottomBar needs to show speaking indicator? (Optional)
                            // isSpeaking={isTtsSpeaking}
                        />
                    </Animated.View>
                 </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f9ff', // Match main background or Navbar color
    },
    container: {
        flex: 1,
        // overflow: 'hidden', // Keep hidden to clip bottom bar
    },
    mainContent: {
        flex: 1, // Takes space between IconInput and BottomBar area
        backgroundColor: '#f0f9ff',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5, // Ensure it's above main content but below modals potentially
    },
    // Styles for items inside IconInputComponent
    inputItemChip: {
        backgroundColor: '#e0f7fa',
        borderRadius: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#b2ebf2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    inputItemText: {
        color: '#0077b6',
        fontSize: 15,
        fontWeight: '500',
    },
});

export default HomeScreen;