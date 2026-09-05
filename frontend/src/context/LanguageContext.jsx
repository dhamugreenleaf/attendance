import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import translations from '../i18n/translations';

const LANGUAGE_KEY = '@workaxis_language';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  // Load saved language on startup
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (saved && translations[saved]) {
          setLanguage(saved);
        }
      } catch (_) {
        // fallback to English
      } finally {
        setIsLanguageLoaded(true);
      }
    })();
  }, []);

  const changeLanguage = useCallback(async (code) => {
    if (!translations[code]) return;
    setLanguage(code);
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, code);
    } catch (_) {}
  }, []);

  /**
   * t(key) — translate a key to the current language.
   * Falls back to English if the key is missing in the selected language.
   */
  const t = useCallback(
    (key) => {
      const langMap = translations[language] || translations['en'];
      return langMap[key] ?? translations['en'][key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, languages: LANGUAGES, t, isLanguageLoaded }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
