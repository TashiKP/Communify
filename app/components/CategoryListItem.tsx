// src/components/CategoryListItem.tsx
import React, { memo } from 'react'; // Removed useState, useEffect
import { View, StyleSheet } from 'react-native';
import CateComponent from './CateComponent';
import { CategoryInfo } from './Symbols';

interface CategoryListItemProps {
  categoryInfo: CategoryInfo;
  displayedName: string; // NEW: Receive pre-translated or original name
  onPressCategory: (originalName: string) => void;
  isSelected: boolean;
  themeBorderColor: string;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
  categoryInfo,
  displayedName, // Use this directly
  onPressCategory,
  isSelected,
  themeBorderColor,
}) => {
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeBorderColor }}>
      <CateComponent
        keyword={displayedName} // Use the passed displayedName
        iconKeywordForArasaac={categoryInfo.name}
        languageForArasaac="en"
        onPress={() => onPressCategory(categoryInfo.name)}
        isSelected={isSelected}
      />
    </View>
  );
};

export default memo(CategoryListItem);