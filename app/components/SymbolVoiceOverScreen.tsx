import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Switch, Keyboard
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
    faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';

// --- Import Context ---
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';

// --- Import Typography Utility ---
import { getLanguageSpecificTextStyle } from '../styles/typography';

// --- Types ---
export interface VoiceSettingData {
    pitch: number; speed: number; volume: number; pitchLocked: boolean; speedLocked: boolean;
    volumeLocked: boolean; selectedVoiceId: string | null; highlightWord: boolean; speakPunctuation: boolean;
}
interface TtsVoice { id: string; name: string; language: string; quality?: number; latency?: number; networkConnectionRequired?: boolean; notInstalled?: boolean; }
interface SymbolVoiceOverScreenProps { initialSettings: VoiceSettingData; onSave: (settings: VoiceSettingData) => Promise<void> | void; onClose: () => void; }

// --- Default Values ---
const defaultSettings: VoiceSettingData = { pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false, volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false };

// --- Shared Constants ---
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545';

// --- Component ---
const SymbolVoiceOverScreen: React.FC<SymbolVoiceOverScreenProps> = ({
    initialSettings: initialPropsSettings,
    onSave,
    onClose,
}) => {
    // --- Hooks ---
    const { theme, fonts, isLoadingAppearance } = useAppearance();
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;

    // --- State ---
    const [localSettings, setLocalSettings] = useState<VoiceSettingData>(() => ({ ...defaultSettings, ...initialPropsSettings }));
    const [originalSettings, setOriginalSettings] = useState<VoiceSettingData>(() => ({ ...defaultSettings, ...initialPropsSettings }));
    const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isMountedRef = useRef(true);

    // --- Dynamic Styles ---
    const styles = useMemo(() => createThemedStyles(theme, fonts, currentLanguage), [theme, fonts, currentLanguage]);
    const switchStyles = useMemo(() => ({
        trackColor: { false: theme.disabled, true: theme.secondary },
        thumbColor: Platform.OS === 'android' ? theme.primary : undefined,
        ios_backgroundColor: theme.disabled,
    }), [theme]);
    const sliderStyles = useMemo(() => ({
        minimumTrackTintColor: theme.primary,
        maximumTrackTintColor: theme.border,
        thumbTintColor: Platform.OS === 'android' ? theme.primary : undefined
    }), [theme]);

    // --- Memoize ---
    const hasUnsavedChanges = useMemo(() => JSON.stringify(localSettings) !== JSON.stringify(originalSettings), [localSettings, originalSettings]);

    // --- Effects ---
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

    // --- Handlers ---
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

    const formatValue = (value: number) => `${Math.round(value * 100)}%`;

    // --- Determine Button States ---
    const isLoading = isLoadingAppearance || isLoadingVoices;
    const isSaveDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isResetDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isPreviewDisabled = isSaving || isLoading || !localSettings.selectedVoiceId;

    // --- Render ---
    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.screenContainer, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{t('voiceSettings.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleAttemptClose}
                    hitSlop={hitSlop}
                    accessibilityLabel={t('common.goBack')}
                    accessibilityRole="button"
                >
                    <FontAwesomeIcon icon={faArrowLeft} size={fonts.h2 * 0.7} color={theme.white} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.white }]} numberOfLines={1}>{t('voiceSettings.title')}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.headerButton, isSaveDisabled && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isSaveDisabled}
                    hitSlop={hitSlop}
                    accessibilityLabel={t('common.save')}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSaveDisabled }}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.white} />
                    ) : (
                        <FontAwesomeIcon icon={faSave} size={fonts.h2 * 0.7} color={!isSaveDisabled ? theme.white : theme.disabled} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Scrollable Content Area */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                {/* Voice Selection */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faCommentDots} size={fonts.body * 1.1} color={theme.primary} style={styles.cardIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.voiceSectionTitle')}</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {isLoadingVoices ? (
                            <ActivityIndicator style={styles.loadingIndicator} size="small" color={theme.primary} />
                        ) : availableVoices.length > 0 ? (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={localSettings.selectedVoiceId}
                                    onValueChange={(itemValue) => {
                                        if (itemValue) handleSettingChange('selectedVoiceId', itemValue as string);
                                    }}
                                    style={styles.picker}
                                    itemStyle={styles.pickerItem}
                                    mode="dropdown"
                                    accessibilityLabel={t('voiceSettings.voiceSelectAccessibilityLabel')}
                                    dropdownIconColor={theme.textSecondary}
                                    prompt={t('voiceSettings.voiceSelectPrompt')}
                                >
                                    {availableVoices.map((voice) => (
                                        <Picker.Item
                                            key={voice.id}
                                            label={`${voice.name} (${voice.language})`}
                                            value={voice.id}
                                            color={theme.text}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        ) : (
                            <Text style={[styles.errorText, { color: errorColor }]}>{t('voiceSettings.errors.noVoices')}</Text>
                        )}
                    </View>
                </View>

                {/* Speech Parameters */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faSlidersH} size={fonts.body * 1.1} color={theme.primary} style={styles.cardIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.parametersSectionTitle')}</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {/* Pitch */}
                        <View style={styles.settingSection}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('voiceSettings.pitchLabel')}</Text>
                            <View style={styles.sliderControlRow}>
                                <TouchableOpacity
                                    style={styles.lockButton}
                                    onPress={() => handleSettingChange('pitchLocked', !localSettings.pitchLocked)}
                                    hitSlop={hitSlop}
                                    accessibilityLabel={localSettings.pitchLocked ? t('voiceSettings.unlockPitch') : t('voiceSettings.lockPitch')}
                                    accessibilityRole="button"
                                    disabled={isSaving}
                                >
                                    <FontAwesomeIcon
                                        icon={localSettings.pitchLocked ? faLock : faLockOpen}
                                        size={fonts.body * 1.1}
                                        color={localSettings.pitchLocked ? theme.primary : theme.textSecondary}
                                    />
                                </TouchableOpacity>
                                <Slider
                                    accessibilityLabel={t('voiceSettings.pitchSliderAccessibilityLabel')}
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={localSettings.pitch}
                                    onValueChange={(v) => handleSettingChange('pitch', v)}
                                    disabled={localSettings.pitchLocked || isSaving}
                                    {...sliderStyles}
                                    accessibilityValue={{ text: formatValue(localSettings.pitch) }}
                                />
                                <Text
                                    style={[styles.valueText, { color: theme.primary }]}
                                    accessibilityLabel={t('voiceSettings.pitchValueAccessibilityLabel', { value: formatValue(localSettings.pitch) })}
                                >
                                    {formatValue(localSettings.pitch)}
                                </Text>
                            </View>
                        </View>
                        {/* Speed */}
                        <View style={styles.settingSection}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('voiceSettings.speedLabel')}</Text>
                            <View style={styles.sliderControlRow}>
                                <TouchableOpacity
                                    style={styles.lockButton}
                                    onPress={() => handleSettingChange('speedLocked', !localSettings.speedLocked)}
                                    hitSlop={hitSlop}
                                    accessibilityLabel={localSettings.speedLocked ? t('voiceSettings.unlockSpeed') : t('voiceSettings.lockSpeed')}
                                    accessibilityRole="button"
                                    disabled={isSaving}
                                >
                                    <FontAwesomeIcon
                                        icon={localSettings.speedLocked ? faLock : faLockOpen}
                                        size={fonts.body * 1.1}
                                        color={localSettings.speedLocked ? theme.primary : theme.textSecondary}
                                    />
                                </TouchableOpacity>
                                <Slider
                                    accessibilityLabel={t('voiceSettings.speedSliderAccessibilityLabel')}
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={localSettings.speed}
                                    onValueChange={(v) => handleSettingChange('speed', v)}
                                    disabled={localSettings.speedLocked || isSaving}
                                    {...sliderStyles}
                                    accessibilityValue={{ text: formatValue(localSettings.speed) }}
                                />
                                <Text
                                    style={[styles.valueText, { color: theme.primary }]}
                                    accessibilityLabel={t('voiceSettings.speedValueAccessibilityLabel', { value: formatValue(localSettings.speed) })}
                                >
                                    {formatValue(localSettings.speed)}
                                </Text>
                            </View>
                        </View>
                        {/* Volume */}
                        <View style={styles.settingSection}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('voiceSettings.volumeLabel')}</Text>
                            <View style={styles.sliderControlRow}>
                                <TouchableOpacity
                                    style={styles.lockButton}
                                    onPress={() => handleSettingChange('volumeLocked', !localSettings.volumeLocked)}
                                    hitSlop={hitSlop}
                                    accessibilityLabel={localSettings.volumeLocked ? t('voiceSettings.unlockVolume') : t('voiceSettings.lockVolume')}
                                    accessibilityRole="button"
                                    disabled={isSaving}
                                >
                                    <FontAwesomeIcon
                                        icon={localSettings.volumeLocked ? faLock : faLockOpen}
                                        size={fonts.body * 1.1}
                                        color={localSettings.volumeLocked ? theme.primary : theme.textSecondary}
                                    />
                                </TouchableOpacity>
                                <Slider
                                    accessibilityLabel={t('voiceSettings.volumeSliderAccessibilityLabel')}
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={1}
                                    value={localSettings.volume}
                                    onValueChange={(v) => handleSettingChange('volume', v)}
                                    disabled={localSettings.volumeLocked || isSaving}
                                    {...sliderStyles}
                                    accessibilityValue={{ text: formatValue(localSettings.volume) }}
                                />
                                <Text
                                    style={[styles.valueText, { color: theme.primary }]}
                                    accessibilityLabel={t('voiceSettings.volumeValueAccessibilityLabel', { value: formatValue(localSettings.volume) })}
                                >
                                    {formatValue(localSettings.volume)}
                                </Text>
                            </View>
                            <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>{t('voiceSettings.volumeNote')}</Text>
                        </View>
                    </View>
                </View>

                {/* Speech Behavior */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faClosedCaptioning} size={fonts.body * 1.1} color={theme.primary} style={styles.cardIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.behaviorSectionTitle')}</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {/* Highlight Word */}
                        <View style={styles.switchRow}>
                            <FontAwesomeIcon icon={faHighlighter} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.switchIcon} />
                            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('voiceSettings.highlightLabel')}</Text>
                            <Switch
                                value={localSettings.highlightWord}
                                onValueChange={(v) => handleSettingChange('highlightWord', v)}
                                {...switchStyles}
                                disabled={isSaving}
                                accessibilityLabel={t('voiceSettings.highlightAccessibilityLabel')}
                                accessibilityState={{ checked: localSettings.highlightWord }}
                            />
                        </View>
                        {/* Speak Punctuation */}
                        <View style={styles.switchRow}>
                            <FontAwesomeIcon icon={faClosedCaptioning} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.switchIcon} />
                            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('voiceSettings.punctuationLabel')}</Text>
                            <Switch
                                value={localSettings.speakPunctuation}
                                onValueChange={(v) => handleSettingChange('speakPunctuation', v)}
                                {...switchStyles}
                                disabled={isSaving}
                                accessibilityLabel={t('voiceSettings.punctuationAccessibilityLabel')}
                                accessibilityState={{ checked: localSettings.speakPunctuation }}
                            />
                        </View>
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{t('voiceSettings.behaviorNote')}</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.previewButton, (isPreviewDisabled || isSpeaking) && styles.buttonDisabled]}
                        onPress={handlePreview}
                        disabled={isPreviewDisabled || isSpeaking}
                        accessibilityRole="button"
                        accessibilityLabel={isSpeaking ? t('voiceSettings.stopPreview') : t('voiceSettings.preview')}
                    >
                        <FontAwesomeIcon icon={faPlayCircle} size={fonts.body * 1.1} color={theme.white} style={styles.buttonIcon} />
                        <Text style={[styles.previewButtonText, { color: theme.white }]}>
                            {isSpeaking ? t('voiceSettings.stopPreview') : t('voiceSettings.preview')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resetButton, isResetDisabled && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={isResetDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.resetChanges')}
                        accessibilityState={{ disabled: isResetDisabled }}
                    >
                        <FontAwesomeIcon
                            icon={faUndo}
                            size={fonts.body * 1.1}
                            color={!isResetDisabled ? theme.textSecondary : theme.disabled}
                            style={styles.buttonIcon}
                        />
                        <Text
                            style={[
                                styles.resetButtonText,
                                !isResetDisabled ? styles.textEnabledUnderline : styles.textDisabled,
                                { color: !isResetDisabled ? theme.textSecondary : theme.disabled }
                            ]}
                        >
                            {t('common.resetChanges')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Styles ---
const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);

    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        screenContainer: {
            flex: 1,
            backgroundColor: theme.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
        },
        loadingText: {
            ...bodyStyles,
            fontWeight: '500',
            marginTop: 15,
            textAlign: 'center',
        },
        header: {
            backgroundColor: theme.primary,
            paddingTop: Platform.OS === 'android' ? 10 : 0,
            paddingBottom: 12,
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        titleContainer: {
            flex: 1,
            alignItems: 'center',
            marginHorizontal: 5,
        },
        title: {
            ...h2Styles,
            fontWeight: '600',
            textAlign: 'center',
        },
        headerButton: {
            padding: 10,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollView: {
            flex: 1,
        },
        scrollContainer: {
            padding: 18,
            paddingBottom: 40,
        },
        sectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            overflow: 'hidden',
            padding: 18,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        cardIcon: {
            marginRight: 12,
            width: fonts.body * 1.1,
            textAlign: 'center',
        },
        sectionTitle: {
            ...h2Styles,
            fontWeight: '600',
            flex: 1,
        },
        cardContent: {
            paddingVertical: 10,
        },
        loadingIndicator: {
            marginVertical: 20,
        },
        errorText: {
            ...bodyStyles,
            fontWeight: '400',
            textAlign: 'center',
            marginVertical: 15,
            paddingHorizontal: 10,
        },
        pickerContainer: {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            borderRadius: 10,
            marginBottom: 10,
            backgroundColor: theme.background,
            overflow: 'hidden',
        },
        picker: {
            height: Platform.OS === 'ios' ? 200 : 50,
            color: theme.text,
        },
        pickerItem: {
            ...bodyStyles,
            fontWeight: '400',
        },
        settingSection: {
            marginBottom: 20,
        },
        settingLabel: {
            ...bodyStyles,
            fontWeight: '500',
            marginBottom: 8,
        },
        sliderControlRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        lockButton: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginRight: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        slider: {
            flex: 1,
            height: 40,
        },
        valueText: {
            ...bodyStyles,
            fontWeight: '600',
            minWidth: 45,
            textAlign: 'right',
            marginLeft: 12,
        },
        switchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
            marginTop: 5,
        },
        switchIcon: {
            marginRight: 15,
            width: fonts.body * 1.1,
            textAlign: 'center',
        },
        switchLabel: {
            ...bodyStyles,
            fontWeight: '500',
            flex: 1,
            marginRight: 10,
        },
        infoText: {
            ...bodyStyles,
            fontWeight: '400',
            marginTop: 15,
            textAlign: 'center',
            paddingHorizontal: 5,
            fontStyle: 'italic',
        },
        infoTextSmall: {
            ...bodyStyles,
            fontWeight: '400',
            marginTop: 4,
            textAlign: 'center',
        },
        actionsContainer: {
            marginTop: 20,
            alignItems: 'center',
        },
        previewButton: {
            flexDirection: 'row',
            backgroundColor: theme.primary,
            paddingVertical: 14,
            paddingHorizontal: 30,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            minWidth: 200,
        },
        previewButtonText: {
            ...bodyStyles,
            fontWeight: '600',
            textAlign: 'center',
        },
        buttonIcon: {
            marginRight: 10,
        },
        resetButton: {
            flexDirection: 'row',
            alignSelf: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        resetButtonText: {
            ...bodyStyles,
            fontWeight: '500',
        },
        textEnabledUnderline: {
            textDecorationLine: 'underline',
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        textDisabled: {
            textDecorationLine: 'none',
        }
    });
};

export default SymbolVoiceOverScreen;