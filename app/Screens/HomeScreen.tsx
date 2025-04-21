// src/Screens/HomeScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard,
    Easing, Platform, Text, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Correct import for 'edges' prop
import Tts from 'react-native-tts';

// --- COMPONENT IMPORTS --- (Adjust paths as necessary)
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import SymbolGrid from '../components/Symbols'; // Your main symbol grid component
import BottomBar from '../components/bottomnav';
// --- TYPE IMPORTS --- (Adjust paths as necessary)
import { GridLayoutType, useGrid } from '../context/GridContext';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // For TTS state

// --- Define types needed ---
type SearchSymbolInfo = { keyword: string; pictogramUrl: string }; // For search results
type SelectedSymbol = { id: string; keyword: string; imageUri?: string }; // Added optional imageUri for input bar

// --- Default TTS Settings ---
// TODO: Load these from AsyncStorage or context in a real app
const defaultTtsSettings: VoiceSettingData = {
    pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false,
    volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false,
};

// --- Configuration ---
const HIDE_DELAY = 4000; // ms before auto-hiding BottomBar
const ANIMATION_DURATION_IN = 250; // Slide-in duration
const ANIMATION_DURATION_OUT = 350; // Slide-out duration
const BOTTOM_BAR_HEIGHT = 65; // <--- IMPORTANT: Match the actual height of your BottomBar component (IconInputComponent uses 65)

