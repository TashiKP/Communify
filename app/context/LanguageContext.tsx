import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import i18n from '../i18n'; // Import your i18n configuration
import { translateKeywords } from '../services/translationService'; // For symbol/category specific API calls

export type LanguageCode = 'en' | 'dzo';

interface LanguageContextType {
    currentLanguage: LanguageCode;
    changeLanguage: (newLanguage: LanguageCode) => void;
    translateSymbolBatch: (texts: string[], targetLang?: LanguageCode) => Promise<string[]>;
    isTranslatingSymbols: boolean; // Renamed for clarity
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Initialize state from i18next current language
    const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(i18n.language as LanguageCode || 'en');
    const [isTranslatingSymbols, setIsTranslatingSymbols] = useState<boolean>(false);

    // Update state if i18next language changes externally (e.g., on init)
    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            setCurrentLanguage(lng as LanguageCode);
        };
        i18n.on('languageChanged', handleLanguageChanged);
        // Set initial state correctly
        setCurrentLanguage(i18n.language as LanguageCode || 'en');
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    // Change language using i18next
    const changeLanguage = useCallback((newLanguage: LanguageCode) => {
        console.log(`Language changing to ${newLanguage} via i18next`);
        i18n.changeLanguage(newLanguage);
        // The 'languageChanged' event listener above will update the context state
    }, []);

    // Keep translateKeywords for dynamic data from API
    const translateSymbolBatch = useCallback(async (texts: string[], targetLang?: LanguageCode): Promise<string[]> => {
        const langToUse = targetLang || currentLanguage;
         // Use the existing logic for calling the API
        if (!texts || texts.length === 0 || langToUse === 'en') {
            return texts;
        }
        setIsTranslatingSymbols(true);
        try {
            // Pass only valid texts to the service
            const validTexts = texts.filter(t => t && t.trim() !== '');
            if (validTexts.length === 0) return texts; // Return original structure if all empty

            const results = await translateKeywords(validTexts, langToUse); // Calls your API

            if (results && results.length === validTexts.length) {
                 // Reconstruct the array with original empty strings preserved
                let resultIdx = 0;
                return texts.map(originalText => {
                    if (originalText && originalText.trim() !== '') {
                        return results[resultIdx++];
                    }
                    return originalText; // Keep original empty/whitespace string
                });
            }
            return texts; // Fallback to original texts on error or length mismatch
        } catch (error) {
            console.error("Error translating symbol batch:", error);
            return texts; // Fallback
        } finally {
            setIsTranslatingSymbols(false);
        }
    }, [currentLanguage]);


    return (
        <LanguageContext.Provider value={{
            currentLanguage,
            changeLanguage,
            translateSymbolBatch,
            isTranslatingSymbols
        }}>
            {children}
        </LanguageContext.Provider>
    );
};