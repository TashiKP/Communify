import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPlayCircle} from '@fortawesome/free-solid-svg-icons';
import {ThemeColors} from './types';

interface PreviewProps {
  isSpeaking: boolean;
  isPreviewDisabled: boolean;
  onPreview: () => void;
  styles: any;
  theme: ThemeColors;
  t: (key: string) => string;
}

const Preview: React.FC<PreviewProps> = ({
  isSpeaking,
  isPreviewDisabled,
  onPreview,
  styles,
  theme,
  t,
}) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faPlayCircle}
          size={16 * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('voiceSettings.previewSectionTitle')}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.previewButton,
          isPreviewDisabled && styles.buttonDisabled,
        ]}
        onPress={onPreview}
        disabled={isPreviewDisabled}
        accessibilityRole="button"
        accessibilityLabel={
          isSpeaking
            ? t('voiceSettings.stopPreview')
            : t('voiceSettings.preview')
        }
        accessibilityState={{disabled: isPreviewDisabled}}>
        <FontAwesomeIcon
          icon={faPlayCircle}
          size={16 * 1.1}
          color={isPreviewDisabled ? theme.textSecondary : theme.white}
          style={styles.buttonIcon}
        />
        <Text
          style={[
            styles.previewButtonText,
            {color: isPreviewDisabled ? theme.textSecondary : theme.white},
          ]}>
          {isSpeaking
            ? t('voiceSettings.stopPreview')
            : t('voiceSettings.preview')}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.infoTextSmall, {color: theme.textSecondary}]}>
        {t('voiceSettings.previewNote')}
      </Text>
    </View>
  );
};

export default Preview;
