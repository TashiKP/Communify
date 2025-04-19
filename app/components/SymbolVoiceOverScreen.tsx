import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
    ActivityIndicator, Alert, Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faArrowLeft, faSave, faUndo, faMusic, faTachometerAlt, faVolumeUp,
    faLock, faLockOpen, faCommentDots, // Voice Selection Icon
    faClosedCaptioning, // Behavior Icon
    faHighlighter, // Highlight Icon
    faPlayCircle, // Preview Icon
    faSlidersH // Parameters Icon (alternative)
} from '@fortawesome/free-solid-svg-icons';
import Tts from 'react-native-tts'; // Using react-native-tts

// --- Types ---
export interface VoiceSettingData {
    pitch: number;
    speed: number;
    volume: number;
    pitchLocked: boolean;
    speedLocked: boolean;
    volumeLocked: boolean;
    selectedVoiceId: string | null;
    highlightWord: boolean;
    speakPunctuation: boolean;
}

interface TtsVoice {
    id: string;
    name: string;
    language: string;
    quality?: number;
    latency?: number;
    networkConnectionRequired?: boolean;
    notInstalled?: boolean;
}

interface SymbolVoiceOverScreenProps {
    initialSettings: VoiceSettingData;
    onSave: (settings: VoiceSettingData) => Promise<void> | void;
    onClose: () => void;
}

// --- Default Values ---
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

