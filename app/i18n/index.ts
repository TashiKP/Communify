// src/i18n/index.ts
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import enTranslation from '../locales/en/translation.json';
import dzoTranslation from '../locales/dzo/translation.json';

// Define resources
const resources = {
  en: {translation: enTranslation},
  dzo: {translation: dzoTranslation},
};

console.log('i18n: Attempting to initialize...'); // Log before init

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init(
    {
      resources,
      lng: 'en', // Initialize with English
      fallbackLng: 'en', // Fallback to English if a key is missing in the current language
      compatibilityJSON: 'v4', // For current i18next versions
      interpolation: {
        escapeValue: false, // React already protects from XSS
      },
      react: {
        useSuspense: false, // Set to false for React Native if not using Suspense for translations
      },
    },
    (err, t_instance_from_callback) => {
      // Callback function for init
      if (err) {
        return console.error('🔴 i18n: Initialization FAILED', err);
      }
      // Log success and key details
      console.log('🟢 i18n: Initialization SUCCESSFUL!');
      console.log('   i18n instance language after init:', i18n.language); // Should be 'en' initially
      console.log(
        '   t_instance from callback (should be function):',
        typeof t_instance_from_callback,
      );
    },
  );

export default i18n;
