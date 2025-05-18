import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SafeAreaView, View, ActivityIndicator, Platform, Alert, Keyboard, Text, ScrollView } from 'react-native';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '../context/AppearanceContext';
import { SymbolVoiceOverScreenProps, TtsVoice, VoiceSettingData } from './SymbolVoiceOver/types';
import { createThemedStyles } from './SymbolVoiceOver/styles';
import VoiceSelection from './SymbolVoiceOver/VoiceSelection';
import Parameters from './SymbolVoiceOver/Parameters';
import Behavior from './SymbolVoiceOver/Behavior';
import Preview from './SymbolVoiceOver/Preview';
import Actions from './SymbolVoiceOver/Actions';
import Header from './SymbolVoiceOver/Header';



const defaultSettings: VoiceSettingData = {
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

const SymbolVoiceOverScreen: React.FC<SymbolVoiceOverScreenProps> = ({
    initialSettings: initialPropsSettings,
    onSave,
    onClose,
}) => {
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const [localSettings, setLocalSettings] = useState<VoiceSettingData>(() => ({ ...defaultSettings, ...initialPropsSettings }));
    const [originalSettings, setOriginalSettings] = useState<VoiceSettingData>(() => ({ ...defaultSettings, ...initialPropsSettings }));
    const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isMountedRef = useRef(true);

    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);
    const sliderStyles = useMemo(() => ({
        minimumTrackTintColor: theme.primary,
        maximumTrackTintColor: theme.border,
        thumbTintColor: Platform.OS === 'android' ? theme.primary : undefined,
    }), [theme]);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(localSettings) !== JSON.stringify(originalSettings), [localSettings, originalSettings]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        const merged = { ...defaultSettings, ...initialPropsSettings };
        setLocalSettings(merged);
        setOriginalSettings(merged);
        setIsSaving(false);
    }, [initialPropsSettings]);

    useEffect(() => {
        let isMounted = true;
        let startListener: any = null, finishListener: any = null, cancelListener: any = null;
        const initTts = async () => {
            setIsLoadingVoices(true);
            try {
                await Tts.getInitStatus();
                startListener = Tts.addEventListener('tts-start', () => { if (isMountedRef.current) setIsSpeaking(true); });
                finishListener = Tts.addEventListener('tts-finish', () => { if (isMountedRef.current) setIsSpeaking(false); });
                cancelListener = Tts.addEventListener('tts-cancel', () => { if (isMountedRef.current) setIsSpeaking(false); });

                const voicesResult = await Tts.voices();
                const usableVoices = voicesResult
                    .filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled))
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (isMountedRef.current) {
                    setAvailableVoices(usableVoices as TtsVoice[]);
                    const currentVoiceId = localSettings.selectedVoiceId;
                    let voiceToSet: string | null = null;
                    if (currentVoiceId && usableVoices.some(v => v.id === currentVoiceId)) {
                        voiceToSet = currentVoiceId;
                    } else if (usableVoices.length > 0) {
                        const defaultUsEnglish = usableVoices.find(v => v.language.startsWith('en-US'));
                        voiceToSet = defaultUsEnglish ? defaultUsEnglish.id : usableVoices[0].id;
                    }
                    if (voiceToSet !== localSettings.selectedVoiceId) {
                        setLocalSettings(prev => ({ ...prev, selectedVoiceId: voiceToSet }));
                    }
                }
            } catch (error: any) {
                console.error("Failed TTS init/load:", error);
                if (error.message?.indexOf('TTS engine is not ready') === -1 && isMountedRef.current) {
                    Alert.alert(t('voiceSettings.errors.ttsInitTitle'), t('voiceSettings.errors.ttsInitMessage', { message: error.message }));
                }
            } finally {
                if (isMountedRef.current) setIsLoadingVoices(false);
            }
        };
        initTts();
        return () => {
            isMounted = false;
            Tts.stop();
            startListener?.remove();
            finishListener?.remove();
            cancelListener?.remove();
        };
    }, [t, localSettings.selectedVoiceId]);

    const handleSettingChange = useCallback(<K extends keyof VoiceSettingData>(key: K, value: VoiceSettingData[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const handlePreview = async () => {
        if (isSpeaking) {
            Tts.stop();
            return;
        }
        if (isLoadingVoices || availableVoices.length === 0) {
            Alert.alert(t('voiceSettings.errors.previewTitle'), isLoadingVoices ? t('voiceSettings.errors.voicesLoading') : t('voiceSettings.errors.noVoices'));
            return;
        }
        let voiceIdToUse = localSettings.selectedVoiceId;
        let selectedVoiceName = "default";

        if (!voiceIdToUse && availableVoices.length > 0) {
            voiceIdToUse = availableVoices[0].id;
            selectedVoiceName = availableVoices[0].name;
            handleSettingChange('selectedVoiceId', voiceIdToUse);
            Alert.alert(t('voiceSettings.voiceSelectedTitle'), t('voiceSettings.voiceSelectedMessage', { name: selectedVoiceName }), [{ text: t('common.ok') }]);
        } else if (!voiceIdToUse) {
            Alert.alert(t('voiceSettings.errors.previewTitle'), t('voiceSettings.errors.noVoiceSelected'));
            return;
        }

        const sampleText = t('voiceSettings.previewSampleText');
        try {
            setIsSpeaking(true);
            await Tts.setDefaultVoice(voiceIdToUse);
            await Tts.setDefaultPitch(localSettings.pitch * 1.5 + 0.5);
            await Tts.setDefaultRate(localSettings.speed * 0.9 + 0.05);
            Tts.speak(sampleText);
        } catch (error: any) {
            console.error("TTS Preview error:", error);
            Alert.alert(t('voiceSettings.errors.previewTitle'), t('voiceSettings.errors.previewFail'));
            if (isMountedRef.current) setIsSpeaking(false);
        }
    };

    const handleReset = () => {
        if (!hasUnsavedChanges || isSaving) return;
        Alert.alert(
            t('voiceSettings.resetConfirmTitle'),
            t('voiceSettings.resetConfirmMessage'),
            [
                { text: t('common.cancel'), style: "cancel" },
                { text: t('common.reset'), style: "destructive", onPress: () => setLocalSettings(originalSettings) }
            ]
        );
    };

    const handleSave = async () => {
        if (!hasUnsavedChanges || isSaving) return;
        setIsSaving(true);
        Keyboard.dismiss();
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings);
            onClose();
        } catch (error) {
            console.error("Error saving voice settings:", error);
            Alert.alert(t('common.error'), t('voiceSettings.errors.saveFail'));
            if (isMountedRef.current) setIsSaving(false);
        }
    };

    const handleAttemptClose = useCallback(() => {
        if (isSpeaking) Tts.stop();
        if (hasUnsavedChanges) {
            Alert.alert(
                t('voiceSettings.unsavedChangesTitle'),
                t('voiceSettings.unsavedChangesMessage'),
                [
                    { text: t('common.cancel'), style: "cancel" },
                    { text: t('common.discard'), style: "destructive", onPress: onClose }
                ]
            );
        } else {
            onClose();
        }
    }, [hasUnsavedChanges, onClose, isSpeaking]);

    const isLoading = isLoadingAppearance || isLoadingVoices;
    if (isLoading) {
        return (
            <SafeAreaView style={styles.screenContainer}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>{t('voiceSettings.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screenContainer}>
            <Header
                onClose={handleAttemptClose}
                onSave={handleSave}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                isLoading={isLoading}
                styles={styles}
                theme={theme}
                fonts={fonts}
                t={t}
            />
            <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
                <VoiceSelection
                    availableVoices={availableVoices}
                    isLoadingVoices={isLoadingVoices}
                    selectedVoiceId={localSettings.selectedVoiceId}
                    onVoiceChange={(voiceId: string | null) => handleSettingChange('selectedVoiceId', voiceId)}
                    styles={styles}
                    theme={theme}
                    t={t}
                />
                <Parameters
                    settings={localSettings}
                    onSettingChange={handleSettingChange}
                    isSaving={isSaving}
                    sliderStyles={sliderStyles}
                    styles={styles}
                    theme={theme}
                    t={t}
                />
                <Behavior
                    settings={localSettings}
                    onSettingChange={handleSettingChange}
                    isSaving={isSaving}
                    switchStyles={switchStyles}
                    styles={styles}
                    theme={theme}
                    t={t}
                />
                <Preview
                    isSpeaking={isSpeaking}
                    isPreviewDisabled={isSaving || isLoading || !localSettings.selectedVoiceId}
                    onPreview={handlePreview}
                    styles={styles}
                    theme={theme}
                    t={t}
                />
                <Actions
                    onReset={handleReset}
                    isResetDisabled={!hasUnsavedChanges || isSaving || isLoading}
                    styles={styles}
                    theme={theme}
                    t={t}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SymbolVoiceOverScreen;