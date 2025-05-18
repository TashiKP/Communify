import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSun,
  faLock,
  faLockOpen,
  faMoon,
  faAdjust,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { DisplayScreenSettings } from '../DisplayOptionsScreen';
import { FontSizes, ThemeColors } from '../../context/AppearanceContext';
import { getLanguageSpecificTextStyle } from '../../styles/typography';


interface AppearanceSectionProps {
  localSettings: DisplayScreenSettings;
  isBrightnessLocked: boolean;
  onSettingChange: <K extends keyof DisplayScreenSettings>(
    key: K,
    value: DisplayScreenSettings[K]
  ) => void;
  onBrightnessLockToggle: () => void;
  theme: ThemeColors;
  fonts: FontSizes;
  currentLanguage: string;
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  localSettings,
  isBrightnessLocked,
  onSettingChange,
  onBrightnessLockToggle,
  theme,
  fonts,
  currentLanguage,
}) => {
  const { t } = useTranslation();
  const styles = createStyles(theme, fonts, currentLanguage);

  const contrastOptions = useMemo(
    () => [
      { type: 'default' as const, labelKey: 'displayOptions.contrast.default' },
      { type: 'high-contrast-light' as const, labelKey: 'displayOptions.contrast.highLight' },
      { type: 'high-contrast-dark' as const, labelKey: 'displayOptions.contrast.highDark' },
    ],
    []
  );

  const mapBrightnessValueToLabel = (value: number): string => {
    if (value < 34) return t('displayOptions.appearance.brightnessLow');
    if (value < 67) return t('displayOptions.appearance.brightnessMedium');
    return t('displayOptions.appearance.brightnessHigh');
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faSun}
          size={fonts.body * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('displayOptions.appearance.sectionTitle')}
        </Text>
      </View>
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {t('displayOptions.appearance.brightnessLabel')}
        </Text>
        <View style={styles.sliderControlRow}>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={onBrightnessLockToggle}
            hitSlop={hitSlop}
            accessibilityLabel={
              isBrightnessLocked
                ? t('displayOptions.appearance.unlockBrightness')
                : t('displayOptions.appearance.lockBrightness')
            }
            accessibilityRole="button"
          >
            <FontAwesomeIcon
              icon={isBrightnessLocked ? faLock : faLockOpen}
              size={fonts.body * 1.1}
              color={isBrightnessLocked ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={localSettings.brightness}
            onValueChange={(value) => onSettingChange('brightness', Math.round(value))}
            disabled={isBrightnessLocked}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={Platform.OS === 'android' ? theme.primary : undefined}
            accessibilityLabel={t('displayOptions.appearance.brightnessSliderAccessibilityLabel')}
            accessibilityValue={{ text: mapBrightnessValueToLabel(localSettings.brightness) }}
            accessibilityState={{ disabled: isBrightnessLocked }}
          />
          <Text
            style={[styles.valueText, { color: theme.primary }]}
            accessibilityLabel={t('displayOptions.appearance.brightnessValueAccessibilityLabel', {
              value: mapBrightnessValueToLabel(localSettings.brightness),
            })}
          >
            {mapBrightnessValueToLabel(localSettings.brightness)}
          </Text>
        </View>
        <Text style={[styles.infoTextSmall, { color: theme.textSecondary }]}>
          {t('displayOptions.appearance.brightnessInfo')}
        </Text>
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <FontAwesomeIcon
            icon={faMoon}
            size={fonts.body * 1.1}
            color={theme.textSecondary}
            style={styles.switchIcon}
          />
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            {t('displayOptions.appearance.darkModeLabel')}
          </Text>
        </View>
        <Switch
          value={localSettings.darkModeEnabled}
          onValueChange={(v) => onSettingChange('darkModeEnabled', v)}
          trackColor={{ false: theme.disabled, true: theme.secondary }}
          thumbColor={Platform.OS === 'android' ? theme.primary : undefined}
          ios_backgroundColor={theme.disabled}
          accessibilityLabel={t('displayOptions.appearance.darkModeAccessibilityLabel')}
          accessibilityState={{ checked: localSettings.darkModeEnabled }}
        />
      </View>
      <View style={styles.contrastSection}>
        <View style={styles.contrastHeader}>
          <FontAwesomeIcon
            icon={faAdjust}
            size={fonts.body * 1.1}
            color={theme.textSecondary}
            style={styles.switchIcon}
          />
          <Text style={[styles.switchLabel, { color: theme.text }]}>
            {t('displayOptions.appearance.contrastLabel')}
          </Text>
        </View>
        <View style={styles.contrastOptionsContainer}>
          {contrastOptions.map((option) => {
            const isSelected = localSettings.contrastMode === option.type;
            const label = t(option.labelKey);
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.contrastOptionButton,
                  isSelected && styles.contrastOptionButtonActive,
                ]}
                onPress={() => onSettingChange('contrastMode', option.type)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={t('displayOptions.appearance.contrastAccessibilityLabel', {
                  contrast: label,
                })}
              >
                <Text
                  style={[
                    styles.contrastOptionLabel,
                    isSelected && styles.contrastOptionLabelActive,
                    { color: isSelected ? theme.primary : theme.text },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, fonts: FontSizes, currentLanguage: string) =>
  StyleSheet.create({
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
      width: (fonts.body || 16) * 1.1,
      textAlign: 'center',
    },
    sectionTitle: {
      ...getLanguageSpecificTextStyle('label', fonts, currentLanguage),
      fontSize: fonts.label || 14,
      fontWeight: '700',
      flex: 1,
      color: theme.text,
    },
    settingItem: {
      marginBottom: 15,
    },
    settingLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
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
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '500',
      minWidth: 80,
      textAlign: 'center',
      marginLeft: 14,
      color: theme.primary,
    },
    infoTextSmall: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '500',
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 5,
      color: theme.textSecondary,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    switchLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    switchIcon: {
      marginRight: 15,
      width: (fonts.body || 16) * 1.1,
      textAlign: 'center',
    },
    switchLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '700',
      color: theme.text,
    },
    contrastSection: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    contrastHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    contrastOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    contrastOptionButton: {
      flexBasis: '48%',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      minHeight: 44,
    },
    contrastOptionButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    contrastOptionLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '500',
      color: theme.white,
    },
    contrastOptionLabelActive: {
      fontWeight: '600',
      color: theme.white,
    },
  });

export default AppearanceSection;