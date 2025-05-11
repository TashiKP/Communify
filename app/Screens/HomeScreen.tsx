import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Easing,
  Platform,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';
import axios from 'axios';

import IconInputComponent from '../components/input';
import Navbar from '../components/navbar';
import SymbolGrid, { SymbolGridRef } from '../components/Symbols';
import BottomBar from '../components/bottomnav';
import { GridLayoutType } from '../context/GridContext';
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen';

type SearchSymbolInfo = { keyword: string; pictogramUrl: string };
type SelectedSymbol = { id: string; keyword: string; imageUri?: string };

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
const PHRASE_GENERATION_API_URL = 'https://b9c6-34-142-188-177.ngrok-free.app/generate_aac_phrase';

const HomeScreen = () => {
  const [isBarVisible, setIsBarVisible] = useState(true);
  const [currentLang, setCurrentLang] = useState('en');
  const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);
  const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [isGeneratingPhrase, setIsGeneratingPhrase] = useState(false);

  const bottomBarPosition = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const symbolGridRef = useRef<SymbolGridRef>(null);

  const slideUp = useCallback(() => {
    Animated.timing(bottomBarPosition, {
      toValue: 0,
      duration: ANIMATION_DURATION_IN,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [bottomBarPosition]);

  const slideDown = useCallback(() => {
    Animated.timing(bottomBarPosition, {
      toValue: BOTTOM_BAR_HEIGHT + (Platform.OS === 'ios' ? 30 : 10),
      duration: ANIMATION_DURATION_OUT,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [bottomBarPosition]);

  const showAndResetTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!isBarVisible) {
      setIsBarVisible(true);
      slideUp();
    }
    hideTimerRef.current = setTimeout(() => {
      setIsBarVisible(false);
      slideDown();
      hideTimerRef.current = null;
    }, HIDE_DELAY);
  }, [isBarVisible, slideUp, slideDown]);

  useEffect(() => {
    showAndResetTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showAndResetTimer]);

  // One-time TTS initialization
  useEffect(() => {
    let isMounted = true;
    let startListener: any, finishListener: any, cancelListener: any;

    const initializeTts = async () => {
      try {
        await Tts.setDefaultLanguage(currentLang);
        await Tts.getInitStatus();
        startListener = Tts.addEventListener('tts-start', () => {
          if (isMounted) setIsTtsSpeaking(true);
        });
        finishListener = Tts.addEventListener('tts-finish', () => {
          if (isMounted) setIsTtsSpeaking(false);
        });
        cancelListener = Tts.addEventListener('tts-cancel', () => {
          if (isMounted) setIsTtsSpeaking(false);
        });
        if (isMounted) {
          const voicesResult = await Tts.voices();
          const usableVoices = voicesResult.filter(
            (v) => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled)
          );
          if (usableVoices.length > 0) {
            const defaultVoice =
              usableVoices.find((v) => v.language.startsWith(currentLang)) || usableVoices[0];
            setTtsSettings((prev) => ({ ...prev, selectedVoiceId: defaultVoice.id }));
          }
          setIsTtsInitialized(true);
          console.log('TTS Initialized');
        }
      } catch (err: any) {
        console.error('TTS Init failed:', err);
        if (isMounted) setIsTtsInitialized(false);
      }
    };

    initializeTts();

    return () => {
      isMounted = false;
      Tts.stop();
      startListener?.remove();
      finishListener?.remove();
      cancelListener?.remove();
    };
  }, [currentLang]); // Only depend on currentLang for initial setup

  // Update TTS settings when they change
  useEffect(() => {
    const updateTtsSettings = async () => {
      try {
        if (ttsSettings.selectedVoiceId) {
          await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
        }
        await Tts.setDefaultPitch(ttsSettings.pitch * 1.5 + 0.5);
        await Tts.setDefaultRate(ttsSettings.speed * 0.9 + 0.05);
      } catch (err: any) {
        console.error('TTS Settings Update failed:', err);
      }
    };

    if (isTtsInitialized) {
      updateTtsSettings();
    }
  }, [ttsSettings, isTtsInitialized]);

  const handleSymbolPress = useCallback(
    (keyword: string, imageUri?: string) => {
      setSelectedItems((prev) => [
        ...prev,
        { keyword, imageUri, id: `${Date.now()}-${keyword}-${prev.length}` },
      ]);
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleBackspacePress = useCallback(() => {
    setSelectedItems((prev) => prev.slice(0, -1));
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleClearPress = useCallback(() => {
    setSelectedItems([]);
    if (isTtsSpeaking) Tts.stop();
    showAndResetTimer();
  }, [isTtsSpeaking, showAndResetTimer]);

  const handleSpeakPress = useCallback(async () => {
    showAndResetTimer();
    if (!isTtsInitialized) {
      Alert.alert('TTS Error', 'TTS not ready.');
      return;
    }
    if (isGeneratingPhrase || isTtsSpeaking) {
      if (isTtsSpeaking) Tts.stop();
      return;
    }
    if (selectedItems.length === 0) return;

    const keywords = selectedItems.map((item) => item.keyword);
    let sentenceToSpeak = keywords.join(' ');

    setIsGeneratingPhrase(true);

    try {
      console.log('Sending keywords to API:', keywords);
      const response = await axios.post(
        PHRASE_GENERATION_API_URL,
        { words: keywords },
        { headers: { accept: 'application/json', 'Content-Type': 'application/json' } }
      );

      console.log('API Response:', response.data);

      if (response.data && typeof response.data.phrase === 'string') {
        let generatedPhrase = response.data.phrase.trim();
        generatedPhrase = generatedPhrase.replace(/<\|im_end\|>$/, '').trim();
        if (generatedPhrase) {
          sentenceToSpeak = generatedPhrase;
          console.log(`HomeScreen: Using generated phrase - "${sentenceToSpeak}"`);
        } else {
          console.log('HomeScreen: API returned empty phrase, using raw keywords.');
        }
      } else {
        console.warn('HomeScreen: Unexpected API response format, using raw keywords.');
      }
    } catch (error: any) {
      console.error('Phrase Generation API Error:', error.response?.data || error.message || error);
      Alert.alert('Phrase Generation Failed', 'Could not generate phrase. Speaking individual words.');
    } finally {
      setIsGeneratingPhrase(false);
    }

    if (sentenceToSpeak) {
      console.log(`HomeScreen: Speaking - "${sentenceToSpeak}"`);
      try {
        Tts.speak(sentenceToSpeak);
      } catch (error: any) {
        console.error('TTS Speak error:', error);
        setIsTtsSpeaking(false);
        Alert.alert('Speak Error', `Could not speak the sentence. ${error.message || ''}`);
      }
    } else {
      console.log('HomeScreen: No sentence to speak.');
    }
  }, [
    selectedItems,
    isTtsSpeaking,
    ttsSettings,
    isTtsInitialized,
    showAndResetTimer,
    isGeneratingPhrase,
  ]);

  const handleTtsSettingsSave = useCallback(
    (newSettings: VoiceSettingData) => {
      setTtsSettings(newSettings);
      Alert.alert('Settings Saved', 'Voice updated.');
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleHomePress = useCallback(() => {
    console.log('Home Pressed');
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleLayoutSave = useCallback(
    (newLayout: GridLayoutType) => {
      console.log('Layout save notified:', newLayout);
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleCustomSymbolsUpdate = useCallback(
    (updatedSymbols: any[]) => {
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleTextInputSubmit = useCallback(
    (text: string) => {
      setSelectedItems((prev) => [
        ...prev,
        { keyword: text, id: `${Date.now()}-${text}-${prev.length}` },
      ]);
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleSearchSymbolSelect = useCallback(
    (symbol: SearchSymbolInfo) => {
      setSelectedItems((prev) => [
        ...prev,
        { keyword: symbol.keyword, id: `${Date.now()}-${symbol.keyword}-${prev.length}` },
      ]);
      const currentCategory = symbolGridRef.current?.selectedCategoryName;
      if (currentCategory && currentCategory !== 'Contextual' && currentCategory !== 'Custom') {
        symbolGridRef.current?.addKeywordToCategory(currentCategory, symbol.keyword);
      } else {
        console.log(`Cannot add to category: ${currentCategory}`);
      }
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const renderInputItems = () => {
    if (selectedItems.length === 0) return null;
    return selectedItems.map((item) => (
      <View key={item.id} style={styles.inputItemChip}>
        <Text style={styles.inputItemText}>{item.keyword}</Text>
      </View>
    ));
  };

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
              selectedItems.length === 0 || isTtsSpeaking || isGeneratingPhrase || !isTtsInitialized
            }
            isBackspaceDisabled={selectedItems.length === 0 || isGeneratingPhrase || isTtsSpeaking}
            isClearDisabled={selectedItems.length === 0 || isGeneratingPhrase || isTtsSpeaking}
          >
            {isGeneratingPhrase && (
              <ActivityIndicator size="small" color={styles.inputItemText.color} style={{ marginHorizontal: 5 }} />
            )}
            {renderInputItems()}
          </IconInputComponent>
          <View style={styles.mainContent}>
            <SymbolGrid ref={symbolGridRef} onSymbolPress={handleSymbolPress} />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <Animated.View
        style={[styles.bottomBarContainer, { transform: [{ translateY: bottomBarPosition }] }]}
        pointerEvents={isBarVisible ? 'auto' : 'none'}
      >
        <BottomBar
          handleHomePress={handleHomePress}
          onSymbolSelected={handleSearchSymbolSelect}
          onTextInputSubmit={handleTextInputSubmit}
          currentLanguage={currentLang}
          onGridLayoutSave={handleLayoutSave}
          onCustomSymbolsUpdate={handleCustomSymbolsUpdate}
          currentTtsSettings={ttsSettings}
          onTtsSettingsSave={handleTtsSettingsSave}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0077b6' },
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  mainContent: { flex: 1 },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BAR_HEIGHT, zIndex: 5 },
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
  inputItemText: { color: '#0077b6', fontSize: 15, fontWeight: '500' },
});

export default HomeScreen;