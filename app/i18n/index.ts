// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestAvailableLanguage, getLocales } from 'react-native-localize';

// Import translation files
import enTranslation from '../locales/en/translation.json';
import dzoTranslation from '../locales/dzo/translation.json';

// Define resources
const resources = {
  en: {
    translation: enTranslation,
  },
  dzo: {
    translation: dzoTranslation,
  },
};

// Find best available language from device settings
const getInitialLanguage = () => {
  const locales = getLocales();
  if (locales && locales.length > 0) {
    const bestMatch = findBestAvailableLanguage(['en', 'dzo']);
    return bestMatch?.languageTag || 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    compatibilityJSON: 'v4', // Use 'v4' for newer i18next versions
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;