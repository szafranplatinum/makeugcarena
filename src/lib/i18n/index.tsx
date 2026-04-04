'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, Record<string, unknown>> = { en, zh };

/**
 * Get a nested value from an object using dot notation
 * e.g., get(obj, 'create.step.script') → obj.create.step.script
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path; // Return the key as fallback
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

const LOCALE_STORAGE_KEY = 'makeugc_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Load saved locale on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (saved && (saved === 'en' || saved === 'zh')) {
        setLocaleState(saved);
      } else {
        // Auto-detect from browser
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('zh')) {
          setLocaleState('zh');
        }
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(
        translations[locale] as Record<string, unknown>,
        key
      );
      // Fallback to English if key not found in current locale
      if (value === key && locale !== 'en') {
        value = getNestedValue(
          translations.en as Record<string, unknown>,
          key
        );
      }
      // Replace template params like {count}
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(`{${paramKey}}`, String(paramValue));
        }
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access i18n translation function and locale
 *
 * Usage:
 *   const { t, locale, setLocale } = useI18n();
 *   <h1>{t('dashboard.welcome')}</h1>
 *   <button onClick={() => setLocale('zh')}>中文</button>
 */
export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Language switcher component
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 ${className || ''}`}
      title={locale === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <span className="text-base">{locale === 'en' ? '🇨🇳' : '🇺🇸'}</span>
      <span>{locale === 'en' ? '中文' : 'EN'}</span>
    </button>
  );
}
