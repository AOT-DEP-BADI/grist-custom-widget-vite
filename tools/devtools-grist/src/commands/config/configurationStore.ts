import Conf from 'conf';
import type {Language} from "../../utils/i18n/i18n.js";

export interface ConfigStoreSchema {
    lang: Language;
    clearBeforeRunning: boolean;
}

// Initialisation du magasin de configuration local
export const configStore = new Conf<ConfigStoreSchema>({
    projectName: '@aot-dep-badi_devtools-grist',
    defaults: {
        lang: 'en', // Langue par défaut à la première installation
        clearBeforeRunning: false // Clear the screen console before running
    }
});