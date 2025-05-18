import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { TtsVoice, ThemeColors } from './types';

interface VoiceSelectionProps {
    availableVoices: TtsVoice[];
    isLoadingVoices: boolean;
    selectedVoiceId: string | null;
    onVoiceChange: (voiceId: string) => void;
    styles: any;
    theme: ThemeColors;
    t: (key: string) => string;
}

const VoiceSelection: React.FC<VoiceSelectionProps> = ({
    availableVoices,
    isLoadingVoices,
    selectedVoiceId,
    onVoiceChange,
    styles,
    theme,
    t,
}) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <FontAwesomeIcon icon={faCommentDots} size={16 * 1.1} color={theme.primary} style={styles.sectionIcon} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('voiceSettings.voiceSectionTitle')}</Text>
            </View>
            {isLoadingVoices ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
            ) : availableVoices.length > 0 ? (
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedVoiceId}
                        onValueChange={(itemValue) => {
                            if (itemValue) onVoiceChange(itemValue as string);
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
                <Text style={[styles.errorText, { color: '#dc3545' }]}>{t('voiceSettings.errors.noVoices')}</Text>
            )}
            <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>{t('voiceSettings.voiceNote')}</Text>
        </View>
    );
};

export default VoiceSelection;