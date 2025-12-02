// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  direction: 'ltr' | 'rtl';
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to get initial language (runs on client only)
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'de'; // Default to German for SSR
  
  try {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de' || browserLang === 'fr' || browserLang === 'ar' || browserLang === 'en') {
      return browserLang as Language;
    }
  } catch (e) {
    // localStorage might not be available
  }
  return 'de'; // Default to German
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de'); // Start with German
  const [isLoaded, setIsLoaded] = useState(false);

  // Load language on mount
  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguageState(initialLang);
    setIsLoaded(true);
  }, []);

  // Update document direction for RTL languages
  useEffect(() => {
    if (!isLoaded) return;
    
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isLoaded]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      // localStorage might not be available
    }
  };

  // Memoize the translation function to use the current language
  const t = useMemo(() => {
    return (key: TranslationKey): string => {
      const currentTranslations = translations[language];
      const fallbackTranslations = translations.de; // Fallback to German
      return currentTranslations?.[key as keyof typeof currentTranslations] 
        || fallbackTranslations?.[key as keyof typeof fallbackTranslations] 
        || key;
    };
  }, [language]);

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
