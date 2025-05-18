// src/components/SymbolDisplay/constants.ts
import { CategoryInfo } from './types';

export const CUSTOM_SYMBOLS_STORAGE_KEY = '@Communify:customSymbols';

// APP_CATEGORIES_BASE defines foundational categories, especially non-standard ones
// or standard ones for which a specific name/ID is preferred if the API returns them.
export const APP_CATEGORIES_BASE: CategoryInfo[] = [
  { id: 'cat_contextual', name: 'contextual', isStandard: false },
  { id: 'cat_custom', name: 'custom', isStandard: false },
  { id: 'cat_food', name: 'food', isStandard: true }, // Example of a standard category with a preferred name
];