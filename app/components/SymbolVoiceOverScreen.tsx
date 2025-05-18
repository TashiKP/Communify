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
    faClosedCaptioning, faHighlighter,
    faPlayCircle, faSlidersH
} from '@fortawesome/free-solid-svg-icons';
import Tts from 'react-native-tts';
import { useTranslation } from 'react-i18next';
import { useAppearance, ThemeColors, FontSizes } from '../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../styles/typography';

export interface VoiceSettingData {
    pitch: number; speed: number; volume: number; pitchLocked: boolean; speedLocked: boolean;
    volumeLocked: boolean; selectedVoiceId: string | null; highlightWord: boolean; speakPunctuation: boolean;
}
interface TtsVoice { id: string; name: string; language: string; quality?: number; latency?: number; networkConnectionRequired?: boolean; notInstalled?: boolean; }
interface SymbolVoiceOverScreenProps { initialSettings: VoiceSettingData; onSave: (settings: VoiceSettingData) => Promise<void> | void; onClose: () => void; }

const defaultSettings: VoiceSettingData = { pitch: 0.5, speed: 0.5, volume: 0.8, pitchLocked: false, speedLocked: false, volumeLocked: false, selectedVoiceId: null, highlightWord: true, speakPunctuation: false };
const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
const errorColor = '#dc3545';

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
        thumbTintColor: Platform.OS === 'android' ? theme.primary : undefined
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

    const formatValue = (value: number) => `${Math.round(value * 100)}%`;

    const isLoading = isLoadingAppearance || isLoadingVoices;
    const isSaveDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isResetDisabled = !hasUnsavedChanges || isSaving || isLoading;
    const isPreviewDisabled = isSaving || isLoading || !localSettings.selectedVoiceId;

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
                        <FontAwesomeIcon icon={faSave} size={fonts.h2 * 0.7} color={isSaveDisabled ? theme.disabled : theme.white} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <FontAwesomeIcon icon={faCommentDots} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.voiceSectionTitle')}</Text>
                    </View>
                    {isLoadingVoices ? (
                        <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
                    ) : availableVoices.length > 0 ? (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={localSettings.selectedVoiceId}
                                onValueChange={(itemValue) => {
                                    if (itemValue) handleSettingChange('selectedVoiceId', itemValue as string);
                                }}
                                style={styles.picker}
                                itemStyle={[styles.pickerItem, { color: theme.text }]}
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
                    <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>{t('voiceSettings.voiceNote')}</Text>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <FontAwesomeIcon icon={faSlidersH} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.parametersSectionTitle')}</Text>
                    </View>
                    <View style={styles.settingItem}>
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
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={localSettings.pitch}
                                onValueChange={(v) => handleSettingChange('pitch', v)}
                                disabled={localSettings.pitchLocked || isSaving}
                                {...sliderStyles}
                                accessibilityLabel={t('voiceSettings.pitchSliderAccessibilityLabel')}
                                accessibilityValue={{ text: formatValue(localSettings.pitch) }}
                                accessibilityState={{ disabled: localSettings.pitchLocked || isSaving }}
                            />
                            <Text
                                style={[styles.valueText, { color: theme.primary }]}
                                accessibilityLabel={t('voiceSettings.pitchValueAccessibilityLabel', { value: formatValue(localSettings.pitch) })}
                            >
                                {formatValue(localSettings.pitch)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.settingItem}>
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
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={localSettings.speed}
                                onValueChange={(v) => handleSettingChange('speed', v)}
                                disabled={localSettings.speedLocked || isSaving}
                                {...sliderStyles}
                                accessibilityLabel={t('voiceSettings.speedSliderAccessibilityLabel')}
                                accessibilityValue={{ text: formatValue(localSettings.speed) }}
                                accessibilityState={{ disabled: localSettings.speedLocked || isSaving }}
                            />
                            <Text
                                style={[styles.valueText, { color: theme.primary }]}
                                accessibilityLabel={t('voiceSettings.speedValueAccessibilityLabel', { value: formatValue(localSettings.speed) })}
                            >
                                {formatValue(localSettings.speed)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.settingItem}>
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
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={localSettings.volume}
                                onValueChange={(v) => handleSettingChange('volume', v)}
                                disabled={localSettings.volumeLocked || isSaving}
                                {...sliderStyles}
                                accessibilityLabel={t('voiceSettings.volumeSliderAccessibilityLabel')}
                                accessibilityValue={{ text: formatValue(localSettings.volume) }}
                                accessibilityState={{ disabled: localSettings.volumeLocked || isSaving }}
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

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <FontAwesomeIcon icon={faClosedCaptioning} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.behaviorSectionTitle')}</Text>
                    </View>
                    <View style={styles.switchRow}>
                        <View style={styles.switchLabelContainer}>
                            <FontAwesomeIcon icon={faHighlighter} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.switchIcon} />
                            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('voiceSettings.highlightLabel')}</Text>
                        </View>
                        <Switch
                            value={localSettings.highlightWord}
                            onValueChange={(v) => handleSettingChange('highlightWord', v)}
                            {...switchStyles}
                            disabled={isSaving}
                            accessibilityLabel={t('voiceSettings.highlightAccessibilityLabel')}
                            accessibilityState={{ checked: localSettings.highlightWord, disabled: isSaving }}
                        />
                    </View>
                    <View style={styles.switchRow}>
                        <View style={styles.switchLabelContainer}>
                            <FontAwesomeIcon icon={faClosedCaptioning} size={fonts.body * 1.1} color={theme.textSecondary} style={styles.switchIcon} />
                            <Text style={[styles.switchLabel, { color: theme.text }]}>{t('voiceSettings.punctuationLabel')}</Text>
                        </View>
                        <Switch
                            value={localSettings.speakPunctuation}
                            onValueChange={(v) => handleSettingChange('speakPunctuation', v)}
                            {...switchStyles}
                            disabled={isSaving}
                            accessibilityLabel={t('voiceSettings.punctuationAccessibilityLabel')}
                            accessibilityState={{ checked: localSettings.speakPunctuation, disabled: isSaving }}
                        />
                    </View>
                    <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>{t('voiceSettings.behaviorNote')}</Text>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <FontAwesomeIcon icon={faPlayCircle} size={fonts.body * 1.1} color={theme.primary} style={styles.sectionIcon} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.previewSectionTitle')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.previewButton, isPreviewDisabled && styles.buttonDisabled]}
                        onPress={handlePreview}
                        disabled={isPreviewDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={isSpeaking ? t('voiceSettings.stopPreview') : t('voiceSettings.preview')}
                        accessibilityState={{ disabled: isPreviewDisabled }}
                    >
                        <FontAwesomeIcon
                            icon={faPlayCircle}
                            size={fonts.body * 1.1}
                            color={isPreviewDisabled ? theme.textSecondary : theme.white}
                            style={styles.buttonIcon}
                        />
                        <Text
                            style={[
                                styles.previewButtonText,
                                { color: isPreviewDisabled ? theme.textSecondary :

 theme.white }
                            ]}
                        >
                            {isSpeaking ? t('voiceSettings.stopPreview') : t('voiceSettings.preview')}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>{t('voiceSettings.previewNote')}</Text>
                </View>

                <View style={styles.actionsContainer}>
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
                            color={isResetDisabled ? theme.disabled : theme.textSecondary}
                            style={styles.buttonIcon}
                        />
                        <Text
                            style={[
                                styles.resetButtonText,
                                { color: isResetDisabled ? theme.disabled : theme.textSecondary },
                                isResetDisabled && styles.textDisabled
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

const createThemedStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) => {
    const h2FontSize = fonts.h2 || 20;
    const bodyFontSize = fonts.body || 16;
    const labelFontSize = fonts.label || 14;

    const h2Styles = getLanguageSpecificTextStyle('h2', fonts, currentLanguage);
    const bodyStyles = getLanguageSpecificTextStyle('body', fonts, currentLanguage);
    const labelStyles = getLanguageSpecificTextStyle('label', fonts, currentLanguage);

    return StyleSheet.create({
        screenContainer: {
            flex: 1,
            backgroundColor: theme.primary,
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
            fontSize: h2FontSize,
            fontWeight: '700',
            textAlign: 'center',
            color: theme.white,
        },
        headerButton: {
            padding: 10,
            minWidth: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContentContainer: {
            flexGrow: 1,
            backgroundColor: theme.background,
            padding: 18,
            paddingBottom: 40,
        },
        sectionCard: {
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 18,
            marginBottom: 20,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            shadowColor: theme.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.2 : 0.08,
            shadowRadius: 2,
            elevation: 1,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        sectionIcon: {
            marginRight: 12,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        sectionTitle: {
            ...labelStyles,
            fontSize: labelFontSize,
            fontWeight: '700',
            flex: 1,
            color: theme.text,
        },
        settingItem: {
            marginBottom: 15,
        },
        settingLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '700',
            color: theme.text,
        },
        sliderControlRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 5,
        },
        lockButton: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginRight: 10,
        },
        slider: {
            flex: 1,
            height: 40,
        },
        valueText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            minWidth: 80,
            textAlign: 'center',
            marginLeft: 14,
            color: theme.primary,
        },
        switchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
            marginTop: 15,
        },
        switchLabelContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginRight: 10,
        },
        switchIcon: {
            marginRight: 15,
            width: bodyFontSize * 1.1,
            textAlign: 'center',
        },
        switchLabel: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '700',
            color: theme.text,
        },
        pickerContainer: {
            borderWidth: 1.5,
            borderColor: theme.border,
            borderRadius: 10,
            backgroundColor: theme.card,
            marginTop: 10,
            marginBottom: 5,
            overflow: 'hidden',
        },
        picker: {
            height: Platform.OS === 'ios' ? 200 : 50,
            color: theme.text,
        },
        pickerItem: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            color: theme.text,
        },
        errorText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            textAlign: 'center',
            marginVertical: 15,
            paddingHorizontal: 10,
            color: errorColor,
        },
        infoTextSmall: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 5,
            color: theme.textSecondary,
        },
        actionsContainer: {
            marginTop: 25,
            alignItems: 'center',
        },
        previewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.primary,
            backgroundColor: theme.primary,
            minWidth: 150,
            minHeight: 44,
            marginTop: 10,
        },
        previewButtonText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '600',
            textAlign: 'center',
        },
        resetButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        resetButtonText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            textDecorationLine: 'underline',
            color: theme.textSecondary,
        },
        buttonIcon: {
            marginRight: 6,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        textDisabled: {
            textDecorationLine: 'none',
        },
        loadingText: {
            ...bodyStyles,
            fontSize: bodyFontSize,
            fontWeight: '500',
            marginTop: 15,
            textAlign: 'center',
            color: theme.text,
        },
    });
};

export default SymbolVoiceOverScreen;