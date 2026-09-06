import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = 'clinic_language';

// English is the product's default language per the client's requirement —
// only an explicit prior choice (saved below) switches it to Arabic.
const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage = savedLanguage === 'ar' || savedLanguage === 'en' ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lang: 'en' | 'ar') {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Apply the correct dir/lang attribute immediately on load, before React
// even renders — avoids a flash of the wrong direction.
document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLanguage;

export default i18n;
