import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheckCircle, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import * as appColors from '../../../app/constants/colors'; // Adjust path
import * as appDimensions from '../../../app/constants/dimensions'; // Adjust path

export interface AsdOptionCardData {
    type: string; // Or a more specific enum/type like AsdLevelOptionType
    label: string;
    description: string;
    icon: IconDefinition;
}

interface AsdOptionCardProps {
  option: AsdOptionCardData;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const AsdOptionCard: React.FC<AsdOptionCardProps> = ({ option, isSelected, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <FontAwesomeIcon icon={option.icon} size={appDimensions.ICON_SIZE_OPTION_CARD || 20} color={isSelected ? appColors.PRIMARY_COLOR : appColors.TEXT_COLOR_SECONDARY} style={styles.optionIcon} />
      <View style={styles.optionTextWrapper}>
        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
        <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>{option.description}</Text>
      </View>
      <View style={[styles.checkIndicatorBase, isSelected && styles.checkIndicatorSelected]}>
        {isSelected && <FontAwesomeIcon icon={faCheckCircle} size={appDimensions.ICON_SIZE_MEDIUM || 20} color={appColors.WHITE_COLOR} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.WHITE_COLOR,
    padding: appDimensions.PADDING_MEDIUM || 12,
    borderRadius: appDimensions.BORDER_RADIUS_CARD || 10,
    borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1,
    borderColor: appColors.BORDER_COLOR_MEDIUM,
    marginBottom: appDimensions.MARGIN_MEDIUM || 12,
    minHeight: appDimensions.OPTION_CARD_MIN_HEIGHT || 60,
  },
  optionCardSelected: {
    borderColor: appColors.PRIMARY_COLOR,
    backgroundColor: appColors.BACKGROUND_SELECTED_LIGHT || '#e0f7ff',
  },
  optionIcon: {
    marginRight: appDimensions.PADDING_MEDIUM || 12,
    width: (appDimensions.ICON_SIZE_OPTION_CARD || 22) + 5, // Ensure consistent width for alignment
    textAlign: 'center',
  },
  optionTextWrapper: {
    flex: 1,
    marginRight: appDimensions.MARGIN_SMALL || 8,
  },
  optionLabel: {
    fontSize: appDimensions.FONT_SIZE_INPUT || 16,
    fontWeight: 'bold',
    color: appColors.TEXT_COLOR_PRIMARY,
    marginBottom: appDimensions.MARGIN_XXSMALL || 4,
  },
  optionLabelSelected: {
    color: appColors.PRIMARY_COLOR,
  },
  optionDescription: {
    fontSize: appDimensions.FONT_SIZE_DESCRIPTION || 13,
    color: appColors.TEXT_COLOR_SECONDARY,
    lineHeight: appDimensions.LINE_HEIGHT_DESCRIPTION || 18,
  },
  optionDescriptionSelected: { // Description color might not need to change, or could be subtle
    color: appColors.TEXT_COLOR_SECONDARY, // Or appColors.PRIMARY_COLOR_LIGHT or similar
  },
  checkIndicatorBase: {
    width: appDimensions.CHECK_INDICATOR_SIZE || 24,
    height: appDimensions.CHECK_INDICATOR_SIZE || 24,
    borderRadius: (appDimensions.CHECK_INDICATOR_SIZE || 24) / 2,
    borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1,
    borderColor: appColors.BORDER_COLOR_MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.WHITE_COLOR,
  },
  checkIndicatorSelected: {
    borderColor: appColors.PRIMARY_COLOR,
    backgroundColor: appColors.PRIMARY_COLOR,
  },
});

export default AsdOptionCard;