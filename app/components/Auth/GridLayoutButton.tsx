import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';

import * as appColors from '../../../app/constants/colors'; // Adjust path
import * as appDimensions from '../../../app/constants/dimensions'; // Adjust path

export interface GridLayoutButtonData {
  type: string; // Or LocalGridLayoutType
  label: string;
  icon: IconDefinition;
}

interface GridLayoutButtonProps {
  option: GridLayoutButtonData;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const GridLayoutButton: React.FC<GridLayoutButtonProps> = ({
  option,
  isSelected,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.selectButton,
        styles.gridButton,
        isSelected && styles.selectButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}>
      <FontAwesomeIcon
        icon={option.icon}
        size={appDimensions.ICON_SIZE_MEDIUM || 20}
        style={styles.buttonIcon}
        color={isSelected ? appColors.WHITE_COLOR : appColors.PRIMARY_COLOR}
      />
      <Text
        style={[
          styles.selectButtonText,
          styles.gridButtonText,
          isSelected && styles.selectButtonTextSelected,
        ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appDimensions.PADDING_MEDIUM || 12,
    paddingHorizontal: appDimensions.PADDING_SMALL || 8,
    borderRadius: appDimensions.BORDER_RADIUS_BUTTON || 8,
    borderWidth: appDimensions.BORDER_WIDTH_GENDER_SEGMENT || 1,
    borderColor: appColors.BORDER_COLOR_MEDIUM,
    backgroundColor: appColors.WHITE_COLOR,
    flex: 1,
    minHeight: appDimensions.BUTTON_MIN_HEIGHT_PROFILE || 48,
  },
  gridButton: {
    // Can be merged with selectButton if no distinct styles
    // Add specific grid button styles if any
  },
  selectButtonSelected: {
    backgroundColor: appColors.PRIMARY_COLOR,
    borderColor: appColors.PRIMARY_COLOR,
  },
  buttonIcon: {
    marginRight: appDimensions.MARGIN_SMALL || 8,
  },
  selectButtonText: {
    fontSize: appDimensions.FONT_SIZE_LABEL || 14,
    fontWeight: '600',
    color: appColors.PRIMARY_COLOR,
    textAlign: 'center',
  },
  gridButtonText: {
    // Can be merged with selectButtonText
    // Add specific grid button text styles if any
  },
  selectButtonTextSelected: {
    color: appColors.WHITE_COLOR,
  },
});

export default GridLayoutButton;
