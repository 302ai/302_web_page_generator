import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './src/lib/locales/en.json';
import zhTranslation from './src/lib/locales/zh.json';
import jaTranslation from './src/lib/locales/ja.json';

const resources = {
    en: {
        translation: enTranslation
    },
    zh: {
        translation: zhTranslation
    },
    ja: {
        translation: jaTranslation
    }
};

i18n
    .use(initReactI18next) 
    .init({
        resources,
        lng: 'en', 
        fallbackLng: 'en', 
        interpolation: {
            escapeValue: false 
        }
    });

export default i18n;