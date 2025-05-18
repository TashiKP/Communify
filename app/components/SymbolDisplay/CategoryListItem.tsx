import React from 'react';
import CateComponent from './CateComponent';

interface CategoryListItemProps {
  categoryInfo: {id: string; name: string; isStandard?: boolean};
  displayedName: string;
  onPressCategory: () => void;
  isSelected: boolean;
  themeBorderColor: string;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
  categoryInfo,
  displayedName,
  onPressCategory,
  isSelected,
  themeBorderColor,
}) => {
  return (
    <CateComponent
      keyword={displayedName}
      iconKeywordForArasaac={categoryInfo.name}
      languageForArasaac="en"
      isSelected={isSelected}
      onPress={onPressCategory}
      themeBorderColor={themeBorderColor} // Pass themeBorderColor to CateComponent
    />
  );
};

export default React.memo(CategoryListItem);
