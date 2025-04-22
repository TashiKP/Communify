// src/Screens/HomeScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, StyleSheet, Animated, TouchableWithoutFeedback, Keyboard,
    Easing, Platform, Text, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';

// --- COMPONENT IMPORTS ---
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
// Import SymbolGrid AND its Ref type
import SymbolGrid, { SymbolGridRef } from '../components/Symbols';
import BottomBar from '../components/bottomnav';
// --- TYPE IMPORTS ---
import { GridLayoutType, useGrid } from '../context/GridContext'; // Import context hook and type
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // For TTS state

// --- Define types needed ---
type SearchSymbolInfo = { keyword: string; pictogramUrl: string };
type SelectedSymbol = { id: string; keyword: string; imageUri?: string };

// --- Default TTS Settings ---
const defaultTtsSettings: VoiceSettingData = {
    pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false,
    volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false,
};

// --- Configuration ---
const HIDE_DELAY = 4000;
const ANIMATION_DURATION_IN = 250;
const ANIMATION_DURATION_OUT = 350;
const BOTTOM_BAR_HEIGHT = 65; // Match BottomBar's actual height

const HomeScreen = () => {
    // --- Context ---
    // const { gridLayout } = useGrid(); // Context used within SymbolGrid now

    // --- State ---
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [currentLang, setCurrentLang] = useState('en');
    const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);
    const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
    const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
    const [isTtsInitialized, setIsTtsInitialized] = useState(false);

    // --- Animation & Refs ---
    const bottomBarPosition = useRef(new Animated.Value(0)).current;
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const symbolGridRef = useRef<SymbolGridRef>(null); // <-- Ref for SymbolGrid component

    // --- Animation & Timer Logic ---
    const slideUp = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: 0, duration: ANIMATION_DURATION_IN, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]);
    const slideDown = useCallback(() => { Animated.timing(bottomBarPosition, { toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 30 : 10), duration: ANIMATION_DURATION_OUT, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();}, [bottomBarPosition]);
    const showAndResetTimer = useCallback(() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); if (!isBarVisible) { setIsBarVisible(true); slideUp(); } hideTimerRef.current = setTimeout(() => { setIsBarVisible(false); slideDown(); hideTimerRef.current = null; }, HIDE_DELAY); }, [isBarVisible, slideUp, slideDown]);
    useEffect(() => { showAndResetTimer(); return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }; }, [showAndResetTimer]);

    // --- TTS Initialization and Listeners ---
    useEffect(() => {
        let isMounted = true; let startListener: any, finishListener: any, cancelListener: any;
        const initializeTts = async () => { try { await Tts.setDefaultLanguage(currentLang); if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId); await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5); await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05); await Tts.getInitStatus(); startListener = Tts.addEventListener('tts-start', () => { if (isMounted) setIsTtsSpeaking(true);}); finishListener = Tts.addEventListener('tts-finish', () => { if (isMounted) setIsTtsSpeaking(false);}); cancelListener = Tts.addEventListener('tts-cancel', () => { if (isMounted) setIsTtsSpeaking(false); }); if (isMounted) { const voicesResult = await Tts.voices(); const usableVoices = voicesResult.filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled)); if (!ttsSettings.selectedVoiceId && usableVoices.length > 0) { const defaultVoice = usableVoices.find(v => v.language.startsWith(currentLang)) || usableVoices[0]; setTtsSettings(prev => ({ ...prev, selectedVoiceId: defaultVoice.id })); } setIsTtsInitialized(true); console.log("TTS Initialized"); } } catch (err: any) { console.error('TTS Init failed:', err); if (isMounted) setIsTtsInitialized(false); } }; initializeTts(); return () => { isMounted = false; Tts.stop(); startListener?.remove(); finishListener?.remove(); cancelListener?.remove(); };
    }, [currentLang, ttsSettings.selectedVoiceId, ttsSettings.pitch, ttsSettings.speed]);


    // --- Handlers for SymbolGrid and IconInputComponent ---
    const handleSymbolPress = useCallback((keyword: string, imageUri?: string) => {
        setSelectedItems(prev => [...prev, { keyword, imageUri, id: `${Date.now()}-${keyword}-${prev.length}` }]);
        showAndResetTimer();
    }, [showAndResetTimer]);
    const handleBackspacePress = useCallback(() => { setSelectedItems(prev => prev.slice(0, -1)); showAndResetTimer(); }, [showAndResetTimer]);
    const handleClearPress = useCallback(() => { setSelectedItems([]); if (isTtsSpeaking) Tts.stop(); showAndResetTimer(); }, [isTtsSpeaking, showAndResetTimer]);
    const handleSpeakPress = useCallback(async () => {
        showAndResetTimer(); if (!isTtsInitialized) { Alert.alert("TTS Error", "TTS not ready."); return; } if (isTtsSpeaking) { Tts.stop(); return; } if (selectedItems.length === 0) return;
        const sentence = selectedItems.map(item => item.keyword).join(' ');
        try { if (ttsSettings.selectedVoiceId) { const voices = await Tts.voices(); if (voices.some(v => v.id === ttsSettings.selectedVoiceId)) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId); else console.warn(`Voice ${ttsSettings.selectedVoiceId} not found.`); } await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5); await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05); Tts.speak(sentence); } catch (error: any) { console.error("TTS Speak error:", error); setIsTtsSpeaking(false); Alert.alert("Speak Error", `Could not speak. ${error.message || ''}`); }
     }, [selectedItems, isTtsSpeaking, ttsSettings, isTtsInitialized, showAndResetTimer]);
    const handleTtsSettingsSave = useCallback((newSettings: VoiceSettingData) => { setTtsSettings(newSettings); /* Persist */ Alert.alert("Settings Saved", "Voice updated."); showAndResetTimer(); }, [showAndResetTimer]);

    // --- Handlers Passed to BottomBar ---
    const handleHomePress = useCallback(() => { console.log('Home Pressed'); showAndResetTimer(); }, [showAndResetTimer]);
    const handleLayoutSave = useCallback((newLayout: GridLayoutType) => { /* Context handles state */ console.log("Layout save notified:", newLayout); showAndResetTimer(); }, [showAndResetTimer]);
    const handleCustomSymbolsUpdate = useCallback((updatedSymbols: any[]) => { /* Refresh if needed */ showAndResetTimer(); }, [showAndResetTimer]);
    const handleTextInputSubmit = useCallback((text: string) => { setSelectedItems(prev => [...prev, { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }]); showAndResetTimer(); }, [showAndResetTimer]);
    // --- MODIFIED: Handler for symbols selected via SEARCH ---
    const handleSearchSymbolSelect = useCallback((symbol: SearchSymbolInfo) => {
        console.log('Search Symbol Selected:', symbol);
        // 1. Add symbol to input bar
        setSelectedItems(prev => [...prev, { keyword: symbol.keyword, id: `${Date.now()}-${symbol.keyword}-${prev.length}` }]);
        // 2. Check current category in SymbolGrid and add if standard
        const currentCategory = symbolGridRef.current?.selectedCategoryName;
        if (currentCategory && currentCategory !== 'Contextual' && currentCategory !== 'Custom') {
            console.log(`Attempting to add "${symbol.keyword}" to category "${currentCategory}" via ref`);
            symbolGridRef.current?.addKeywordToCategory(currentCategory, symbol.keyword);
        } else { console.log(`Cannot add to category: ${currentCategory}`); }
        showAndResetTimer();
    }, [showAndResetTimer]); // Dependency

    // --- Render Input Bar Children ---
    const renderInputItems = () => { if (selectedItems.length === 0) return null; return selectedItems.map((item) => (<View key={item.id} style={styles.inputItemChip}><Text style={styles.inputItemText}>{item.keyword}</Text></View>)); };

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

                    <View style={styles.mainContent}>
                        {/* Assign the ref to SymbolGrid */}
                        <SymbolGrid
                            ref={symbolGridRef}
                            onSymbolPress={handleSymbolPress}
                        />
                    </View>
                 </View>
            </TouchableWithoutFeedback>

            {/* Animated BottomBar Container */}
            <Animated.View style={[styles.bottomBarContainer, { transform: [{ translateY: bottomBarPosition }] }]} pointerEvents={isBarVisible ? 'auto' : 'none'}>
                <BottomBar
                    handleHomePress={handleHomePress}
                    onSymbolSelected={handleSearchSymbolSelect} // Use the modified handler
                    onTextInputSubmit={handleTextInputSubmit}
                    currentLanguage={currentLang}
                    // No need to pass currentGridLayout if BottomBar doesn't use it directly
                    onGridLayoutSave={handleLayoutSave} // Keep for timer reset etc.
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
    safeArea: { flex: 1, backgroundColor: '#0077b6', },
    container: { flex: 1, backgroundColor: '#f0f9ff', },
    mainContent: { flex: 1, },
    bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BAR_HEIGHT, zIndex: 5, },
    inputItemChip: { backgroundColor: '#e0f7fa', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12, marginHorizontal: 4, marginVertical: 4, borderWidth: 1, borderColor: '#b2ebf2', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1, },
    inputItemText: { color: '#0077b6', fontSize: 15, fontWeight: '500', },
});

export default HomeScreen;