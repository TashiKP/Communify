// src/components/SymbolDisplay/gridHelpers.ts
import { Dimensions } from 'react-native';
import { GridLayoutType } from '../../context/GridContext';

const screenWidth = Dimensions.get('window').width;

export const getNumColumns = (layout: GridLayoutType): number => {
  switch (layout) {
    case 'simple': return 4;
    case 'standard': return 6;
    case 'dense': return 8;
    default: return 6; // Default to standard if layout is somehow undefined or unexpected
  }
};

export const calculateItemWidth = (layout: GridLayoutType, numCols: number, itemLayoutMargin: number): number => {
  const leftPanelFlex = 8;
  const rightPanelFlex = 2.5;
  const totalFlex = leftPanelFlex + rightPanelFlex;
  const approxLeftPanelWidth = screenWidth * (leftPanelFlex / totalFlex);
  const gridContainerSidePadding = itemLayoutMargin / 2;
  const itemWrapperSideMargin = itemLayoutMargin / 2;
  const totalHorizontalGridPadding = gridContainerSidePadding * 2;
  const totalHorizontalItemWrapperMargins = itemWrapperSideMargin * 2 * numCols;
  const availableWidthForItems = approxLeftPanelWidth - totalHorizontalGridPadding - totalHorizontalItemWrapperMargins;
  const minSizeBasedOnLayout = layout === 'simple' ? 90 : layout === 'standard' ? 75 : 60;
  let calculatedWidth = 0;
  if (numCols > 0) {
    calculatedWidth = availableWidthForItems / numCols;
  } else {
    calculatedWidth = availableWidthForItems; 
  }
  return Math.max(minSizeBasedOnLayout, Math.floor(calculatedWidth));
};