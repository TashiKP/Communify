import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Slider from '@react-native-community/slider';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faSlidersH,
  faLock,
  faLockOpen,
} from '@fortawesome/free-solid-svg-icons';
import {VoiceSettingData, ThemeColors} from './types';

const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};

interface ParametersProps {
  settings: VoiceSettingData;
  onSettingChange: <K extends keyof VoiceSettingData>(
    key: K,
    value: VoiceSettingData[K],
  ) => void;
  isSaving: boolean;
  sliderStyles: any;
  styles: any;
  theme: ThemeColors;
  t: (key: string, options?: Record<string, any>) => string; // <--- MODIFIED LINE
}

const Parameters: React.FC<ParametersProps> = ({
  settings,
  onSettingChange,
  isSaving,
  sliderStyles,
  styles,
  theme,
  t,
}) => {
  const formatValue = (value: number) => {
    console.log('formatValue called with:', value); // Debug log
    return `${Math.round(value * 100)}%`;
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faSlidersH}
          size={16 * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('voiceSettings.parametersSectionTitle')}
        </Text>
      </View>
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, {color: theme.text}]}>
          {t('voiceSettings.pitchLabel')}
        </Text>
        <View style={styles.sliderControlRow}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() =>
              onSettingChange('pitchLocked', !settings.pitchLocked)
            }
            hitSlop={hitSlop}
            accessibilityLabel={
              settings.pitchLocked
                ? t('voiceSettings.unlockPitch')
                : t('voiceSettings.lockPitch')
            }
            accessibilityRole="button"
            disabled={isSaving}>
            <FontAwesomeIcon
              icon={settings.pitchLocked ? faLock : faLockOpen}
              size={16 * 1.1}
              color={settings.pitchLocked ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={settings.pitch}
            onValueChange={v => onSettingChange('pitch', v)}
            disabled={settings.pitchLocked || isSaving}
            {...sliderStyles}
            accessibilityLabel={t(
              'voiceSettings.pitchSliderAccessibilityLabel',
            )}
            accessibilityState={{disabled: settings.pitchLocked || isSaving}}
          />
          <Text
            style={[styles.valueText, {color: theme.primary}]}
            accessibilityLabel={t(
              'voiceSettings.pitchValueAccessibilityLabel',
              {value: formatValue(settings.pitch)},
            )}>
            {formatValue(settings.pitch)}
          </Text>
        </View>
      </View>
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, {color: theme.text}]}>
          {t('voiceSettings.speedLabel')}
        </Text>
        <View style={styles.sliderControlRow}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() =>
              onSettingChange('speedLocked', !settings.speedLocked)
            }
            hitSlop={hitSlop}
            accessibilityLabel={
              settings.speedLocked
                ? t('voiceSettings.unlockSpeed')
                : t('voiceSettings.lockSpeed')
            }
            accessibilityRole="button"
            disabled={isSaving}>
            <FontAwesomeIcon
              icon={settings.speedLocked ? faLock : faLockOpen}
              size={16 * 1.1}
              color={settings.speedLocked ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={settings.speed}
            onValueChange={v => onSettingChange('speed', v)}
            disabled={settings.speedLocked || isSaving}
            {...sliderStyles}
            accessibilityLabel={t(
              'voiceSettings.speedSliderAccessibilityLabel',
            )}
            accessibilityState={{disabled: settings.speedLocked || isSaving}}
          />
          <Text
            style={[styles.valueText, {color: theme.primary}]}
            accessibilityLabel={t(
              'voiceSettings.speedValueAccessibilityLabel',
              {value: formatValue(settings.speed)},
            )}>
            {formatValue(settings.speed)}
          </Text>
        </View>
      </View>
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, {color: theme.text}]}>
          {t('voiceSettings.volumeLabel')}
        </Text>
        <View style={styles.sliderControlRow}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() =>
              onSettingChange('volumeLocked', !settings.volumeLocked)
            }
            hitSlop={hitSlop}
            accessibilityLabel={
              settings.volumeLocked
                ? t('voiceSettings.unlockVolume')
                : t('voiceSettings.lockVolume')
            }
            accessibilityRole="button"
            disabled={isSaving}>
            <FontAwesomeIcon
              icon={settings.volumeLocked ? faLock : faLockOpen}
              size={16 * 1.1}
              color={
                settings.volumeLocked ? theme.primary : theme.textSecondary
              }
            />
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={settings.volume}
            onValueChange={v => onSettingChange('volume', v)}
            disabled={settings.volumeLocked || isSaving}
            {...sliderStyles}
            accessibilityLabel={t(
              'voiceSettings.volumeSliderAccessibilityLabel',
            )}
            accessibilityState={{disabled: settings.volumeLocked || isSaving}}
          />
          <Text
            style={[styles.valueText, {color: theme.primary}]}
            accessibilityLabel={t(
              'voiceSettings.volumeValueAccessibilityLabel',
              {value: formatValue(settings.volume)},
            )} // This line will now be correct
          >
            {formatValue(settings.volume)}
          </Text>
        </View>
        <Text style={[styles.infoTextSmall, {color: theme.textSecondary}]}>
          {t('voiceSettings.volumeNote')}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(Parameters);
