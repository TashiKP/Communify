import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsdOptionCard, { AsdOptionCardData } from './AsdOptionCard'; // Import the data type if defined separately

import * as appColors from '../../../app/constants/colors'; // Adjust path
import * as appDimensions from '../../../app/constants/dimensions'; // Adjust path

interface AsdLevelSelectorProps {
  options: AsdOptionCardData[];
  selectedValue: string | null; // Or AsdLevelOptionType | null
  onSelect: (value: string) => void; // Or (value: AsdLevelOptionType) => void
  isLoading?: boolean;
  title?: string;
}

const AsdLevelSelector: React.FC<AsdLevelSelectorProps> = ({
  options,
  selectedValue,
  onSelect,
  isLoading,
  title = "ASD Support Level:"
}) => {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.optionsList}>
        {options.map((option) => (
          <AsdOptionCard
            key={option.type}
            option={option}
            isSelected={selectedValue === option.type}
            onPress={() => onSelect(option.type)}
            disabled={isLoading}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formSection: {
    marginBottom: appDimensions.MARGIN_LARGE || 20,
  },
  label: {
    fontSize: appDimensions.FONT_SIZE_SUBTITLE || 16,
    fontWeight: '500',
    color: appColors.TEXT_COLOR_SECONDARY,
    marginBottom: appDimensions.MARGIN_SMALL || 8,
  },
  optionsList: {
  },
});

export default AsdLevelSelector;