// src/components/SymbolVoiceOverScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Switch, Keyboard // Keyboard might not be strictly needed here
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo,
    faLock, faLockOpen, faCommentDots,
    faClosedCaptioning,
    faHighlighter,
    faPlayCircle,
    faSlidersH,
    // faVolumeUp // Already covered by faSlidersH conceptually for section
} from '@fortawesome/free-solid-svg-icons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

// --- API Service ---
import apiService, {
    handleApiError,
    AppearanceSettingsRead, // For fetching all appearance settings
    AppearanceSettingsUpdatePayload, // For sending partial updates
} from '../services/apiService'; // Adjust path

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext'; // Adjust path

// --- Import Language Specific Text Style Helper ---
import { getLanguageSpecificTextStyle } from '../styles/typography'; // Adjust path

// --- Type Definitions ---
// This is the local state structure for this screen
export interface VoiceSettingData {
    pitch: number;
    speed: number;
    volume: number;
    pitchLocked: boolean; // UI only state, not typically saved to API
    speedLocked: boolean; // UI only state
    volumeLocked: boolean; // UI only state
    selectedVoiceId: string | null;
    highlightWord: boolean;
    speakPunctuation: boolean;
}

interface TtsVoice { id: string; name: string; language: string; quality?: number; latency?: number; networkConnectionRequired?: boolean; notInstalled?: boolean; }

interface SymbolVoiceOverScreenProps {
    // initialSettings can be used for faster UI display before API loads or as fallback
    initialSettings: VoiceSettingData;
    onSave: (settings: VoiceSettingData) => Promise<void> | void; // Called to update parent's state
    onClose: () => void;
}

// --- Default Values for local state ---
const defaultLocalVoiceSettings: VoiceSettingData = {
    pitch: 0.5, speed: 0.5, volume: 0.8,
    pitchLocked: false, speedLocked: false, volumeLocked: false,
    selectedVoiceId: null, highlightWord: true, speakPunctuation: false
};

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545'; // Consider theme.error

