import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faColumns,
  faGripVertical,
  faTh,
  faThLarge,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {GridLayoutType} from '../../context/GridContext';
import {FontSizes, ThemeColors} from '../../context/AppearanceContext';
import {getLanguageSpecificTextStyle} from '../../styles/typography';

interface LayoutSectionProps {
  gridLayout: GridLayoutType;
  isLoadingLayout: boolean;
  isSaving: boolean;
  onLayoutSelect: (layout: GridLayoutType) => void;
  theme: ThemeColors;
  fonts: FontSizes;
  currentLanguage: string;
}

const LayoutSection: React.FC<LayoutSectionProps> = ({
  gridLayout,
  isLoadingLayout,
  isSaving,
  onLayoutSelect,
  theme,
  fonts,
  currentLanguage,
}) => {
  const {t} = useTranslation();
  const styles = createStyles(theme, fonts, currentLanguage);

  const layoutOptions = useMemo(
    () => [
      {
        type: 'simple' as GridLayoutType,
        labelKey: 'displayOptions.layout.simple',
        icon: faGripVertical,
      },
      {
        type: 'standard' as GridLayoutType,
        labelKey: 'displayOptions.layout.standard',
        icon: faTh,
      },
      {
        type: 'dense' as GridLayoutType,
        labelKey: 'displayOptions.layout.dense',
        icon: faThLarge,
      },
    ],
    [],
  );

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon
          icon={faColumns}
          size={fonts.body * 1.1}
          color={theme.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('displayOptions.layout.sectionTitle')}
        </Text>
        {(isLoadingLayout || isSaving) && (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{marginLeft: 10}}
          />
        )}
      </View>
      <View style={styles.layoutOptionsContainer}>
        {layoutOptions.map(option => {
          const isSelected = gridLayout === option.type;
          const isDisabled = isLoadingLayout || isSaving;
          const label = t(option.labelKey);
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.layoutOptionButton,
                isSelected && styles.layoutOptionButtonActive,
                isDisabled && styles.buttonDisabled,
              ]}
              onPress={() => onLayoutSelect(option.type)}
              activeOpacity={0.7}
              disabled={isDisabled}
              accessibilityLabel={t(
                'displayOptions.layout.accessibilityLabel',
                {layout: label},
              )}
              accessibilityRole="radio"
              accessibilityState={{selected: isSelected, disabled: isDisabled}}>
              <FontAwesomeIcon
                icon={option.icon}
                size={fonts.body * 1.1}
                color={isSelected ? theme.white : theme.primary}
                style={styles.layoutOptionIcon}
              />
              <View style={styles.layoutOptionTextContainer}>
                <Text
                  style={[
                    styles.layoutOptionLabel,
                    isSelected && styles.layoutOptionLabelActive,
                    {color: isSelected ? theme.white : theme.text},
                  ]}>
                  {label}
                </Text>
              </View>
              {isSelected && !isDisabled && (
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size={fonts.body * 1.1}
                  color={theme.white}
                  style={styles.layoutCheckIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.infoTextSmall, {color: theme.textSecondary}]}>
        {t('displayOptions.layout.infoText')}
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
    layoutOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginTop: 10,
      marginBottom: 5,
      gap: 10,
    },
    layoutOptionButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
      minHeight: 90,
    },
    layoutOptionButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    layoutOptionIcon: {
      marginBottom: 8,
    },
    layoutOptionTextContainer: {
      alignItems: 'center',
    },
    layoutOptionLabel: {
      ...getLanguageSpecificTextStyle('body', fonts, currentLanguage),
      fontSize: fonts.body || 16,
      fontWeight: '500',
      color: theme.text,
    },
    layoutOptionLabelActive: {
      fontWeight: '600',
      color: theme.white,
    },
    layoutCheckIcon: {
      position: 'absolute',
      top: 8,
      right: 8,
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
    buttonDisabled: {
      opacity: 0.5,
    },
  });

export default LayoutSection;
