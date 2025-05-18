// src/components/SymbolDisplay/types.ts
import { GridLayoutType } from '../../context/GridContext';

export interface CategoryInfo {
  id: string;
  name: string;
  isStandard?: boolean;
}

export interface CustomSymbolItem {
  id: string;
  name: string;
  imageUri?: string;
}

export interface DisplayedSymbolData {
  id: string;
  keyword: string;
  displayText: string;
  imageUri?: string;
  isCustom?: boolean;
}

export interface SymbolGridProps {
  onSymbolPress: (keyword: string, imageUri?: string) => void;
  onCategoryNameChange?: (name: string) => void;
}

export interface SymbolGridRef {
  addSymbolToLocalCustomCategory: (keywordToAdd: string, imageUri?: string) => Promise<void>;
  selectedCategoryName: string | null;
}