// --- Component ---
const SymbolVoiceOverScreen: React.FC<SymbolVoiceOverScreenProps> = ({
    initialSettings: initialPropsSettings, // From parent (Menu), might be from context or API originally
    onSave, // To update parent's (Menu's) state, which then updates HomeScreen state
    onClose,
}) => {
    const { theme, fonts, isLoadingAppearance: isLoadingContextAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [localSettings, setLocalSettings] = useState<VoiceSettingData>(() => ({ ...defaultLocalVoiceSettings, ...initialPropsSettings }));
    // Stores the last successfully fetched/saved state from API
    const [originalSettingsFromApi, setOriginalSettingsFromApi] = useState<VoiceSettingData>(() => ({ ...defaultLocalVoiceSettings, ...initialPropsSettings }));
    
    const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true); // For TTS.voices()
    const [isLoadingApi, setIsLoadingApi] = useState(true); // For fetching settings from API
    const [isSaving, setIsSaving] = useState(false); // For API save operation
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isMountedRef = useRef(true);

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({ trackColor: { false: theme.disabled || '#767577', true: theme.secondary || '#81c784' }, thumbColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined, ios_backgroundColor: theme.disabled || '#767577', }), [theme]);
    const sliderStyles = useMemo(() => ({ minimumTrackTintColor: theme.primary || '#007aff', maximumTrackTintColor: theme.border || '#ccc', thumbTintColor: Platform.OS === 'android' ? (theme.primary || '#007aff') : undefined }), [theme]);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(localSettings) !== JSON.stringify(originalSettingsFromApi), [localSettings, originalSettingsFromApi]);

    useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

    // Sync with initialPropsSettings if they change (e.g., parent re-renders with new props)
    useEffect(() => {
        const merged = { ...defaultLocalVoiceSettings, ...initialPropsSettings };
        // Only update if significantly different to avoid loops if parent updates from this screen's onSave
        if (JSON.stringify(localSettings) !== JSON.stringify(merged)) {
            setLocalSettings(merged);
        }
        // originalSettingsFromApi is updated by API fetch/save, not directly by initialPropsSettings after first load.
    }, [initialPropsSettings]);


    // Fetch settings from API on mount
    useEffect(() => {
        let isEffectMounted = true;
        const fetchTtsSettingsFromApi = async () => {
            if (!isMountedRef.current || typeof t !== 'function') return;
            setIsLoadingApi(true);
            try {
                const apiSettings: AppearanceSettingsRead = await apiService.fetchAppearanceSettings();
                if (isMountedRef.current && isEffectMounted) {
                    const fetchedVoiceSettings: VoiceSettingData = {
                        pitch: apiSettings.ttsPitch ?? defaultLocalVoiceSettings.pitch,
                        speed: apiSettings.ttsSpeed ?? defaultLocalVoiceSettings.speed,
                        volume: apiSettings.ttsVolume ?? defaultLocalVoiceSettings.volume,
                        selectedVoiceId: apiSettings.ttsSelectedVoiceId ?? defaultLocalVoiceSettings.selectedVoiceId,
                        highlightWord: apiSettings.ttsHighlightWord ?? defaultLocalVoiceSettings.highlightWord,
                        speakPunctuation: apiSettings.ttsSpeakPunctuation ?? defaultLocalVoiceSettings.speakPunctuation,
                        // Locked states are UI only, not from API
                        pitchLocked: localSettings.pitchLocked,
                        speedLocked: localSettings.speedLocked,
                        volumeLocked: localSettings.volumeLocked,
                    };
                    setLocalSettings(fetchedVoiceSettings);
                    setOriginalSettingsFromApi(fetchedVoiceSettings);
                }
            } catch (error) {
                const errorInfo = handleApiError(error);
                console.error("SymbolVoiceOverScreen: Failed to fetch TTS settings:", errorInfo.message);
                if (isMountedRef.current && isEffectMounted) {
                    Alert.alert(t('common.error', 'Error'), t('voiceSettings.errors.fetchFailApi', { message: errorInfo.message }));
                    // Fallback to initialPropsSettings if API fails
                    const fallback = { ...defaultLocalVoiceSettings, ...initialPropsSettings };
                    setLocalSettings(fallback);
                    setOriginalSettingsFromApi(fallback);
                }
            } finally {
                if (isMountedRef.current && isEffectMounted) setIsLoadingApi(false);
            }
        };
        if (typeof t === 'function' && i18n.isInitialized) fetchTtsSettingsFromApi();
        return () => { isEffectMounted = false; };
    }, [t, i18n.isInitialized, initialPropsSettings]); // initialPropsSettings as a dependency for initial load/fallback

    // Initialize TTS and load voices
    useEffect(() => {
        // This effect for Tts.voices() can run independently or after API settings are loaded.
        // For now, let it run. It sets a default voice if localSettings.selectedVoiceId is not valid.
        let isTtsEffectMounted = true;
        let startListener: any = null, finishListener: any = null, cancelListener: any = null;

        const initTtsAndLoadVoices = async () => {
            if (!isMountedRef.current || !isTtsEffectMounted) return;
            setIsLoadingVoices(true);
            try {
                await Tts.getInitStatus(); // Ensure TTS engine is ready
                startListener = Tts.addEventListener('tts-start', () => { if (isMountedRef.current && isTtsEffectMounted) setIsSpeaking(true); });
                finishListener = Tts.addEventListener('tts-finish', () => { if (isMountedRef.current && isTtsEffectMounted) setIsSpeaking(false); });
                cancelListener = Tts.addEventListener('tts-cancel', () => { if (isMountedRef.current && isTtsEffectMounted) setIsSpeaking(false); });

                const voicesResult = await Tts.voices();
                const usableVoices = (voicesResult as TtsVoice[])
                    .filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled))
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (isMountedRef.current && isTtsEffectMounted) {
                    setAvailableVoices(usableVoices);
                    // If current selectedVoiceId from (API/props) isn't in usableVoices, pick a default
                    const currentSelected = localSettings.selectedVoiceId;
                    if (!usableVoices.some(v => v.id === currentSelected) && usableVoices.length > 0) {
                        const langMatch = usableVoices.find(v => v.language.startsWith(i18n.language)) ||
                                          usableVoices.find(v => v.language.startsWith(i18n.language.split('-')[0]));
                        const voiceToSet = langMatch ? langMatch.id : usableVoices[0].id;
                        
                        setLocalSettings(prev => {
                            // Only update if different to prevent loops and if this runs after API fetch
                            if (prev.selectedVoiceId !== voiceToSet) {
                                return { ...prev, selectedVoiceId: voiceToSet };
                            }
                            return prev;
                        });
                    }
                }
            } catch (error: any) {
                console.error("SymbolVoiceOverScreen: Failed TTS init/load voices:", error);
                if (isMountedRef.current && isTtsEffectMounted && error.message?.indexOf('TTS engine is not ready') === -1 ) {
                    Alert.alert(t('voiceSettings.errors.ttsInitTitle'), t('voiceSettings.errors.ttsInitMessage', { message: error.message }));
                }
            } finally {
                if (isMountedRef.current && isTtsEffectMounted) setIsLoadingVoices(false);
            }
        };
        initTtsAndLoadVoices();
        return () => { isTtsEffectMounted = false; Tts.stop(); startListener?.remove(); finishListener?.remove(); cancelListener?.remove(); };
    }, [t, i18n.language]); // localSettings.selectedVoiceId removed from deps to avoid loop, handled inside

    const handleSettingChange = useCallback(<K extends keyof VoiceSettingData>(key: K, value: VoiceSettingData[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const handlePreview = async () => { /* ... (same logic as before) ... */ };
    const handleReset = () => { if (!hasUnsavedChanges || isSaving) return; Alert.alert(t('voiceSettings.resetConfirmTitle'), t('voiceSettings.resetConfirmMessage'), [{ text: t('common.cancel'), style: "cancel" }, { text: t('common.reset'), style: "destructive", onPress: () => setLocalSettings(originalSettingsFromApi) }]); };

    const handleSave = async () => {
        if (!hasUnsavedChanges || isSaving || isLoadingApi || isLoadingContextAppearance) return;
        setIsSaving(true);
        Keyboard.dismiss(); // Just in case

        const settingsToSaveToApi: Partial<AppearanceSettingsUpdatePayload> = {};
        if (localSettings.pitch !== originalSettingsFromApi.pitch) settingsToSaveToApi.ttsPitch = localSettings.pitch;
        if (localSettings.speed !== originalSettingsFromApi.speed) settingsToSaveToApi.ttsSpeed = localSettings.speed;
        if (localSettings.volume !== originalSettingsFromApi.volume) settingsToSaveToApi.ttsVolume = localSettings.volume;
        if (localSettings.selectedVoiceId !== originalSettingsFromApi.selectedVoiceId) settingsToSaveToApi.ttsSelectedVoiceId = localSettings.selectedVoiceId;
        if (localSettings.highlightWord !== originalSettingsFromApi.highlightWord) settingsToSaveToApi.ttsHighlightWord = localSettings.highlightWord;
        if (localSettings.speakPunctuation !== originalSettingsFromApi.speakPunctuation) settingsToSaveToApi.ttsSpeakPunctuation = localSettings.speakPunctuation;

        try {
            if (Object.keys(settingsToSaveToApi).length > 0) {
                const updatedApiSettings = await apiService.saveAppearanceSettings(settingsToSaveToApi);
                if (isMountedRef.current) {
                    // Update originalSettingsFromApi with confirmed saved state
                    setOriginalSettingsFromApi({
                        ...originalSettingsFromApi, // Keep existing non-TTS settings from API
                        pitch: updatedApiSettings.ttsPitch ?? localSettings.pitch,
                        speed: updatedApiSettings.ttsSpeed ?? localSettings.speed,
                        volume: updatedApiSettings.ttsVolume ?? localSettings.volume,
                        selectedVoiceId: updatedApiSettings.ttsSelectedVoiceId ?? localSettings.selectedVoiceId,
                        highlightWord: updatedApiSettings.ttsHighlightWord ?? localSettings.highlightWord,
                        speakPunctuation: updatedApiSettings.ttsSpeakPunctuation ?? localSettings.speakPunctuation,
                        // Locked states are UI only
                        pitchLocked: localSettings.pitchLocked,
                        speedLocked: localSettings.speedLocked,
                        volumeLocked: localSettings.volumeLocked,
                    });
                    // Sync localSettings after successful save to ensure hasUnsavedChanges becomes false
                     setLocalSettings(prev => ({
                        ...prev,
                        pitch: updatedApiSettings.ttsPitch ?? localSettings.pitch,
                        speed: updatedApiSettings.ttsSpeed ?? localSettings.speed,
                        volume: updatedApiSettings.ttsVolume ?? localSettings.volume,
                        selectedVoiceId: updatedApiSettings.ttsSelectedVoiceId ?? localSettings.selectedVoiceId,
                        highlightWord: updatedApiSettings.ttsHighlightWord ?? localSettings.highlightWord,
                        speakPunctuation: updatedApiSettings.ttsSpeakPunctuation ?? localSettings.speakPunctuation,
                    }));
                }
            }
            
            // Call the onSave prop passed from Menu to update HomeScreen's local TTS state
            await onSave(localSettings); // Pass the current localSettings

            if(isMountedRef.current) setIsSaving(false);
            Alert.alert(t('voiceSettings.saveSuccessTitle', 'Success'), t('voiceSettings.saveSuccessMessage', 'Voice settings saved.'));
            onClose();

        } catch (error) {
            const errorInfo = handleApiError(error);
            console.error("Error saving voice settings to API:", errorInfo.message);
            if (isMountedRef.current) setIsSaving(false);
            Alert.alert(t('common.error', 'Error'), t('voiceSettings.errors.saveFailApi', { message: errorInfo.message }));
        }
    };

    const handleAttemptClose = useCallback(() => { /* ... (same) ... */ if (isSpeaking) Tts.stop(); if (hasUnsavedChanges) { Alert.alert( t('voiceSettings.unsavedChangesTitle'), t('voiceSettings.unsavedChangesMessage'), [{ text: t('common.cancel'), style: "cancel" }, { text: t('common.discard'), style: "destructive", onPress: onClose }] ); } else { onClose(); } }, [hasUnsavedChanges, onClose, isSpeaking, t]);
    const formatValue = (value: number) => `${Math.round(value * 100)}%`;

    const isLoading = isLoadingContextAppearance || isLoadingVoices || isLoadingApi;
    const isSaveDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isResetDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isPreviewDisabled = isSaving || isLoading || !localSettings.selectedVoiceId || isSpeaking; // Also disable if speaking

    if (isLoading) { /* ... (same loading UI) ... */ }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header (same) */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} /* ... */ ><FontAwesomeIcon icon={faArrowLeft} size={(fonts.h2 || 20) * 0.7} color={theme.white || '#fff'} /></TouchableOpacity>
                <View style={styles.titleContainer}><Text style={[styles.title, { color: theme.white || '#fff' }]} numberOfLines={1}>{t('voiceSettings.title')}</Text></View>
                <TouchableOpacity style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]} onPress={handleSave} disabled={isSaveDisabled} /* ... */ >{isSaving ? (<ActivityIndicator size="small" color={theme.white || '#fff'} />) : (<FontAwesomeIcon icon={faSave} size={(fonts.h2 || 20) * 0.7} color={!isSaveDisabled ? (theme.white || '#fff') : (theme.disabled || '#ccc')} />)}</TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                {/* Voice Selection */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}><FontAwesomeIcon icon={faCommentDots} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.cardIcon} /><Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('voiceSettings.voiceSectionTitle')}</Text></View>
                    <View style={styles.cardContent}>
                        {isLoadingVoices || isLoadingApi ? (<ActivityIndicator style={styles.loadingIndicator} size="small" color={theme.primary || '#007aff'} />)
                        : availableVoices.length > 0 ? (
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={localSettings.selectedVoiceId} onValueChange={(itemValue) => { if (itemValue) handleSettingChange('selectedVoiceId', itemValue as string); }} style={styles.picker} itemStyle={styles.pickerItem} mode="dropdown" accessibilityLabel={t('voiceSettings.voiceSelectAccessibilityLabel')} dropdownIconColor={theme.textSecondary || '#555'} prompt={t('voiceSettings.voiceSelectPrompt')} >
                                    {availableVoices.map((voice) => (<Picker.Item key={voice.id} label={`${voice.name} (${voice.language})`} value={voice.id} color={theme.text || '#000'} />))}
                                </Picker>
                            </View>
                        ) : (<Text style={[styles.errorText, { color: errorColor }]}>{t('voiceSettings.errors.noVoices')}</Text>)}
                    </View>
                </View>

                {/* Speech Parameters (Pitch, Speed, Volume) - using localSettings */}
                <View style={styles.sectionCard}>
                    {/* ... (Pitch, Speed, Volume Sliders - ensure they use localSettings and handleSettingChange) ... */}
                    <View style={styles.cardHeader}><FontAwesomeIcon icon={faSlidersH} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.cardIcon} /><Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('voiceSettings.parametersSectionTitle')}</Text></View>
                    <View style={styles.cardContent}>
                        {/* Pitch */}
                        <View style={styles.settingSection}><Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>{t('voiceSettings.pitchLabel')}</Text><View style={styles.sliderControlRow}><TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('pitchLocked', !localSettings.pitchLocked)} /* ... */ ><FontAwesomeIcon icon={localSettings.pitchLocked ? faLock : faLockOpen} size={(fonts.body || 16) * 1.1} color={localSettings.pitchLocked ? (theme.primary || '#007aff') : (theme.textSecondary || '#555')} /></TouchableOpacity><Slider style={styles.slider} value={localSettings.pitch} onValueChange={(v) => handleSettingChange('pitch', v)} disabled={localSettings.pitchLocked || isSaving} {...sliderStyles} /><Text style={[styles.valueText, { color: theme.primary || '#007aff' }]}>{formatValue(localSettings.pitch)}</Text></View></View>
                        {/* Speed */}
                        <View style={styles.settingSection}><Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>{t('voiceSettings.speedLabel')}</Text><View style={styles.sliderControlRow}><TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('speedLocked', !localSettings.speedLocked)} /* ... */ ><FontAwesomeIcon icon={localSettings.speedLocked ? faLock : faLockOpen} size={(fonts.body || 16) * 1.1} color={localSettings.speedLocked ? (theme.primary || '#007aff') : (theme.textSecondary || '#555')} /></TouchableOpacity><Slider style={styles.slider} value={localSettings.speed} onValueChange={(v) => handleSettingChange('speed', v)} disabled={localSettings.speedLocked || isSaving} {...sliderStyles} /><Text style={[styles.valueText, { color: theme.primary || '#007aff' }]}>{formatValue(localSettings.speed)}</Text></View></View>
                        {/* Volume */}
                        <View style={styles.settingSection}><Text style={[styles.settingLabel, { color: theme.text || '#000' }]}>{t('voiceSettings.volumeLabel')}</Text><View style={styles.sliderControlRow}><TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('volumeLocked', !localSettings.volumeLocked)} /* ... */ ><FontAwesomeIcon icon={localSettings.volumeLocked ? faLock : faLockOpen} size={(fonts.body || 16) * 1.1} color={localSettings.volumeLocked ? (theme.primary || '#007aff') : (theme.textSecondary || '#555')} /></TouchableOpacity><Slider style={styles.slider} value={localSettings.volume} onValueChange={(v) => handleSettingChange('volume', v)} disabled={localSettings.volumeLocked || isSaving} {...sliderStyles} /><Text style={[styles.valueText, { color: theme.primary || '#007aff' }]}>{formatValue(localSettings.volume)}</Text></View><Text style={[styles.infoTextSmall, { color: theme.textSecondary || '#555' }]}>{t('voiceSettings.volumeNote')}</Text></View>
                    </View>
                </View>

                {/* Speech Behavior (Highlight, Punctuation) - using localSettings */}
                <View style={styles.sectionCard}>
                     {/* ... (Highlight Word, Speak Punctuation Switches - ensure they use localSettings and handleSettingChange) ... */}
                    <View style={styles.cardHeader}><FontAwesomeIcon icon={faClosedCaptioning} size={(fonts.body || 16) * 1.1} color={theme.primary || '#007aff'} style={styles.cardIcon} /><Text style={[styles.sectionTitle, { color: theme.text || '#000' }]}>{t('voiceSettings.behaviorSectionTitle')}</Text></View>
                    <View style={styles.cardContent}>
                        <View style={styles.switchRow}><FontAwesomeIcon icon={faHighlighter} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.switchIcon} /><Text style={[styles.switchLabel, { color: theme.text || '#000' }]}>{t('voiceSettings.highlightLabel')}</Text><Switch value={localSettings.highlightWord} onValueChange={(v) => handleSettingChange('highlightWord', v)} {...switchStyles} disabled={isSaving} /></View>
                        <View style={styles.switchRow}><FontAwesomeIcon icon={faClosedCaptioning} size={(fonts.body || 16) * 1.1} color={theme.textSecondary || '#555'} style={styles.switchIcon} /><Text style={[styles.switchLabel, { color: theme.text || '#000' }]}>{t('voiceSettings.punctuationLabel')}</Text><Switch value={localSettings.speakPunctuation} onValueChange={(v) => handleSettingChange('speakPunctuation', v)} {...switchStyles} disabled={isSaving} /></View>
                        <Text style={[styles.infoText, { color: theme.textSecondary || '#555' }]}>{t('voiceSettings.behaviorNote')}</Text>
                    </View>
                </View>

                {/* Actions (Preview, Reset) */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.previewButton, (isPreviewDisabled) && styles.buttonDisabled]} onPress={handlePreview} disabled={isPreviewDisabled} /* ... */ >
                        <FontAwesomeIcon icon={faPlayCircle} size={(fonts.body || 16) * 1.1} color={theme.white || '#fff'} style={styles.buttonIcon} />
                        <Text style={[styles.previewButtonText, { color: theme.white || '#fff' }]}>{isSpeaking ? t('voiceSettings.stopPreview') : t('voiceSettings.preview')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]} onPress={handleReset} disabled={isResetDisabled} /* ... */ >
                        <FontAwesomeIcon icon={faUndo} size={(fonts.body || 16) * 1.1} color={!isResetDisabled ? (theme.textSecondary || '#555') : (theme.disabled || '#ccc')} style={styles.buttonIcon} />
                        <Text style={[styles.resetButtonText, !isResetDisabled ? styles.textEnabledUnderline : styles.textDisabled, { color: !isResetDisabled ? (theme.textSecondary || '#555') : (theme.disabled || '#ccc') } ]}>{t('common.resetChanges')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles --- (Copied from previous version, ensure fallbacks are present)
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
  const h2FontSize = fonts.h2 || 20;
  const bodyFontSize = fonts.body || 16;
  const labelFontSize = fonts.label || 14; // Consistent label size

  const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
  const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
  // const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage); // For section titles

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.primary || '#007aff' },
    screenContainer: { flex: 1, backgroundColor: theme.background || '#f0f0f0' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background || '#f0f0f0', },
    loadingText: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', marginTop: 15, textAlign: 'center', },
    header: { backgroundColor: theme.primary || '#007aff', paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 12, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', },
    titleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 5, },
    title: { ...h2Styles, fontSize: h2FontSize, fontWeight: '600', textAlign: 'center', },
    headerButton: { padding: 10, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', },
    scrollView: { flex: 1, },
    scrollContainer: { padding: 18, paddingBottom: 40, },
    sectionCard: { backgroundColor: theme.card || '#fff', borderRadius: 12, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border || '#ddd', overflow: 'hidden', padding: 18, },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border || '#eee', },
    cardIcon: { marginRight: 12, width: bodyFontSize * 1.1, textAlign: 'center', },
    sectionTitle: { fontSize: labelFontSize + 2, fontWeight: '600', flex: 1, color: theme.text || '#000'},
    cardContent: { paddingVertical: 10, },
    loadingIndicator: { marginVertical: 20, },
    errorText: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '400', textAlign: 'center', marginVertical: 15, paddingHorizontal: 10, },
    pickerContainer: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border || '#ccc', borderRadius: 10, marginBottom: 10, backgroundColor: theme.background || '#f0f0f0', overflow: 'hidden', },
    picker: { height: Platform.OS === 'ios' ? 180 : 50, width: '100%', color: theme.text || '#000', }, // Ensure width is 100% for Android
    pickerItem: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '400', /* color for iOS item can be set here */ },
    settingSection: { marginBottom: 20, },
    settingLabel: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', marginBottom: 8, },
    sliderControlRow: { flexDirection: 'row', alignItems: 'center', },
    lockButton: { paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, justifyContent: 'center', alignItems: 'center', },
    slider: { flex: 1, height: 40, },
    valueText: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '600', minWidth: 45, textAlign: 'right', marginLeft: 12, },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border || '#eee', marginTop: 5, },
    switchIcon: { marginRight: 15, width: bodyFontSize * 1.1, textAlign: 'center', },
    switchLabel: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', flex: 1, marginRight: 10, },
    infoText: { ...bodyStyles, fontSize: bodyFontSize * 0.9, fontWeight: '400', marginTop: 15, textAlign: 'center', paddingHorizontal: 5, fontStyle: 'italic', opacity: 0.8 },
    infoTextSmall: { ...bodyStyles, fontSize: bodyFontSize * 0.85, fontWeight: '400', marginTop: 4, textAlign: 'center', opacity: 0.8 },
    actionsContainer: { marginTop: 20, alignItems: 'center', },
    previewButton: { flexDirection: 'row', backgroundColor: theme.primary || '#007aff', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20, minWidth: 200, },
    previewButtonText: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '600', textAlign: 'center', },
    buttonIcon: { marginRight: 10, },
    resetButton: { flexDirection: 'row', alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, },
    resetButtonText: { ...bodyStyles, fontSize: bodyFontSize, fontWeight: '500', },
    textEnabledUnderline: { textDecorationLine: 'underline', },
    buttonDisabled: { opacity: 0.5, },
    textDisabled: { textDecorationLine: 'none', color: theme.disabled || '#ccc' },
  });
};

export default SymbolVoiceOverScreen;