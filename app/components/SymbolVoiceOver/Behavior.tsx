import React from 'react';
import {View, Text, Switch} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faClosedCaptioning,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';
import {VoiceSettingData, ThemeColors} from './types';

interface BehaviorProps {
  settings: VoiceSettingData;
  onSettingChange: <K extends keyof VoiceSettingData>(
    key: K,
    value: VoiceSettingData[K],
  ) => void;
  isSaving: boolean;
  switchStyles: any;
  styles: any;
  theme: ThemeColors;
  t: (key: string) => string;
}

const Behavior: React.FC<BehaviorProps> = ({
  settings,
  onSettingChange,
  isSaving,
  switchStyles,
  styles,
  theme,
  t,
}) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faClosedCaptioning}
          size={16 * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('voiceSettings.behaviorSectionTitle')}
        </Text>
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <FontAwesomeIcon
            icon={faHighlighter}
            size={16 * 1.1}
            color={theme.textSecondary}
            style={styles.switchIcon}
          />
          <Text style={[styles.switchLabel, {color: theme.text}]}>
            {t('voiceSettings.highlightLabel')}
          </Text>
        </View>
        <Switch
          value={settings.highlightWord}
          onValueChange={v => onSettingChange('highlightWord', v)}
          {...switchStyles}
          disabled={isSaving}
          accessibilityLabel={t('voiceSettings.highlightAccessibilityLabel')}
          accessibilityState={{
            checked: settings.highlightWord,
            disabled: isSaving,
          }}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <FontAwesomeIcon
            icon={faClosedCaptioning}
            size={16 * 1.1}
            color={theme.textSecondary}
            style={styles.switchIcon}
          />
          <Text style={[styles.switchLabel, {color: theme.text}]}>
            {t('voiceSettings.punctuationLabel')}
          </Text>
        </View>
        <Switch
          value={settings.speakPunctuation}
          onValueChange={v => onSettingChange('speakPunctuation', v)}
          {...switchStyles}
          disabled={isSaving}
          accessibilityLabel={t('voiceSettings.punctuationAccessibilityLabel')}
          accessibilityState={{
            checked: settings.speakPunctuation,
            disabled: isSaving,
          }}
        />
      </View>
      <Text style={[styles.infoTextSmall, {color: theme.textSecondary}]}>
        {t('voiceSettings.behaviorNote')}
      </Text>
    </View>
  );
};

export default Behavior;
