import { useState, useEffect } from 'react';
import { getCurrentLanguage } from '../lib/i18n';
import type { Language } from '../lib/i18n';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  return language;
}
