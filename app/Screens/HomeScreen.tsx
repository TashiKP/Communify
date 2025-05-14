// src/screens/HomeScreen.tsx

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Easing,
  Platform,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts, { Voice } from 'react-native-tts';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

// --- Service Imports ---
import apiService, {
  AACPhraseGenerationResponse,
  AudioDataResponse,
  handleApiError,
} from '../services/apiService'; // Ensure path is correct

// --- Component Imports ---
import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import SymbolGrid, { SymbolGridRef } from '../components/Symbols';
import BottomBar from '../components/bottomnav';
import Menu, { menuWidth } from '../components/menu';
import SearchScreen from '../components/SearchScreen';
import CustomPageComponent from '../components/CustomPageComponent';
import KeyboardInputComponent from '../components/KeyboardInputComponent';

// --- Context Imports ---
import { GridLayoutType, useGrid } from '../context/GridContext';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen';
import { useAppearance } from '../context/AppearanceContext';

// --- Type Definitions ---
type SearchSymbolInfo = { keyword: string; pictogramUrl: string };
type SelectedSymbol = { id: string; keyword: string; imageUri?: string };

// --- Constants ---
const defaultTtsSettings: VoiceSettingData = {
  pitch: 0.5,
  speed: 0.5,
  volume: 0.8,
  pitchLocked: false,
  speedLocked: false,
  volumeLocked: false,
  selectedVoiceId: null,
  highlightWord: true,
  speakPunctuation: false,
};

const HIDE_DELAY = 4000;
const ANIMATION_DURATION_IN = 250;
const ANIMATION_DURATION_OUT = 350;
const BOTTOM_BAR_HEIGHT = 65;

Sound.setCategory('Playback'); // Initialize react-native-sound category

const HomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, fonts } = useAppearance();
  const { setGridLayout } = useGrid(); // Removed unused gridLayout

  // --- State Declarations ---
  const [isBarVisible, setIsBarVisible] = useState(true);
  const [currentUiLang, setCurrentUiLang] = useState(i18n.language);
  const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);
  const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
  
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false); // For react-native-tts
  const [isAudioPlaying, setIsAudioPlaying] = useState(false); // For react-native-sound
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false); // Combined loading state

  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
  const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
  const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);

  const [currentCategoryName, setCurrentCategoryName] = useState<string>(
    t('categories.default', 'Contextual')
  );

  // --- Refs ---
  const bottomBarPosition = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const symbolGridRef = useRef<SymbolGridRef>(null);
  const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
  const menuOverlayAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const currentSoundInstanceRef = useRef<Sound | null>(null);

  // --- Effects ---

  // Mounted Ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Update category name on mount and language change
  useEffect(() => {
    if (isMountedRef.current) {
        setCurrentCategoryName(t('categories.default', 'Contextual'));
    }
  }, [t, currentUiLang]); // Added currentUiLang as it might influence 't' output

  // Bottom bar visibility and animation
  const slideUp = useCallback(() => Animated.timing(bottomBarPosition, { toValue: 0, duration: ANIMATION_DURATION_IN, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(), [bottomBarPosition]);
  const slideDown = useCallback(() => Animated.timing(bottomBarPosition, { toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 30 : 10), duration: ANIMATION_DURATION_OUT, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(), [bottomBarPosition]);

  const showAndResetTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isBarVisible) {
      if (isMountedRef.current) setIsBarVisible(true);
      slideUp();
    }
    hideTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setIsBarVisible(false);
      slideDown();
      hideTimerRef.current = null;
    }, HIDE_DELAY);
  }, [isBarVisible, slideUp, slideDown]);

  useEffect(() => {
    showAndResetTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [showAndResetTimer]);


  // TTS Initialization and Language Change Handling for react-native-tts
  // TTS Initialization and Language Change Handling for react-native-tts
  useEffect(() => {
    let isEffectMounted = true;
    let ttsStartListener: any, ttsFinishListener: any, ttsCancelListener: any;

    const initializeAndConfigureTts = async () => {
      try {
        console.log(`[TTS Effect] Initializing for language: ${currentUiLang}`);
        await Tts.setDefaultLanguage(currentUiLang);
        await Tts.getInitStatus();

        ttsStartListener = Tts.addEventListener('tts-start', () => { if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(true); });
        ttsFinishListener = Tts.addEventListener('tts-finish', () => { if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(false); });
        ttsCancelListener = Tts.addEventListener('tts-cancel', () => { if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(false); });

        if (!isEffectMounted || !isMountedRef.current) return;

        const voices = await Tts.voices();
        const usableVoices = voices.filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled));
        
        let voiceToUse: Voice | undefined = undefined; // Voice type from react-native-tts if available, else any
        
        if (usableVoices.length > 0) {
          // 1. Try to find an exact match for the current UI language (e.g., "en-US")
          voiceToUse = usableVoices.find(v => v.language === currentUiLang);

          // 2. If not found, try to find a match for the base language (e.g., "en" from "en-US")
          if (!voiceToUse) {
            const baseLang = currentUiLang.split('-')[0];
            voiceToUse = usableVoices.find(v => v.language.startsWith(baseLang));
          }

          // 3. As a last resort, if still no voice is found, pick the first available usable voice.
          // This is less ideal as it might not match the language.
          if (!voiceToUse) {
            voiceToUse = usableVoices[0];
            console.warn(`[TTS Effect] No specific voice for ${currentUiLang} or base language. Falling back to ${voiceToUse.language} (${voiceToUse.name}).`);
          }
        }

        if (voiceToUse) {
          console.log(`[TTS Effect] Selected voice for ${currentUiLang}: ${voiceToUse.id} (${voiceToUse.name}, Lang: ${voiceToUse.language})`);
          // Ensure the selected voice's language is re-affirmed if it's different from currentUiLang
          // Though Tts.setDefaultLanguage(currentUiLang) should guide it.
          // await Tts.setDefaultLanguage(voiceToUse.language); // Could be an option if issues persist
          setTtsSettings(prev => ({ ...prev, selectedVoiceId: voiceToUse!.id }));
        } else {
          console.warn(`[TTS Effect] No usable voices found at all. TTS might not work for ${currentUiLang}.`);
          setTtsSettings(prev => ({ ...prev, selectedVoiceId: null }));
        }
        setIsTtsInitialized(true);

      } catch (error) {
        console.error('TTS Initialization failed:', error);
        if (isEffectMounted && isMountedRef.current) setIsTtsInitialized(false);
      }
    };

    initializeAndConfigureTts();

    return () => {
      isEffectMounted = false;
      Tts.stop();
      ttsStartListener?.remove();
      ttsFinishListener?.remove();
      ttsCancelListener?.remove();
    };
  }, [currentUiLang]);

  // Apply TTS settings when they change
  useEffect(() => {
    const applySettings = async () => {
      if (!isTtsInitialized) return;
      try {
        if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
        await Tts.setDefaultPitch(ttsSettings.pitch);
        await Tts.setDefaultRate(ttsSettings.speed);
        // Volume for Tts.speak() is often controlled by device volume or not available via react-native-tts API
      } catch (error) {
        console.error('Failed to apply TTS settings:', error);
      }
    };
    applySettings();
  }, [ttsSettings, isTtsInitialized]);

  // i18n Language Change Listener
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (isMountedRef.current) {
        console.log(`[i18n] Language changed to: ${lng}`);
        setCurrentUiLang(lng);
      }
    };
    i18n.on('languageChanged', handleLanguageChanged);
    // Sync initial language if different
    if (isMountedRef.current && i18n.language !== currentUiLang) {
      setCurrentUiLang(i18n.language);
    }
    return () => { i18n.off('languageChanged', handleLanguageChanged); };
  }, [i18n, currentUiLang]); // currentUiLang dependency ensures re-sync if needed

  // Cleanup sound instance on unmount
  useEffect(() => {
    return () => {
      if (currentSoundInstanceRef.current) {
        currentSoundInstanceRef.current.release();
        currentSoundInstanceRef.current = null;
      }
    };
  }, []);


  // --- Event Handlers ---
  const handleSymbolPress = useCallback((keyword: string, imageUri?: string) => {
    setSelectedItems(prev => [...prev, { keyword, imageUri, id: `${Date.now()}-${keyword}-${prev.length}` }]);
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleBackspacePress = useCallback(() => {
    setSelectedItems(prev => prev.slice(0, -1));
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleClearPress = useCallback(() => {
    setSelectedItems([]);
    if (isTtsSpeaking) Tts.stop();
    if (currentSoundInstanceRef.current) currentSoundInstanceRef.current.stop(); 
    showAndResetTimer();
  }, [isTtsSpeaking, showAndResetTimer]);

  const playAudioBlob = useCallback(async (audioBlob: Blob, filename: string = 'translated_audio.wav') => { // Ensure filename has an extension
    return new Promise<void>((resolve, reject) => {
        if (currentSoundInstanceRef.current) {
            currentSoundInstanceRef.current.release();
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob); 
        reader.onloadend = async () => {
            const base64DataUrl = reader.result as string;
            let pureBase64Data = base64DataUrl;
            const commaIndex = base64DataUrl.indexOf(',');
            if (commaIndex !== -1) {
                pureBase64Data = base64DataUrl.substring(commaIndex + 1);
            } else {
                console.warn('[AudioPlayer] Could not find comma in Data URI for file saving.');
            }
            const tempFilePath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}_${filename}`; // Unique temp file name
            console.log(`[AudioPlayer] Attempting to save audio to temporary file: ${tempFilePath}`);

            try {
                await RNFS.writeFile(tempFilePath, pureBase64Data, 'base64');
                console.log(`[AudioPlayer] Audio saved to: ${tempFilePath}`);

                const sound = new Sound(tempFilePath, '', async (error) => { // Load from file path
                    if (error) {
                        console.error('Failed to load the sound from file. Error:', JSON.stringify(error));
                        try { await RNFS.unlink(tempFilePath); } catch (e) { console.warn("Failed to delete temp audio file after load error", e); }
                        reject(new Error(t('home.errors.audioLoadFail', 'Failed to load audio.')));
                        return;
                    }
                    
                    if (isMountedRef.current) setIsAudioPlaying(true);
                    console.log(`[AudioPlayer] Sound loaded from file. Playing: ${filename}`);
                    sound.play(async (success) => {
                        if (isMountedRef.current) setIsAudioPlaying(false);
                        sound.release();
                        currentSoundInstanceRef.current = null;
                        try { await RNFS.unlink(tempFilePath); console.log("[AudioPlayer] Temp audio file deleted."); } catch (e) { console.warn("Failed to delete temp audio file after playback", e); }

                        if (success) {
                            console.log(`[AudioPlayer] Successfully finished playing: ${filename}`);
                            resolve();
                        } else {
                            console.error(`[AudioPlayer] Playback failed: ${filename}. May be decoding error.`);
                            reject(new Error(t('home.errors.audioPlayFail', 'Audio playback failed.')));
                        }
                    });
                });
                currentSoundInstanceRef.current = sound;

            } catch (fsError) {
                console.error('[AudioPlayer] RNFS writeFile error:', JSON.stringify(fsError));
                reject(new Error(t('home.errors.audioSaveFail', 'Failed to save audio for playback.')));
            }
        };

        reader.onerror = (error) => {
            console.error("FileReader error for audio blob:", error);
            reject(new Error(t('home.errors.audioProcessFail', 'Failed to process audio data.')));
        };
    });
  }, [t]); // t dependency for error messages

  const handleSpeakPress = useCallback(async () => {
    showAndResetTimer();

    // Stop any ongoing speech/audio if button is pressed again
    if (isTtsSpeaking) Tts.stop();
    if (isAudioPlaying && currentSoundInstanceRef.current) {
      currentSoundInstanceRef.current.stop(() => {
        if (isMountedRef.current) setIsAudioPlaying(false);
      });
      // Don't return, let it proceed to speak new selection if any
    }
    
    if (isProcessingAudio) return; // Already processing a request
    if (selectedItems.length === 0) return;

    if(isMountedRef.current) setIsProcessingAudio(true);

    let englishPhrase = selectedItems.map(item => item.keyword).join(' ');

    try {
      // Step 1: Generate AAC Phrase (if more than one keyword)
      if (selectedItems.length > 1) {
        const response = await apiService.generateAACPhrase(selectedItems.map(item => item.keyword));
        if (response?.phrase) {
          const generated = String(response.phrase).trim().replace(/<\|im_end\|>$/, '').trim();
          if (generated) englishPhrase = generated;
        }
      }

      if (!englishPhrase) {
        if(isMountedRef.current) setIsProcessingAudio(false);
        return;
      }

      const targetLangCode = currentUiLang.split('-')[0];

      // Step 2: Speak or Translate & Speak
      if (targetLangCode !== 'en') {
        // Non-English: Use /translate-tts and play audio directly
        console.log(`[SpeakPress] Requesting translate-tts for: "${englishPhrase}" to ${targetLangCode}`);
        const audioResponse: AudioDataResponse = await apiService.translateAndTextToSpeech(englishPhrase);
        console.log(`[SpeakPress] Received audio. Filename: ${audioResponse.filename}, Translated (header): ${audioResponse.translatedText}`);
        await playAudioBlob(audioResponse.audioBlob, audioResponse.filename);

      } else {
        // English: Use react-native-tts
        if (!isTtsInitialized) {
          Alert.alert(t('common.error', 'Error'), t('home.errors.ttsNotReady', 'TTS is not ready for English.'));
          if(isMountedRef.current) setIsProcessingAudio(false);
          return;
        }
        console.log(`[SpeakPress] Speaking (EN) via react-native-tts: "${englishPhrase}"`);
        // Ensure TTS settings are applied (redundant if useEffect for ttsSettings works reliably, but safe)
        await Tts.setDefaultLanguage(currentUiLang);
        if (ttsSettings.selectedVoiceId) await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
        
        Tts.speak(englishPhrase); // react-native-tts listeners will set isTtsSpeaking
      }
    } catch (error) {
      const processedError = handleApiError(error); // Handles Axios and other errors
      console.error('[SpeakPress] Error during speak process:', processedError.message, processedError.details);
      Alert.alert(t('common.error', 'Error'), processedError.message || t('home.errors.speakFailGeneral', 'Could not complete speech request.'));
      // Ensure loading states are reset
      if(isMountedRef.current) {
        setIsTtsSpeaking(false);
        setIsAudioPlaying(false);
      }
    } finally {
      if(isMountedRef.current) setIsProcessingAudio(false);
    }
  }, [
    selectedItems,
    isTtsSpeaking,
    isAudioPlaying,
    isProcessingAudio,
    isTtsInitialized,
    showAndResetTimer,
    t,
    currentUiLang,
    ttsSettings.selectedVoiceId,
    playAudioBlob // Added dependency
  ]);
  

  const handleTtsSettingsSave = useCallback((newSettings: VoiceSettingData) => {
    setTtsSettings(newSettings);
    Alert.alert(
      t('settings.voiceSettings.title', 'Voice Settings'),
      t('settings.voiceSettings.saveConfirmation', 'Settings saved.')
    );
    showAndResetTimer();
  }, [showAndResetTimer, t]);

  const handleHomePress = useCallback(() => {
    setSelectedItems([]);
    showAndResetTimer();
  }, [showAndResetTimer]);
  
  const handleLayoutSave = useCallback((newLayout: GridLayoutType) => {
    if (setGridLayout) setGridLayout(newLayout);
    showAndResetTimer();
  }, [showAndResetTimer, setGridLayout]);

  const handleCustomSymbolsUpdate = useCallback(() => {
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleTextInputSubmit = useCallback((text: string) => {
    setSelectedItems(prev => [...prev, { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }]);
    showAndResetTimer();
  }, [showAndResetTimer]);
  
  const handleSearchSymbolSelect = useCallback((symbol: SearchSymbolInfo) => {
    setSelectedItems(prev => [
      ...prev,
      { keyword: symbol.keyword, imageUri: symbol.pictogramUrl, id: `${Date.now()}-${symbol.keyword}-${prev.length}` },
    ]);
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleCategoryNameChange = useCallback((newCategoryName: string) => {
    if (isMountedRef.current) setCurrentCategoryName(newCategoryName);
  }, []);

  // --- UI Toggling Functions ---
  const toggleMenu = useCallback((visible: boolean) => {
    if (visible) {
        if(isMountedRef.current) setMenuVisible(true); // Show modal first
        Animated.parallel([
            Animated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 10 }),
            Animated.timing(menuOverlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    } else {
        Animated.parallel([
            Animated.spring(menuSlideAnim, { toValue: -menuWidth, useNativeDriver: true, bounciness: 4, speed: 10 }),
            Animated.timing(menuOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => { if(isMountedRef.current) setMenuVisible(false); }); // Hide modal after animation
    }
    showAndResetTimer();
  }, [menuSlideAnim, menuOverlayAnim, showAndResetTimer]);

  const openMenu = useCallback(() => toggleMenu(true), [toggleMenu]);
  const closeMenu = useCallback(() => toggleMenu(false), [toggleMenu]);

  const openSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(false); showAndResetTimer(); }, [showAndResetTimer]);
  
  const openCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(false); showAndResetTimer(); }, [showAndResetTimer]);

  const openKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(false); showAndResetTimer(); }, [showAndResetTimer]);

  // --- Render Methods ---
  const renderInputItems = () => {
    if (selectedItems.length === 0) return null;
    return selectedItems.map(item => (
      <View key={item.id} style={styles.inputItemChip}>
        {item.imageUri && <Image source={{uri: item.imageUri}} style={styles.chipImage} />}
        <Text style={styles.inputItemText} numberOfLines={1} ellipsizeMode="tail">{item.keyword}</Text>
      </View>
    ));
  };

  // --- Styles ---
  const styles = useMemo(() => {
    const categoryTitleFontSize = 16;
    return StyleSheet.create({
      safeArea: { flex: 1, backgroundColor: theme.primaryDark || '#004d7a' },
      container: { flex: 1, backgroundColor: theme.background || '#e0f7fa' },
      mainContent: { flex: 1 },
      bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BAR_HEIGHT, zIndex: 50 },
      inputItemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card || '#ffffff', borderRadius: 15, paddingVertical: Platform.OS === 'ios' ? 6 : 4, paddingHorizontal: 10, marginHorizontal: 3, marginVertical: 3, borderWidth: 1, borderColor: theme.border || '#b0bec5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, },
      chipImage: { width: 16, height: 16, marginRight: 5, resizeMode: 'contain' },
      inputItemText: { color: theme.primary || '#00796b', fontSize: fonts.body || 14, fontWeight: '500' },
      categoryTitleContainer: { paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 8 : 6, backgroundColor: theme.primary, width: '100%', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border || '#B3E5FC', },
      categoryTitleText: { fontSize: categoryTitleFontSize, fontWeight: '600', color: theme.text, textAlign: 'center' },
    });
  }, [theme, fonts]);

  // --- Component Return ---
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
        <View style={styles.container}>
          <Navbar />
          <IconInputComponent
            onSpeakPress={handleSpeakPress}
            onBackspacePress={handleBackspacePress}
            onClearPress={handleClearPress}
            isSpeakDisabled={
              selectedItems.length === 0 ||
              isTtsSpeaking || // Speaking with react-native-tts
              isAudioPlaying || // Playing with react-native-sound
              isProcessingAudio || // General processing lock
              (currentUiLang.split('-')[0] === 'en' && !isTtsInitialized) // TTS init only for English path
            }
            isBackspaceDisabled={selectedItems.length === 0 || isProcessingAudio || isTtsSpeaking || isAudioPlaying}
            isClearDisabled={selectedItems.length === 0 || isProcessingAudio || isTtsSpeaking || isAudioPlaying}
          >
            {isProcessingAudio && <ActivityIndicator size="small" color={styles.inputItemText.color} style={{ marginHorizontal: 5 }} />}
            {renderInputItems()}
          </IconInputComponent>
          
          <View style={styles.mainContent}>
            <View style={styles.categoryTitleContainer}>
              <Text style={styles.categoryTitleText} numberOfLines={1} ellipsizeMode="tail">
                {t('home.symbolsTitlePrefix', 'Symbols')}: {currentCategoryName}
              </Text>
            </View>
            <SymbolGrid
              ref={symbolGridRef}
              onSymbolPress={handleSymbolPress}
              onCategoryNameChange={handleCategoryNameChange}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.bottomBarContainer, { transform: [{ translateY: bottomBarPosition }] }]} pointerEvents={isBarVisible ? 'auto' : 'none'}>
        <BottomBar
          handleHomePress={handleHomePress}
          onSymbolSelected={handleSearchSymbolSelect}
          onTextInputSubmit={handleTextInputSubmit}
          currentLanguage={currentUiLang}
          currentTtsSettings={ttsSettings}
          onTtsSettingsSave={handleTtsSettingsSave}
          openMenu={openMenu}
          openSearchScreen={openSearchScreen}
          openCustomPageModal={openCustomPageModal}
          openKeyboardInput={openKeyboardInput}
          onCustomSymbolsUpdate={handleCustomSymbolsUpdate}
        />
      </Animated.View>

      <Modal visible={isMenuVisible} transparent={true} animationType="none" onRequestClose={closeMenu}>
        <Menu
            slideAnim={menuSlideAnim}
            overlayAnim={menuOverlayAnim}
            closeMenu={closeMenu}
            currentTtsSettings={ttsSettings}
            onTtsSettingsSave={handleTtsSettingsSave}
        />
      </Modal>

      {isSearchScreenVisible && (
        <SearchScreen
            onCloseSearch={closeSearchScreen}
            language={currentUiLang.split('-')[0]}
            onSelectSymbol={handleSearchSymbolSelect}
        />
      )}

      {isCustomPageModalVisible && (
        <Modal visible={isCustomPageModalVisible} animationType="slide" onRequestClose={closeCustomPageModal}>
            <CustomPageComponent
                onBackPress={closeCustomPageModal}
                onSymbolsUpdate={handleCustomSymbolsUpdate}
            />
        </Modal>
      )}

      {isKeyboardInputVisible && (
        <KeyboardInputComponent
            visible={isKeyboardInputVisible}
            onClose={closeKeyboardInput}
            onSubmit={handleTextInputSubmit}
            placeholder={t('keyboardInput.defaultPlaceholder', 'Type here...')}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;