// src/context/LanguageContext.tsx
import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import i18n from '../i18n'; // Import your i18n configuration
import { translateKeywords } from '../services/translationService';

export type LanguageCode = 'en' | 'dzo';

interface LanguageContextType {
    currentLanguage: LanguageCode;
    changeLanguage: (newLanguage: LanguageCode) => void;
    translateSymbolBatch: (texts: string[], targetLang?: LanguageCode) => Promise<string[]>;
    isTranslatingSymbols: boolean;
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
    // Initialize state directly from i18next instance (which defaults to 'en')
    const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => i18n.language as LanguageCode || 'en');
    const [isTranslatingSymbols, setIsTranslatingSymbols] = useState<boolean>(false);

    // Effect to sync context state when i18next language changes
    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            console.log(`LanguageContext: Listener notified of language change to ${lng}`);
            setCurrentLanguage(lng as LanguageCode);
        };
        i18n.on('languageChanged', handleLanguageChanged);

        // Ensure initial state sync one more time after listener is attached
        setCurrentLanguage(i18n.language as LanguageCode || 'en');

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []); // Empty dependency array - runs once

    // Function to change language via i18next
    const changeLanguage = useCallback((newLanguage: LanguageCode) => {
        console.log(`LanguageContext: User requested change to ${newLanguage} via i18next`);
        // Only change if different to prevent unnecessary updates
        if (newLanguage !== currentLanguage) {
            i18n.changeLanguage(newLanguage);
            // The 'languageChanged' event listener above will update the context state
        } else {
            console.log(`LanguageContext: Language already set to ${newLanguage}, no change needed.`);
        }
    }, [currentLanguage]); // Depend on currentLanguage to avoid unnecessary calls

    // Function to translate dynamic symbols via API
    const translateSymbolBatch = useCallback(async (texts: string[], targetLang?: LanguageCode): Promise<string[]> => {
        const langToUse = targetLang || currentLanguage;
        if (!texts || texts.length === 0 || langToUse === 'en') {
            return texts;
        }

        const validTexts = texts.filter(t => t && t.trim() !== '');
        if (validTexts.length === 0) return texts;

        setIsTranslatingSymbols(true);
        try {
            const results = await translateKeywords(validTexts, langToUse); // Calls your API

            if (results && results.length === validTexts.length) {
                let resultIdx = 0;
                return texts.map(originalText => {
                    if (originalText && originalText.trim() !== '') {
                        // Ensure we don't go out of bounds if API response is shorter
                        return resultIdx < results.length ? results[resultIdx++] : originalText;
                    }
                    return originalText;
                });
            }
            console.warn("LanguageContext: translateSymbolBatch returning fallback due to result mismatch or error.");
            return texts; // Fallback
        } catch (error) {
            console.error("LanguageContext: Error translating symbol batch:", error);
            return texts; // Fallback
        } finally {
            // Use setTimeout to potentially avoid flicker if state update is too fast
            setTimeout(() => setIsTranslatingSymbols(false), 50);
        }
    }, [currentLanguage]); // Depend only on currentLanguage


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