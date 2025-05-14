// src/screens/HomeScreen.tsx

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';

import axios from 'axios';
import { useTranslation } from 'react-i18next';

// --- Component Imports ---
import IconInputComponent from '../components/input'; // Adjust path
import Navbar from '../components/navbar'; // Adjust path
import SymbolGrid, { SymbolGridRef } from '../components/Symbols'; // Adjust path
import BottomBar from '../components/bottomnav'; // Adjust path
import Menu, { menuWidth } from '../components/menu'; // Adjust path
import SearchScreen from '../components/SearchScreen'; // Adjust path
import CustomPageComponent from '../components/CustomPageComponent'; // Adjust path
import KeyboardInputComponent from '../components/KeyboardInputComponent'; // Adjust path

// --- Context Imports ---
import { GridLayoutType, useGrid } from '../context/GridContext'; // Adjust path
import { VoiceSettingData } from '../components/SymbolVoiceOverScreen'; // Adjust path
import { useAppearance } from '../context/AppearanceContext'; // Adjust path

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
const PHRASE_GENERATION_API_URL = 'https://b9c6-34-142-188-177.ngrok-free.app/generate_aac_phrase';

const HomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, fonts } = useAppearance();
  const { gridLayout, setGridLayout } = useGrid();

  const [isBarVisible, setIsBarVisible] = useState(true);
  const [currentUiLang, setCurrentUiLang] = useState(i18n.language);
  const [selectedItems, setSelectedItems] = useState<SelectedSymbol[]>([]);
  const [ttsSettings, setTtsSettings] = useState<VoiceSettingData>(defaultTtsSettings);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isTtsInitialized, setIsTtsInitialized] = useState(false);
  const [isGeneratingPhrase, setIsGeneratingPhrase] = useState(false);

  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchScreenVisible, setIsSearchScreenVisible] = useState(false);
  const [isCustomPageModalVisible, setIsCustomPageModalVisible] = useState(false);
  const [isKeyboardInputVisible, setIsKeyboardInputVisible] = useState(false);

  const [currentCategoryName, setCurrentCategoryName] = useState<string>(t('categories.default', 'Contextual'));

  const bottomBarPosition = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const symbolGridRef = useRef<SymbolGridRef>(null);
  const menuSlideAnim = useRef(new Animated.Value(-menuWidth)).current;
  const menuOverlayAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setCurrentCategoryName(t('categories.default', 'Contextual'));
    return () => { isMountedRef.current = false; };
  }, [t]);

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

  useEffect(() => {
    let isEffectMounted = true;
    let startListener: any, finishListener: any, cancelListener: any;

    const initializeTts = async () => {
      try {
        await Tts.setDefaultLanguage(currentUiLang);
        await Tts.getInitStatus();

        startListener = Tts.addEventListener('tts-start', () => {
          if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(true);
        });
        finishListener = Tts.addEventListener('tts-finish', () => {
          if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(false);
        });
        cancelListener = Tts.addEventListener('tts-cancel', () => {
          if (isEffectMounted && isMountedRef.current) setIsTtsSpeaking(false);
        });

        if (isEffectMounted && isMountedRef.current) {
          const voicesResult = await Tts.voices();
          const usableVoices = voicesResult.filter(
            (v) => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled)
          );
          if (usableVoices.length > 0) {
            const defaultVoice =
              usableVoices.find((v) => v.language.startsWith(currentUiLang)) ||
              usableVoices.find((v) => v.language.startsWith(currentUiLang.split('-')[0])) ||
              usableVoices[0];
            
            setTtsSettings((prev) => ({ ...prev, selectedVoiceId: defaultVoice.id }));
          }
          setIsTtsInitialized(true);
        }
      } catch (err: any) {
        console.error('TTS Init failed:', err);
        if (isEffectMounted && isMountedRef.current) setIsTtsInitialized(false);
      }
    };

    initializeTts();

    return () => {
      isEffectMounted = false;
      Tts.stop();
      startListener?.remove();
      finishListener?.remove();
      cancelListener?.remove();
    };
  }, [currentUiLang]);

  useEffect(() => {
    const updateTtsSettings = async () => {
      if (!isTtsInitialized) return;
      try {
        if (ttsSettings.selectedVoiceId) {
          await Tts.setDefaultVoice(ttsSettings.selectedVoiceId);
        }
        await Tts.setDefaultPitch(ttsSettings.pitch);
        await Tts.setDefaultRate(ttsSettings.speed);
      } catch (err: any) {
        console.error('TTS Settings Update failed:', err);
      }
    };
    updateTtsSettings();
  }, [ttsSettings, isTtsInitialized]);


  useEffect(() => {
    const handleLanguageChanged = (lng: string) => { 
      if (isMountedRef.current) {
        setCurrentUiLang(lng);
        setCurrentCategoryName(t('categories.default', 'Contextual'));
      }
    };
    i18n.on('languageChanged', handleLanguageChanged);
    if (isMountedRef.current && i18n.language !== currentUiLang) {
      setCurrentUiLang(i18n.language);
      setCurrentCategoryName(t('categories.default', 'Contextual'));
    }
    return () => { i18n.off('languageChanged', handleLanguageChanged); };
  }, [i18n, currentUiLang, t]);

  const handleSymbolPress = useCallback((keyword: string, imageUri?: string) => { setSelectedItems(prev => [...prev, { keyword, imageUri, id: `${Date.now()}-${keyword}-${prev.length}` }]); showAndResetTimer(); }, [showAndResetTimer]);
  const handleBackspacePress = useCallback(() => { setSelectedItems(prev => prev.slice(0, -1)); showAndResetTimer(); }, [showAndResetTimer]);
  const handleClearPress = useCallback(() => { setSelectedItems([]); if (isTtsSpeaking) Tts.stop(); showAndResetTimer(); }, [isTtsSpeaking, showAndResetTimer]);

  const handleSpeakPress = useCallback(async () => {
    showAndResetTimer();
    if (!isTtsInitialized) {
      Alert.alert(t('common.error', 'Error'), t('home.errors.ttsNotReady', 'TTS is not ready.'));
      return;
    }
    if (isGeneratingPhrase || isTtsSpeaking) {
      if (isTtsSpeaking) Tts.stop();
      return;
    }
    if (selectedItems.length === 0) return;

    const keywords = selectedItems.map(item => item.keyword);
    let sentenceToSpeak = keywords.join(' ');

    if (keywords.length > 1 && PHRASE_GENERATION_API_URL) {
        setIsGeneratingPhrase(true);
        try {
          const response = await axios.post(PHRASE_GENERATION_API_URL, { words: keywords }, { headers: { accept: 'application/json', 'Content-Type': 'application/json' } });
          if (response.data?.phrase) {
            let generatedPhrase = String(response.data.phrase).trim().replace(/<\|im_end\|>$/, '').trim();
            if (generatedPhrase) {
                sentenceToSpeak = generatedPhrase;
            }
          }
        } catch (error: any) {
            console.error('Phrase Generation API Error:', error.response?.data || error.message || error);
            Alert.alert(t('home.errors.phraseGenFailTitle', 'Phrase Generation Failed'), t('home.errors.phraseGenFailMessage', 'Could not generate phrase.'));
        }
        finally { if(isMountedRef.current) setIsGeneratingPhrase(false); }
    } else if (keywords.length === 1) {
        sentenceToSpeak = keywords[0];
    }

    if (sentenceToSpeak) {
      try {
        Tts.speak(sentenceToSpeak);
      } catch (error: any) {
        console.error('TTS Speak error:', error);
        if(isMountedRef.current) setIsTtsSpeaking(false);
        Alert.alert(t('common.error', 'Error'), `${t('home.errors.speakFail', 'Could not speak.')} ${error.message || ''}`);
      }
    }
  }, [selectedItems, isTtsSpeaking, isTtsInitialized, showAndResetTimer, isGeneratingPhrase, t]);

  const handleTtsSettingsSave = useCallback((newSettings: VoiceSettingData) => { setTtsSettings(newSettings); Alert.alert(t('settings.voiceSettings.title', 'Voice Settings'), t('settings.voiceSettings.saveConfirmation', 'Settings saved.')); showAndResetTimer(); }, [showAndResetTimer, t]);
  const handleHomePress = useCallback(() => { setSelectedItems([]); showAndResetTimer(); }, [showAndResetTimer]);
  
  const handleLayoutSave = useCallback((newLayout: GridLayoutType) => { 
    if (setGridLayout) setGridLayout(newLayout); 
    showAndResetTimer(); 
  }, [showAndResetTimer, setGridLayout]);

  const handleCustomSymbolsUpdate = useCallback(() => {
    showAndResetTimer();
  }, [showAndResetTimer]);

  const handleTextInputSubmit = useCallback((text: string) => { setSelectedItems(prev => [...prev, { keyword: text, id: `${Date.now()}-${text}-${prev.length}` }]); showAndResetTimer(); }, [showAndResetTimer]);
  
  const handleSearchSymbolSelect = useCallback(
    (symbol: SearchSymbolInfo) => {
      setSelectedItems((prev) => [
        ...prev,
        { keyword: symbol.keyword, imageUri: symbol.pictogramUrl, id: `${Date.now()}-${symbol.keyword}-${prev.length}` },
      ]);
      showAndResetTimer();
    },
    [showAndResetTimer]
  );

  const handleCategoryNameChange = useCallback((newCategoryName: string) => {
    if (isMountedRef.current) {
      setCurrentCategoryName(newCategoryName);
    }
  }, []);

  const renderInputItems = () => {
    if (selectedItems.length === 0) return null;
    return selectedItems.map(item => (
      <View key={item.id} style={styles.inputItemChip}>
        {item.imageUri && <Image source={{uri: item.imageUri}} style={styles.chipImage} />}
        <Text style={styles.inputItemText} numberOfLines={1} ellipsizeMode="tail">{item.keyword}</Text>
      </View>
    ));
  };

  const openMenu = useCallback(() => { if(isMountedRef.current) setMenuVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeMenu = useCallback(() => { 
    Animated.parallel([ 
        Animated.spring(menuSlideAnim, { toValue: -menuWidth, useNativeDriver: true, bounciness: 4, speed: 10 }), 
        Animated.timing(menuOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }), 
    ]).start(() => { if(isMountedRef.current) setMenuVisible(false); }); 
    showAndResetTimer(); 
  }, [menuSlideAnim, menuOverlayAnim, showAndResetTimer]);

  const openSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeSearchScreen = useCallback(() => { if(isMountedRef.current) setIsSearchScreenVisible(false); showAndResetTimer(); }, [showAndResetTimer]);
  
  const openCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeCustomPageModal = useCallback(() => { if(isMountedRef.current) setIsCustomPageModalVisible(false); showAndResetTimer(); }, [showAndResetTimer]);

  const openKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(true); showAndResetTimer(); }, [showAndResetTimer]);
  const closeKeyboardInput = useCallback(() => { if(isMountedRef.current) setIsKeyboardInputVisible(false); showAndResetTimer(); }, [showAndResetTimer]);

  useEffect(() => {
    if (isMenuVisible) {
        Animated.parallel([
            Animated.spring(menuSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 10 }),
            Animated.timing(menuOverlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    }
  }, [isMenuVisible, menuSlideAnim, menuOverlayAnim]);


  const styles = useMemo(() => {
    const categoryTitleFontSize = 16; // Reduced font size

    return StyleSheet.create({
      safeArea: { flex: 1, backgroundColor: theme.primaryDark || '#004d7a' },
      container: { flex: 1, backgroundColor: theme.background || '#e0f7fa' },
      mainContent: { flex: 1 },
      bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BAR_HEIGHT, zIndex: 50 },
      inputItemChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card || '#ffffff', borderRadius: 15, paddingVertical: Platform.OS === 'ios' ? 6 : 4, paddingHorizontal: 10, marginHorizontal: 3, marginVertical: 3, borderWidth: 1, borderColor: theme.border || '#b0bec5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, },
      chipImage: { width: 16, height: 16, marginRight: 5, resizeMode: 'contain' },
      inputItemText: { color: theme.primary || '#00796b', fontSize: fonts.body || 14, fontWeight: '500' },
      categoryTitleContainer: {
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 8 : 6,
        backgroundColor: theme.primary,
        width: '100%',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#B3E5FC',
      },
      categoryTitleText: {
        fontSize: categoryTitleFontSize,
        fontWeight: '600',
        color: theme.text,
        textAlign: 'center',
      },
    });
  }, [theme, fonts]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={showAndResetTimer} accessible={false}>
        <View style={styles.container}>
          <Navbar />
          <IconInputComponent
            onSpeakPress={handleSpeakPress}
            onBackspacePress={handleBackspacePress}
            onClearPress={handleClearPress}
            isSpeakDisabled={selectedItems.length === 0 || isTtsSpeaking || isGeneratingPhrase || !isTtsInitialized}
            isBackspaceDisabled={selectedItems.length === 0 || isGeneratingPhrase || isTtsSpeaking}
            isClearDisabled={selectedItems.length === 0 || isGeneratingPhrase || isTtsSpeaking}
          >
            {isGeneratingPhrase && <ActivityIndicator size="small" color={styles.inputItemText.color} style={{ marginHorizontal: 5 }} />}
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