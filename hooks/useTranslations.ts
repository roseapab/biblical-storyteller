
import { useLanguage } from './useLanguage';
import { en } from '../locales/en';
import { es } from '../locales/es';

type Translations = typeof en;

const translations: { [key: string]: Translations } = { en, es };

export const useTranslations = () => {
    const { lang } = useLanguage();
    
    return (key: keyof Translations, replacements?: { [key: string]: string | number }): string => {
        const locale = lang.startsWith('es') ? 'es' : 'en';
        let translation = translations[locale]?.[key] || String(key);

        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = translation.replace(new RegExp(`{{${rKey}}}`, 'g'), String(replacements[rKey]));
            });
        }
        return translation;
    };
};
