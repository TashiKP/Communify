// src/components/CustomPage/types.ts
export interface SymbolItem {
    id: string;
    name: string;
    imageUri?: string;
    categoryId?: string | null;
}

export interface CategoryItem {
    id: string;
    name: string;
}

export interface GridSection {
    id: string | null;
    name: string;
    symbols: SymbolItem[];
}