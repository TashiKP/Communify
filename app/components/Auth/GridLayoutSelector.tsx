import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GridLayoutButton, { GridLayoutButtonData } from './GridLayoutButton'; // Import data type

import * as appColors from '../../../app/constants/colors'; // Adjust path
import * as appDimensions from '../../../app/constants/dimensions'; // Adjust path

interface GridLayoutSelectorProps {
  options: GridLayoutButtonData[];
  selectedValue: string; // Or LocalGridLayoutType
  onSelect: (value: string) => void; // Or (value: LocalGridLayoutType) => void
  isLoading?: boolean;
  title?: string;
}

const GridLayoutSelector: React.FC<GridLayoutSelectorProps> = ({
  options,
  selectedValue,
  onSelect,
  isLoading,
  title = "Preferred Symbol Grid Layout:"
}) => {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.buttonGroup}>
        {options.map(opt => (
          <GridLayoutButton
            key={opt.type}
            option={opt}
            isSelected={selectedValue === opt.type}
            onPress={() => onSelect(opt.type)}
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
  buttonGroup: {
    flexDirection: 'row',
    gap: appDimensions.MARGIN_SMALL || 8, // 'gap' is convenient, ensure compatibility or use margins
  },
});

export default GridLayoutSelector;