import i18next from 'i18next';
import fr from '../../locales/fr.json' with { type: 'json' };
import en from '../../locales/en.json' with { type: 'json' };
import { configStore } from "../../commands/config/configurationStore.js";

export const SUPPORTED_LANGUAGES = [
    'fr',
    'en'
] as const;

export type Language = typeof SUPPORTED_LANGUAGES[number];

export async function initI18n(): Promise<void> {
    const currentLang = getSystemLanguage();

    await i18next.init({
        lng: currentLang,
        fallbackLng: 'en',
        resources: {
            fr: { translation: fr },
            en: { translation: en }
        },
        interpolation: {
            escapeValue: false // Not needed for a CLI application
        }
    });
}

/**
 * Determines the user's language based on the following priority:
 * 1. Environment variables (LANG or LC_ALL)
 * 2. User's persistent configuration
 */
export function getSystemLanguage(): Language {
    const envLang = process.env.LANG || process.env.LC_ALL;
    if (envLang) {
        const shortLang = envLang.split('_')[0].toLowerCase() as Language;
        if (SUPPORTED_LANGUAGES.includes(shortLang)) {
            return shortLang;
        }
    }

    return configStore.get('lang');
}

export { i18next as t };