const HomeScreen = () => {
    // --- State ---
    const [isBarVisible, setIsBarVisible] = useState(true); // BottomBar visibility
    const [currentLayout, setCurrentLayout] = useState<GridLayoutType>('standard'); // Example layout state
    const [currentLang, setCurrentLang] = useState('en'); // Example language state
    const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]); // Items in the input bar

    // --- TTS State ---
    const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
    const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
    const [isTtsInitialized, setIsTtsInitialized] = useState(false);

    // --- Animation ---
    const bottomBarPosition = useRef(new Animated.Value(0)).current; // 0 = visible, BOTTOM_BAR_HEIGHT = hidden
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Animation Functions (Slide Up/Down) ---
    const slideUp = useCallback(() => {
        Animated.timing(bottomBarPosition, {
            toValue: 0, // Position at bottom edge
            duration: ANIMATION_DURATION_IN,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }).start();
    }, [bottomBarPosition]);

    const slideDown = useCallback(() => {
        Animated.timing(bottomBarPosition, {
            toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 30 : 10), // Move below screen edge (+ extra for safe area/shadows)
            duration: ANIMATION_DURATION_OUT,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true
        }).start();
    }, [bottomBarPosition]);

    // --- Timer Logic for Auto-Hide ---
    const showAndResetTimer = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (!isBarVisible) { // Only slide up if currently hidden
            setIsBarVisible(true);
            slideUp();
        }
        // Set timer to hide the bar
        hideTimerRef.current = setTimeout(() => {
            // Optional: Check if keyboard is visible here if needed
            // if (Keyboard.isVisible()) { showAndResetTimer(); return; }
            setIsBarVisible(false);
            slideDown();
            hideTimerRef.current = null;
        }, HIDE_DELAY);
    }, [isBarVisible, slideUp, slideDown]); // Dependencies

    // --- Effect for Initial Show & Cleanup ---
    useEffect(() => {
        showAndResetTimer(); // Show bar and start timer on mount
        return () => { // Cleanup timer on unmount
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [showAndResetTimer]); // Dependency

    // --- TTS Initialization and Listeners ---
    useEffect(() => {
        let isMounted = true;
        let startListener: any = null;
        let finishListener: any = null;
        let cancelListener: any = null;

        const initializeTts = async () => {
            console.log("Attempting TTS Initialization with settings:", ttsSettings);
            try {
                await Tts.setDefaultLanguage(currentLang);
                if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
                await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
                await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
                await Tts.getInitStatus();

                startListener = Tts.addEventListener('tts-start', () => { if (isMounted) setIsTtsSpeaking(true); console.log(">> EVENT: tts-start") });
                finishListener = Tts.addEventListener('tts-finish', () => { if (isMounted) setIsTtsSpeaking(false); console.log(">> EVENT: tts-finish") });
                cancelListener = Tts.addEventListener('tts-cancel', () => { if (isMounted) setIsTtsSpeaking(false); console.log(">> EVENT: tts-cancel") });

                if (isMounted) {
                    const voicesResult = await Tts.voices();
                    const usableVoices = voicesResult.filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled));
                    if (!ttsSettings.selectedVoiceId && usableVoices.length > 0) {
                        const defaultVoice = usableVoices.find(v => v.language.startsWith(currentLang)) || usableVoices[0];
                        console.log("No voice selected, setting default:", defaultVoice.id);
                        setTtsSettings(prev => ({ ...prev, selectedVoiceId: defaultVoice.id }));
                    }
                    setIsTtsInitialized(true);
                    console.log("TTS Initialized Successfully");
                }

            } catch (err: any) { /* ... error handling ... */ console.error('TTS Initialization failed:', err); if (isMounted) setIsTtsInitialized(false); }
        };

        initializeTts();

        return () => { isMounted = false; Tts.stop(); startListener?.remove(); finishListener?.remove(); cancelListener?.remove(); };
    }, [currentLang, ttsSettings.selectedVoiceId, ttsSettings.pitch, ttsSettings.speed]);


    // --- Handlers for SymbolGrid and IconInputComponent ---
    const handleSymbolPress = useCallback((keyword: string, imageUri?: string) => { // Updated signature
        setSelectedItems(prev => [
            ...prev,
            // Store imageUri if you plan to display custom images in the input bar
            { keyword, imageUri, id: `${Date.now()}-${keyword}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleBackspacePress = useCallback(() => {
        setSelectedItems(prev => prev.slice(0, -1));
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleClearPress = useCallback(() => {
        setSelectedItems([]);
        if (isTtsSpeaking) Tts.stop();
        showAndResetTimer();
    }, [isTtsSpeaking, showAndResetTimer]);

    // --- Modified handleSpeakPress ---
    const handleSpeakPress = useCallback(async () => {
        showAndResetTimer();
        if (!isTtsInitialized) { Alert.alert("TTS Error", "TTS not ready."); return; }
        if (isTtsSpeaking) { Tts.stop(); return; }
        if (selectedItems.length === 0) return;

        const sentence = selectedItems.map(item => item.keyword).join(' ');
        console.log(`HomeScreen: Speaking - "${sentence}" with pitch: ${ttsSettings.pitch}, speed: ${ttsSettings.speed}`);
        try {
            // Apply CURRENT settings before speaking
            if (ttsSettings.selectedVoiceId) {
                const voices = await Tts.voices();
                if (voices.some(v => v.id === ttsSettings.selectedVoiceId)) {
                    await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
                } else { console.warn(`Voice ${ttsSettings.selectedVoiceId} not found.`); }
            }
            await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
            await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
            Tts.speak(sentence);
        } catch (error: any) { console.error("TTS Speak error:", error); setIsTtsSpeaking(false); Alert.alert("Speak Error", `Could not speak. ${error.message || ''}`); }
    }, [selectedItems, isTtsSpeaking, ttsSettings, isTtsInitialized, showAndResetTimer]);


    // --- Handler to UPDATE TTS Settings State ---
    const handleTtsSettingsSave = useCallback((newSettings: VoiceSettingData) => {
        console.log("HomeScreen: Updating TTS Settings:", newSettings);
        setTtsSettings(newSettings);
        // TODO: Persist newSettings to AsyncStorage here
        Alert.alert("Settings Saved", "Voice settings updated.");
        showAndResetTimer();
    }, [showAndResetTimer]);


    // --- Handlers Passed to BottomBar ---
    const handleHomePress = useCallback(() => {
        console.log('Home Pressed');
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleSearchSymbolSelect = useCallback((symbol: SearchSymbolInfo) => {
        console.log('Search Symbol Selected:', symbol);
        setSelectedItems(prev => [
            ...prev,
            { keyword: symbol.keyword, id: `${Date.now()}-${symbol.keyword}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleTextInputSubmit = useCallback((text: string) => {
        console.log('Text Input Submitted:', text);
        setSelectedItems(prev => [
            ...prev,
            { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }
        ]);
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleLayoutSave = useCallback((newLayout: GridLayoutType) => {
        console.log("Layout updated:", newLayout);
        setCurrentLayout(newLayout);
        // TODO: Persist layout
        showAndResetTimer();
    }, [showAndResetTimer]);

    const handleCustomSymbolsUpdate = useCallback((updatedSymbols: any[]) => {
        console.log('Custom symbols updated notification:', updatedSymbols.length);
        // TODO: Potentially reload custom symbols in SymbolGrid here if needed
        showAndResetTimer();
    }, [showAndResetTimer]);


    // --- Render Input Bar Children ---
    const renderInputItems = () => {
        if (selectedItems.length === 0) return null;
        // Render simple text chips (Can be enhanced to show images using item.imageUri)
        return selectedItems.map((item) => (
            <View key={item.id} style={styles.inputItemChip}>
                {/* Optional: Render Image if item.imageUri exists */}
                <Text style={styles.inputItemText}>{item.keyword}</Text>
            </View>
        ));
    };

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* TouchableWithoutFeedback to reset timer on main content tap */}
            <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
                 <View style={styles.container}>
                    {/* Fixed Navbar */}
                    <Navbar />
                    {/* Fixed Input Component */}
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

                    {/* Scrollable/Main Content Area */}
                    <View style={styles.mainContent} key={`layout-${currentLayout}-${currentLang}`}>
                        <SymbolGrid
                            onSymbolPress={handleSymbolPress}
                            // Pass other props like layoutType if needed
                        />
                    </View>
                 </View>
            </TouchableWithoutFeedback>

            {/* Animated BottomBar Container - Outside the main TouchableWithoutFeedback */}
            <Animated.View
                style={[
                    styles.bottomBarContainer,
                    // Apply the translateY transformation based on bottomBarPosition animated value
                    { transform: [{ translateY: bottomBarPosition }] }
                ]}
                // Disable touch events on the container when it's hidden
                pointerEvents={isBarVisible ? 'auto' : 'none'}
            >
                <BottomBar
                    handleHomePress={handleHomePress}
                    onSymbolSelected={handleSearchSymbolSelect}
                    onTextInputSubmit={handleTextInputSubmit}
                    currentLanguage={currentLang}
                    currentGridLayout={currentLayout}
                    onGridLayoutSave={handleLayoutSave}
                    onCustomSymbolsUpdate={handleCustomSymbolsUpdate}
                    currentTtsSettings={ttsSettings}
                    onTtsSettingsSave={handleTtsSettingsSave}
                />
            </Animated.View>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0077b6', // Match Navbar color for top safe area
    },
    container: {
        flex: 1,
        backgroundColor: '#f0f9ff', // Main background below Navbar/Input
    },
    mainContent: {
        flex: 1, // Takes space between IconInput and BottomBar area
    },
    bottomBarContainer: {
        position: 'absolute', // Position OVER the main content
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_BAR_HEIGHT, // Give the container a defined height
        zIndex: 5,
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