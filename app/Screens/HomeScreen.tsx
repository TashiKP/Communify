// src/Screens/HomeScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard,
    Easing, Platform, Text, Alert // REMOVED SafeAreaView from here
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <--- CORRECT IMPORT
import Tts from 'react-native-tts'; // Added for TTS

// --- COMPONENT IMPORTS --- (Adjust paths as necessary)
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import SymbolGrid from '../components/Symbols'; // Renamed from NavBarComponent
import BottomBar from '../components/bottomnav';
// --- TYPE IMPORTS --- (Adjust paths as necessary)
import { GridLayoutType } from '../components/GridLayoutScreen';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // Now essential

// --- Define types needed ---
type SearchSymbolInfo = { keyword: string; pictogramUrl: string }; // For search results passed to BottomBar handler
type SelectedSymbol = { id: string; keyword: string }; // For items in the sentence bar

// --- Default TTS Settings ---
// Define it here, but ideally load from storage/context
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
    const [currentLang, setCurrentLang] = useState('en'); // Keep language state if needed
    const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);

    // --- TTS State ---
    const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings); // State for settings
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
            // Optional: Check Keyboard.isVisible() here if needed, but can be unreliable
            setIsBarVisible(false); slideDown(); hideTimerRef.current = null;
        }, HIDE_DELAY);
    }, [isBarVisible, slideUp, slideDown]); // Include dependencies

    // --- Effect for Initial Show & Cleanup ---
    useEffect(() => {
        showAndResetTimer(); // Show bar on mount
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }; // Cleanup timer
    }, [showAndResetTimer]); // Dependency ensures it runs once correctly

    // --- TTS Initialization and Listeners ---
    useEffect(() => {
        let isMounted = true;
        let startListener: any = null;
        let finishListener: any = null;
        let cancelListener: any = null;

        const initializeTts = async () => {
            console.log("Attempting TTS Initialization with settings:", ttsSettings);
            try {
                // Apply settings during initialization
                await Tts.setDefaultLanguage(currentLang);
                if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
                await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
                await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
                await Tts.getInitStatus();

                startListener = Tts.addEventListener('tts-start', () => { if (isMounted) setIsTtsSpeaking(true); console.log(">> EVENT: tts-start") });
                finishListener = Tts.addEventListener('tts-finish', () => { if (isMounted) setIsTtsSpeaking(false); console.log(">> EVENT: tts-finish") });
                cancelListener = Tts.addEventListener('tts-cancel', () => { if (isMounted) setIsTtsSpeaking(false); console.log(">> EVENT: tts-cancel") });

                if (isMounted) {
                    // Fetch voices *after* init to potentially set a default if none is selected
                    const voicesResult = await Tts.voices();
                    const usableVoices = voicesResult.filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled));
                    // Only set default if NO voice is currently selected in state AND voices are available
                    if (!ttsSettings.selectedVoiceId && usableVoices.length > 0) {
                        const defaultVoice = usableVoices.find(v => v.language.startsWith(currentLang)) || usableVoices[0]; // Prefer current language
                        console.log("No voice selected, setting default:", defaultVoice.id);
                        // Update state non-blockingly
                        setTtsSettings(prev => ({ ...prev, selectedVoiceId: defaultVoice.id }));
                    }
                    setIsTtsInitialized(true);
                    console.log("TTS Initialized Successfully");
                }

            } catch (err: any) {
                console.error('TTS Initialization failed:', err);
                if (isMounted && err.message !== 'TTS engine is not ready') {
                    Alert.alert('TTS Error', `Text-to-Speech engine failed to initialize. (${err.message})`);
                }
                if (isMounted) setIsTtsInitialized(false); // Ensure state is false on error
            }
        };

        initializeTts();

        return () => {
            isMounted = false;
            Tts.stop();
            startListener?.remove();
            finishListener?.remove();
            cancelListener?.remove();
            console.log("TTS Listeners Cleaned Up");
        };
        // Re-initialize if key settings change
    }, [currentLang, ttsSettings.selectedVoiceId, ttsSettings.pitch, ttsSettings.speed]);


    // --- Handlers for SymbolGrid and IconInputComponent ---
    const handleSymbolPress = useCallback((keyword: string) => {
        setSelectedItems(prev => [
            ...prev,
            { keyword, id: `${Date.now()}-${keyword}-${prev.length}` }
        ]);
        showAndResetTimer(); // Reset timer on interaction
    }, [showAndResetTimer]); // Dependency on timer reset function

    const handleBackspacePress = useCallback(() => {
        setSelectedItems(prev => prev.slice(0, -1));
        showAndResetTimer(); // Reset timer on interaction
    }, [showAndResetTimer]);

    const handleClearPress = useCallback(() => {
        setSelectedItems([]);
        if (isTtsSpeaking) Tts.stop(); // Stop speech if clearing
        showAndResetTimer(); // Reset timer on interaction
    }, [isTtsSpeaking, showAndResetTimer]);

    // --- Modified handleSpeakPress to use current ttsSettings state ---
    const handleSpeakPress = useCallback(async () => {
        showAndResetTimer();
        console.log(`Speak pressed. isTtsInitialized: ${isTtsInitialized}, isTtsSpeaking: ${isTtsSpeaking}`); // Debug log
        if (!isTtsInitialized) { Alert.alert("TTS Error", "TTS not ready."); return; }
        if (isTtsSpeaking) { Tts.stop(); return; } // Listener handles setIsTtsSpeaking(false)
        if (selectedItems.length === 0) return;

        const sentence = selectedItems.map(item => item.keyword).join(' ');
        console.log(`HomeScreen: Speaking - "${sentence}" with pitch: ${ttsSettings.pitch}, speed: ${ttsSettings.speed}`); // Log current settings
        try {
            // --- Apply CURRENT settings before speaking ---
            // Check if voice exists before setting (important after initialization)
            if (ttsSettings.selectedVoiceId) {
                const voices = await Tts.voices(); // Check available voices again
                if (voices.some(v => v.id === ttsSettings.selectedVoiceId)) {
                    await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
                } else {
                    console.warn(`Selected voice ${ttsSettings.selectedVoiceId} not found, using engine default.`);
                    // Optionally reset state if voice is invalid
                    // setTtsSettings(prev => ({...prev, selectedVoiceId: null}));
                }
            }
            await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5); // Use state value
            await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);  // Use state value

            Tts.speak(sentence); // Listener handles setIsTtsSpeaking(true)
        } catch (error: any) {
            console.error("TTS Speak error:", error);
            setIsTtsSpeaking(false); // Ensure state is reset on error
            Alert.alert("Speak Error", `Could not speak sentence. ${error.message || ''}`);
        }
    }, [selectedItems, isTtsSpeaking, ttsSettings, isTtsInitialized, showAndResetTimer]); // <-- Add ttsSettings dependency


    // --- Handler to UPDATE TTS Settings State (passed down) ---
    const handleTtsSettingsSave = useCallback((newSettings: VoiceSettingData) => {
        console.log("HomeScreen: Updating TTS Settings:", newSettings);
        setTtsSettings(newSettings); // Update the state in HomeScreen
        // TODO: Persist newSettings to AsyncStorage here
        // Example: AsyncStorage.setItem('ttsSettings', JSON.stringify(newSettings));
        Alert.alert("Settings Saved", "Voice settings have been updated."); // Provide feedback
        showAndResetTimer(); // Reset timer after settings interaction
    }, [showAndResetTimer]); // Dependency


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
         setSelectedItems(prev => [
            ...prev,
            { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);


    const handleLayoutSave = useCallback((newLayout: GridLayoutType) => {
        console.log("Layout updated in HomeScreen:", newLayout);
        setCurrentLayout(newLayout);
        // TODO: Add persistence logic here for layout
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleCustomSymbolsUpdate = useCallback((updatedSymbols: any[]) => {
        console.log('Custom symbols updated notification:', updatedSymbols.length);
        // TODO: Handle custom symbol updates if needed (e.g., refresh grid?)
        showAndResetTimer();
    }, [showAndResetTimer]);


    // --- Render Input Bar Children ---
    const renderInputItems = () => {
        if (selectedItems.length === 0) return null;
        // Render simple text chips
        return selectedItems.map((item) => (
            <View key={item.id} style={styles.inputItemChip}>
                <Text style={styles.inputItemText}>{item.keyword}</Text>
            </View>
        ));
    };

    // --- Main Render ---
    return (
        // Use edges prop with SafeAreaView from react-native-safe-area-context
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Wrap main content area in TouchableWithoutFeedback */}
            <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
                 <View style={styles.container}>
                    <Navbar />
                    <IconInputComponent
                        onSpeakPress={handleSpeakPress} // Uses updated handler
                        onBackspacePress={handleBackspacePress}
                        onClearPress={handleClearPress}
                        isSpeakDisabled={selectedItems.length === 0 || isTtsSpeaking || !isTtsInitialized}
                        isBackspaceDisabled={selectedItems.length === 0}
                        isClearDisabled={selectedItems.length === 0}
                    >
                        {renderInputItems()}
                    </IconInputComponent>

                    {/* Main content area */}
                    <View style={styles.mainContent} key={`layout-${currentLayout}`}>
                        <SymbolGrid
                            // Pass layoutType={currentLayout} // If SymbolGrid uses it
                            onSymbolPress={handleSymbolPress} // Pass symbol press handler
                            key={currentLang} // Force re-render if language changes
                        />
                    </View>
                 </View>
            </TouchableWithoutFeedback>

            {/* Animated Wrapper for BottomBar - Outside the main TouchableWithoutFeedback */}
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
                    // --- Pass TTS Settings and Save Handler Down ---
                    currentTtsSettings={ttsSettings}
                    onTtsSettingsSave={handleTtsSettingsSave}
                    // ---------------------------------------------
                />
            </Animated.View>
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
        // This View helps contain the layout within the safe area, excluding bottom bar
    },
    mainContent: {
        flex: 1, // Takes space between IconInput and BottomBar area
        backgroundColor: '#f0f9ff', // Or your main content background
    },
    bottomBarContainer: {
        position: 'absolute', // Position over content
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
        shadowColor: '#000', // Optional subtle shadow
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