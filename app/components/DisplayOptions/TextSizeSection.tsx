import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faTextHeight, faFont} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {DisplayScreenSettings} from '../DisplayOptionsScreen';
import {FontSizes, ThemeColors} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';

interface TextSizeSectionProps {
  localSettings: DisplayScreenSettings;
  onSettingChange: <K extends keyof DisplayScreenSettings>(
    key: K,
    value: DisplayScreenSettings[K],
  ) => void;
  theme: ThemeColors;
  fonts: FontSizes;
  currentLanguage: string;
}

const TextSizeSection: React.FC<TextSizeSectionProps> = ({
  localSettings,
  onSettingChange,
  theme,
  fonts,
  currentLanguage,
}) => {
  const {t} = useTranslation();
  const styles = createStyles(theme, fonts, currentLanguage);

  const textSizeOptions = useMemo(
    () => [
      {type: 'small' as const, labelKey: 'displayOptions.textSize.small'},
      {type: 'medium' as const, labelKey: 'displayOptions.textSize.medium'},
      {type: 'large' as const, labelKey: 'displayOptions.textSize.large'},
    ],
    [],
  );

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faTextHeight}
          size={fonts.body * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('displayOptions.textSize.sectionTitle')}
        </Text>
      </View>
      <View style={styles.textSizeOptionsContainer}>
        {textSizeOptions.map(option => {
          const isSelected = localSettings.textSize === option.type;
          const label = t(option.labelKey);
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.textSizeButton,
                isSelected && styles.textSizeButtonActive,
              ]}
              onPress={() => onSettingChange('textSize', option.type)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{checked: isSelected}}
              accessibilityLabel={t(
                'displayOptions.textSize.accessibilityLabel',
                {size: label},
              )}>
              <FontAwesomeIcon
                icon={faFont}
                size={fonts.body * 1.1}
                color={isSelected ? theme.white : theme.primary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.infoTextSmall, {color: theme.textSecondary}]}>
        {t('displayOptions.textSize.infoText')}
      </Text>
    </View>
  );
};

const createStyles = (
  theme: ThemeColors,
  fonts: FontSizes,
  currentLanguage: string,
) =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 18,
      marginBottom: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      shadowColor: theme.text,
      shadowOffset: {width: 0, height: 1},
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
    textSizeOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 5,
    },
    textSizeButton: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70,
      minHeight: 44,
    },
    textSizeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
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
  });

export default TextSizeSection;