// --- Component ---
const SymbolVoiceOverScreen: React.FC<SymbolVoiceOverScreenProps> = ({
    initialSettings: initialPropsSettings,
    onSave,
    onClose,
}) => {
    // --- State ---
    const [localSettings, setLocalSettings] = useState<VoiceSettingData>(
        { ...defaultSettings, ...initialPropsSettings }
    );
    const [originalSettings, setOriginalSettings] = useState<VoiceSettingData>(
        { ...defaultSettings, ...initialPropsSettings }
    );
    const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // --- Memoize ---
    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
    }, [localSettings, originalSettings]);

    // --- Effects ---
    // Initialize TTS, add listeners, fetch voices
    useEffect(() => {
        let isMounted = true;
        let startListener: any = null;
        let finishListener: any = null;
        let cancelListener: any = null;

        const initTts = async () => {
             try {
                await Tts.setDefaultLanguage('en-US');
                await Tts.getInitStatus();

                startListener = Tts.addEventListener('tts-start', (event) => {
                    if (isMounted) setIsSpeaking(true); console.log("tts-start", event); });
                finishListener = Tts.addEventListener('tts-finish', (event) => {
                    if (isMounted) setIsSpeaking(false); console.log("tts-finish", event); });
                cancelListener = Tts.addEventListener('tts-cancel', (event) => {
                    if (isMounted) setIsSpeaking(false); console.log("tts-cancel", event); });

                const voicesResult = await Tts.voices();
                const usableVoices = voicesResult.filter(v => !(Platform.OS === 'android' && v.networkConnectionRequired && v.notInstalled));

                if (isMounted) {
                    setAvailableVoices(usableVoices as TtsVoice[]);
                    const currentVoiceId = localSettings.selectedVoiceId;
                    let voiceToSet: string | null = null;
                    if (currentVoiceId && usableVoices.some(v => v.id === currentVoiceId)) {
                        voiceToSet = currentVoiceId;
                    } else if (usableVoices.length > 0) {
                         voiceToSet = usableVoices[0].id;
                    }

                    if (voiceToSet !== localSettings.selectedVoiceId) {
                        setLocalSettings(prev => ({ ...prev, selectedVoiceId: voiceToSet }));
                        setOriginalSettings(prev => ({ ...prev, selectedVoiceId: voiceToSet }));
                    }
                    setIsLoadingVoices(false);
                }
            } catch (error: any) {
                 console.error("Failed TTS init/load:", error);
                if (isMounted) setIsLoadingVoices(false);
                 if (error.message !== 'TTS engine is not ready') {
                    Alert.alert("TTS Error", `Could not initialize Text-to-Speech. (${error.message})`);
                 }
            }
        };

        initTts();

        return () => { // Cleanup
            isMounted = false;
            Tts.stop();
            if(startListener?.remove) startListener.remove();
            if(finishListener?.remove) finishListener.remove();
            if(cancelListener?.remove) cancelListener.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- Handlers ---
    const handleSettingChange = <K extends keyof VoiceSettingData>(
        key: K,
        value: VoiceSettingData[K]
    ) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handlePreview = async () => {
        if (isSpeaking) { Tts.stop(); return; }
        let voiceIdToUse = localSettings.selectedVoiceId;
        if (!voiceIdToUse) {
             if (availableVoices.length > 0) {
                 voiceIdToUse = availableVoices[0].id;
                 handleSettingChange('selectedVoiceId', voiceIdToUse);
                 Alert.alert("Voice Selected", "Using the first available voice.", [{text: "OK"}]);
             } else { Alert.alert("Preview Error", "No voices available."); return; }
        }
        const sampleText = "Hello, this is a preview.";
        try {
            await Tts.setDefaultVoice(voiceIdToUse);
            await Tts.setDefaultPitch(localSettings.pitch * 1.5 + 0.5);
            await Tts.setDefaultRate(localSettings.speed * 0.9 + 0.05);
            Tts.speak(sampleText);
        } catch (error) {
             console.error("TTS Preview error:", error); setIsSpeaking(false);
             Alert.alert("Preview Error", "Could not play speech."); }
    };

    const handleReset = () => { /* ... Alert logic remains same ... */
        Alert.alert( "Reset Changes?", "Discard changes and revert?",
            [ { text: "Cancel", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: () => setLocalSettings(originalSettings) } ]
        );
    };
    const handleSave = async () => { /* ... Save logic remains same ... */
        if (!hasUnsavedChanges) return;
        setIsSaving(true);
        try {
            await onSave(localSettings);
            setOriginalSettings(localSettings);
            onClose();
        } catch (error) {
            console.error("Error saving voice settings:", error);
            Alert.alert("Error", "Could not save settings.");
            setIsSaving(false);
        }
     };
    const handleAttemptClose = useCallback(() => { /* ... Close logic remains same ... */
        if (isSpeaking) { Tts.stop(); }
        if (hasUnsavedChanges) {
            Alert.alert( "Unsaved Changes", "Discard and go back?",
                [ { text: "Cancel", style: "cancel" },
                  { text: "Discard", style: "destructive", onPress: onClose } ]
            );
        } else { onClose(); }
    }, [hasUnsavedChanges, onClose, isSpeaking]);

    const formatValue = (value: number) => `${Math.round(value * 100)}%`;

    // --- Render ---
    return (
        <SafeAreaView style={styles.screenContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleAttemptClose} hitSlop={hitSlop}>
                <FontAwesomeIcon icon={faArrowLeft} size={20} color={whiteColor} />
              </TouchableOpacity>
               <View style={styles.titleContainer}>
                  <Text style={styles.title} numberOfLines={1}>Voice & Speech</Text>
               </View>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                hitSlop={hitSlop}
               >
                {isSaving
                    ? <ActivityIndicator size="small" color={whiteColor} />
                    : <FontAwesomeIcon icon={faSave} size={20} color={hasUnsavedChanges ? whiteColor : disabledButtonColor} />
                }
              </TouchableOpacity>
            </View>

            {/* Scrollable Content Area */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

                {/* --- Voice Selection --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                         <FontAwesomeIcon icon={faCommentDots} size={18} color={primaryColor} style={styles.cardIcon} />
                         <Text style={styles.sectionTitle}>Voice</Text>
                    </View>
                    {/* Content padded inside card */}
                    <View style={styles.cardContent}>
                        {isLoadingVoices ? (
                            <ActivityIndicator style={styles.loadingIndicator} size="small" color={primaryColor} />
                        ) : availableVoices.length > 0 ? (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={localSettings.selectedVoiceId}
                                    onValueChange={(itemValue) => {
                                        if(itemValue) handleSettingChange('selectedVoiceId', itemValue as string) // Ensure itemValue is treated as string
                                    }}
                                    style={styles.picker}
                                    itemStyle={styles.pickerItem} // iOS only
                                    mode="dropdown" // Android only
                                    accessibilityLabel="Select a voice"
                                >
                                    {availableVoices.map((voice) => (
                                        <Picker.Item
                                            key={voice.id}
                                            label={`${voice.name} (${voice.language})`}
                                            value={voice.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        ) : (
                            <Text style={styles.errorText}>No voices available on this device.</Text>
                        )}
                    </View>
                </View>

                {/* --- Speech Parameters --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faSlidersH} size={18} color={primaryColor} style={styles.cardIcon} />
                        <Text style={styles.sectionTitle}>Speech Parameters</Text>
                    </View>
                     <View style={styles.cardContent}>
                        {/* Pitch */}
                        <View style={styles.settingSection}>
                            <Text style={styles.settingLabel}>Pitch</Text>
                            <View style={styles.sliderControlRow}>
                            <TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('pitchLocked', !localSettings.pitchLocked)} hitSlop={hitSlop} accessibilityLabel={localSettings.pitchLocked ? "Unlock pitch slider" : "Lock pitch slider"}>
                                <FontAwesomeIcon icon={localSettings.pitchLocked ? faLock : faLockOpen} size={20} color={localSettings.pitchLocked ? primaryColor : darkGrey}/>
                            </TouchableOpacity>
                            <Slider accessibilityLabel="Pitch slider" style={styles.slider} minimumValue={0} maximumValue={1} value={localSettings.pitch} onValueChange={(v) => handleSettingChange('pitch', v)} disabled={localSettings.pitchLocked} {...sliderStyles} />
                            <Text style={styles.valueText} accessibilityLabel={`Current pitch ${formatValue(localSettings.pitch)}`}>{formatValue(localSettings.pitch)}</Text>
                            </View>
                        </View>
                        {/* Speed */}
                        <View style={styles.settingSection}>
                            <Text style={styles.settingLabel}>Speed</Text>
                            <View style={styles.sliderControlRow}>
                            <TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('speedLocked', !localSettings.speedLocked)} hitSlop={hitSlop} accessibilityLabel={localSettings.speedLocked ? "Unlock speed slider" : "Lock speed slider"}>
                                <FontAwesomeIcon icon={localSettings.speedLocked ? faLock : faLockOpen} size={20} color={localSettings.speedLocked ? primaryColor : darkGrey}/>
                            </TouchableOpacity>
                            <Slider accessibilityLabel="Speed slider" style={styles.slider} minimumValue={0} maximumValue={1} value={localSettings.speed} onValueChange={(v) => handleSettingChange('speed', v)} disabled={localSettings.speedLocked} {...sliderStyles} />
                            <Text style={styles.valueText} accessibilityLabel={`Current speed ${formatValue(localSettings.speed)}`}>{formatValue(localSettings.speed)}</Text>
                            </View>
                        </View>
                        {/* Volume */}
                        <View style={styles.settingSection}>
                            <Text style={styles.settingLabel}>Volume</Text>
                            <View style={styles.sliderControlRow}>
                            <TouchableOpacity style={styles.lockButton} onPress={() => handleSettingChange('volumeLocked', !localSettings.volumeLocked)} hitSlop={hitSlop} accessibilityLabel={localSettings.volumeLocked ? "Unlock volume slider" : "Lock volume slider"}>
                                <FontAwesomeIcon icon={localSettings.volumeLocked ? faLock : faLockOpen} size={20} color={localSettings.volumeLocked ? primaryColor : darkGrey}/>
                            </TouchableOpacity>
                            <Slider accessibilityLabel="Volume slider" style={styles.slider} minimumValue={0} maximumValue={1} value={localSettings.volume} onValueChange={(v) => handleSettingChange('volume', v)} disabled={localSettings.volumeLocked} {...sliderStyles} />
                            <Text style={styles.valueText} accessibilityLabel={`Current volume ${formatValue(localSettings.volume)}`}>{formatValue(localSettings.volume)}</Text>
                            </View>
                            <Text style={styles.infoTextSmall}>Note: Volume may primarily use system settings.</Text>
                        </View>
                     </View>
                </View>

                {/* --- Speech Behavior --- */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <FontAwesomeIcon icon={faClosedCaptioning} size={18} color={primaryColor} style={styles.cardIcon} />
                        <Text style={styles.sectionTitle}>Speech Behavior</Text>
                    </View>
                    <View style={styles.cardContent}>
                        {/* Highlight Word */}
                        <View style={styles.switchRow}>
                            <FontAwesomeIcon icon={faHighlighter} size={20} color={darkGrey} style={styles.switchIcon}/>
                            <Text style={styles.switchLabel}>Highlight Spoken Word</Text>
                            <Switch value={localSettings.highlightWord} onValueChange={(v) => handleSettingChange('highlightWord', v)} {...switchStyles} accessibilityLabel="Highlight spoken word switch"/>
                        </View>
                        {/* Speak Punctuation */}
                        <View style={styles.switchRow}>
                            <FontAwesomeIcon icon={faClosedCaptioning} size={20} color={darkGrey} style={styles.switchIcon}/>
                            <Text style={styles.switchLabel}>Speak Punctuation</Text>
                            <Switch value={localSettings.speakPunctuation} onValueChange={(v) => handleSettingChange('speakPunctuation', v)} {...switchStyles} accessibilityLabel="Speak punctuation switch"/>
                        </View>
                        <Text style={styles.infoText}>Note: Highlighting and punctuation require custom app logic.</Text>
                    </View>
                </View>

                {/* --- Actions (Outside Cards) --- */}
                 <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.previewButton, (isLoadingVoices || isSpeaking) && styles.buttonDisabledOpac]}
                        onPress={handlePreview}
                        disabled={isSaving || isLoadingVoices || isSpeaking}
                        accessibilityRole="button"
                        accessibilityLabel={isSpeaking ? "Stop speech preview" : "Preview voice settings"}
                    >
                        <FontAwesomeIcon icon={faPlayCircle} size={18} color={whiteColor} style={styles.buttonIcon}/>
                        <Text style={styles.previewButtonText}>{isSpeaking ? 'Stop Preview' : 'Preview Voice'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resetButton, !hasUnsavedChanges && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={isSaving || !hasUnsavedChanges}
                        accessibilityRole="button"
                        accessibilityLabel="Reset changes to last saved settings"
                    >
                        <FontAwesomeIcon icon={faUndo} size={14} color={hasUnsavedChanges ? darkGrey : mediumGrey} style={styles.buttonIcon}/>
                        <Text style={[styles.resetButtonText, !hasUnsavedChanges && styles.textDisabled]}>Reset Changes</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};


// --- Styles & Constants ---
// Using colors similar to ParentalControls/AboutScreen simplified version
const primaryColor = '#0077b6';
const secondaryColor = '#90e0ef';
const screenBackgroundColor = '#f4f7f9'; // Match other screens
const cardBackgroundColor = '#ffffff';
const whiteColor = '#ffffff';
const textColor = '#2d3436';
const darkGrey = '#636e72';
const mediumGrey = '#b2bec3';
const lightGrey = '#dfe6e9';
const dangerColor = '#d63031';
const disabledButtonColor = '#a9d6e9'; // Muted primary

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const sliderStyles = {
    minimumTrackTintColor: primaryColor,
    maximumTrackTintColor: secondaryColor,
    thumbTintColor: Platform.OS === 'android' ? primaryColor : undefined
};
const switchStyles = {
    trackColor: { false: mediumGrey, true: secondaryColor },
    thumbColor: Platform.OS === 'android' ? primaryColor : undefined,
    ios_backgroundColor: mediumGrey,
};

// --- Stylesheet - Adapted from ParentalControls Simple ---
const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: screenBackgroundColor
    },
    header: {
        backgroundColor: primaryColor,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        paddingBottom: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: whiteColor,
        textAlign: 'center',
    },
    headerButton: {
        padding: 10,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: { // Style for the ScrollView component itself
        flex: 1,
    },
    scrollContainer: { // Style for the CONTENT *inside* the ScrollView
        padding: 15,
        paddingBottom: 20, // Reduced bottom padding
    },
    sectionCard: { // SIMPLIFIED CARD STYLE
        backgroundColor: cardBackgroundColor,
        borderRadius: 12,
        paddingHorizontal: 0, // Horizontal padding handled by content/header inside
        paddingTop: 0,
        paddingBottom: 0, // Padding handled by content/footer inside
        marginBottom: 20,
        borderWidth: 1, // Use border for separation
        borderColor: lightGrey, // Light border color
        overflow: 'hidden', // Clip header/footer borders correctly
    },
    cardHeader: { // Added style for card headers
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18, // Horizontal padding for header content
        paddingTop: 15,
        paddingBottom: 10,
        // Removed marginBottom, handled by cardContent or item spacing below
        borderBottomWidth: 1,
        borderBottomColor: lightGrey,
     },
    cardIcon: { // Icon within the card header
        marginRight: 12,
        width: 20,
        textAlign: 'center',
     },
     sectionTitle: { // Title within the card header
        fontSize: 17,
        fontWeight: '600',
        color: textColor,
        flex: 1, // Allow title to take space
    },
    cardContent: { // Added wrapper for content padding inside card
        paddingHorizontal: 18,
        paddingTop: 15,
        paddingBottom: 10, // Padding below last item in card
    },
    loadingIndicator: {
        marginTop: 10,
        marginBottom: 10,
    },
    errorText: {
        textAlign: 'center',
        color: dangerColor,
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: mediumGrey,
        borderRadius: 8,
        marginBottom: 10, // Space below picker
        backgroundColor: whiteColor,
        overflow: 'hidden',
    },
    picker: {
        height: Platform.OS === 'ios' ? 200 : 50,
        color: textColor,
    },
    pickerItem: {
        height: 150, // iOS item height
        color: textColor, // iOS item text color
        fontSize: 16, // iOS item font size
    },
    settingSection: { // Container for Label + Controls (e.g., Pitch section)
        marginBottom: 20, // Space between parameter sections
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: textColor,
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
        fontSize: 15,
        color: primaryColor,
        fontWeight: '600',
        minWidth: 45,
        textAlign: 'right',
        marginLeft: 12,
    },
    switchRow: { // Keep switch row style, now inside cardContent padding
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: lightGrey,
    },
     switchIcon: {
         marginRight: 15,
         width: 20,
         textAlign: 'center',
     },
    switchLabel: {
        flex: 1,
        fontSize: 16,
        color: textColor,
        marginRight: 10,
    },
    infoText: { // Note within Behavior card
        fontSize: 12,
        color: darkGrey,
        marginTop: 15,
        // Removed marginBottom, paddingBottom on cardContent handles it
        textAlign: 'center',
        paddingHorizontal: 5, // Reduce padding as it's inside cardContent padding
        fontStyle: 'italic',
    },
    infoTextSmall: { // Note within Parameters card
        fontSize: 11,
        color: darkGrey,
        marginTop: 4,
        textAlign: 'center',
    },
    actionsContainer: { // Buttons outside cards
        marginTop: 20, // Space above action buttons
        alignItems: 'center',
    },
    previewButton: { // Keep preview button style
        flexDirection: 'row',
        backgroundColor: primaryColor,
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        minWidth: 200,
        // Optional: Add shadow back if desired for buttons
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.25,
        // shadowRadius: 4,
        // elevation: 4,
    },
    previewButtonText: {
        color: whiteColor,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonIcon: { // For both Preview and Reset
        marginRight: 10,
    },
    resetButton: { // Flat reset button
        flexDirection: 'row',
        alignSelf: 'center',
        // marginTop: 15, // Handled by actionsContainer margin
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    resetButtonText: {
        fontSize: 14,
        color: darkGrey,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    buttonDisabled: { /* Applied dynamically */ },
    buttonDisabledOpac: { // Style for disabled preview button
        opacity: 0.6,
    },
    textDisabled: { // Style for disabled reset text
        color: mediumGrey,
        textDecorationLine: 'none',
    }
});

export default SymbolVoiceOverScreen;