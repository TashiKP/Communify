import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Keyboard} from 'react-native';

import * as Colors from '../../constants/colors'; // Adjust path
import * as Dimens from '../../constants/dimensions'; // Adjust path
import * as Strings from '../../constants/strings'; // Adjust path

// Define GenderOption type here or import if defined globally
export type GenderOption =
  | typeof Strings.GENDER_MALE
  | typeof Strings.GENDER_FEMALE
  | typeof Strings.GENDER_OTHER;

interface GenderSelectorProps {
  label: string;
  options: Array<GenderOption>;
  selectedValue: GenderOption | '';
  onSelect: (value: GenderOption) => void;
  disabled?: boolean;
  onSelectionComplete?: () => void; // Optional callback for after selection
}

const GenderSelector: React.FC<GenderSelectorProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  disabled,
  onSelectionComplete,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.genderSegmentContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.genderSegment,
              selectedValue === option && styles.genderSegmentSelected,
              index === options.length - 1 && {borderRightWidth: 0}, // Remove right border for last item
            ]}
            onPress={() => {
              onSelect(option);
              Keyboard.dismiss();
              if (onSelectionComplete) {
                onSelectionComplete();
              }
            }}
            activeOpacity={0.8}
            disabled={disabled}>
            <Text
              style={[
                styles.genderSegmentText,
                selectedValue === option && styles.genderSegmentTextSelected,
              ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Dimens.INPUT_GROUP_MARGIN_BOTTOM || 15,
  },
  label: {
    fontSize: Dimens.FONT_SIZE_LABEL || 14,
    fontWeight: '500',
    color: Colors.TEXT_COLOR_SECONDARY,
    marginBottom: Dimens.LABEL_MARGIN_BOTTOM || 6,
    marginLeft: 2,
  },
  genderSegmentContainer: {
    flexDirection: 'row',
    borderRadius: Dimens.BORDER_RADIUS_GENDER_SEGMENT || 8,
    borderWidth: Dimens.BORDER_WIDTH_GENDER_SEGMENT || 1,
    borderColor: Colors.PRIMARY_COLOR,
    overflow: 'hidden', // Important for rounded corners with borders
    height: Dimens.GENDER_SEGMENT_HEIGHT || 48,
  },
  genderSegment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: Dimens.BORDER_WIDTH_GENDER_SEGMENT || 1,
    borderRightColor: Colors.PRIMARY_COLOR,
    backgroundColor: Colors.WHITE_COLOR,
  },
  genderSegmentSelected: {
    backgroundColor: Colors.PRIMARY_COLOR,
  },
  genderSegmentText: {
    fontSize: Dimens.FONT_SIZE_GENDER_SEGMENT || 14,
    fontWeight: '500',
    color: Colors.PRIMARY_COLOR,
  },
  genderSegmentTextSelected: {
    color: Colors.WHITE_COLOR,
    fontWeight: 'bold',
  },
});

export default GenderSelector;
