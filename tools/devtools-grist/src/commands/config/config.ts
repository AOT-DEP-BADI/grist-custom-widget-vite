import {configStore, type ConfigStoreSchema} from './configurationStore.js';
import i18next from 'i18next';
import { type Language, SUPPORTED_LANGUAGES } from "../../utils/i18n/i18n.js";
import * as p from '@clack/prompts';
import { STYLE } from "../../utils/console/ansi.js";
import { COLOR_PRIMARY } from "../../utils/console/output.js";

type configKey = keyof ConfigStoreSchema;
const configTranslations = new Map<configKey, string>([
    ['lang', 'commands.config.fields.lang'],
    ['clearBeforeRunning', 'commands.config.fields.clearBeforeRunning']
]);

function logKeyValueConfiguration(cfgKey: string, cfgVal: any): void {
    const colorArrow = STYLE.FG_RGB(100, 100, 100);
    const translationKey = configTranslations.get(cfgKey as configKey);
    const description = translationKey ? `\n     ${STYLE.DIM}└─ ${i18next.t(translationKey)}${STYLE.RESET}` : '';

    console.log(`  ${colorArrow}➜${STYLE.RESET} ${STYLE.BOLD}${cfgKey}${STYLE.RESET}: ${STYLE.FG_GREEN}${cfgVal}${STYLE.RESET}${description}`);
}

/**
 * Main entry point for the config command handler.
 */
export async function runConfig(action?: string, key?: string, value?: string): Promise<void> {
    // CASE 1: Interactive Mode using Clack (No arguments provided)
    if (!action) {
        await runInteractiveConfig();
        return;
    }

    // CASE 2: Standard script Mode (Arguments provided via CLI)
    switch (action) {
        case 'list':
            handleListAction();
            break;

        case 'get':
            handleGetAction(key);
            break;

        case 'set':
            handleSetAction(key, value);
            break;

        default:
            console.error(i18next.t('commands.config.invalid_action'));
            break;
    }
}

/**
 * Handles the 'list' action to output all stored keys and values.
 */
function handleListAction(): void {
    console.log(`${COLOR_PRIMARY}${i18next.t('commands.config.actions.list_title')}${STYLE.RESET}`);
    Object.entries(configStore.store).forEach(([cfgKey, cfgVal]) => {
        console.log();
        logKeyValueConfiguration(cfgKey, cfgVal);
    });
    console.log();
}

/**
 * Handles the 'get' action for a single specific configuration key.
 */
function handleGetAction(key?: string): void {
    const action = `${STYLE.BOLD}config list${STYLE.RESET}`;

    if (!key) {
        console.error(i18next.t('commands.config.error_missing_key', { action }) + '\n');
        return;
    }

    const val = configStore.get(key as any);
    if (val !== undefined) {
        logKeyValueConfiguration(key, val);
    } else {
        key = `${STYLE.FG_GREEN}${key}${STYLE.RESET}`;
        console.error(i18next.t('commands.config.error_key_not_found', { key, action }));
    }
}

/**
 * Handles the 'set' action by routing to specific key validators.
 */
function handleSetAction(key?: string, value?: string): void {
    if (!key || !value) {
        console.error(!key ? i18next.t('commands.config.missing_key') : i18next.t('commands.config.missing_value', { key }));
        return;
    }

    switch (key) {
        case 'lang':
            setLangConfiguration(value);
            break;

        case 'clearBeforeRunning':
            setClearBeforeRunningConfiguration(value);
            break;

        default:
            console.log(i18next.t('commands.config.not_found', { key }));
            break;
    }
}

/**
 * Validates and updates the application language configuration.
 */
function setLangConfiguration(value: string): void {
    if (!SUPPORTED_LANGUAGES.includes(value as Language)) {
        console.error(i18next.t('commands.config.invalid_lang', { languages: SUPPORTED_LANGUAGES.join(', ') }));
        return;
    }
    configStore.set('lang', value as Language);
    console.log(i18next.t('commands.config.success_set', { key: 'lang', value }));
}

/**
 * Validates and updates the automatic terminal clearing configuration.
 */
function setClearBeforeRunningConfiguration(value: string): void {
    const normalizedValue = value.toLowerCase();

    if (normalizedValue !== 'true' && normalizedValue !== 'false') {
        console.error(i18next.t('commands.config.invalid_boolean', { key: 'clearBeforeRunning', value }));
        process.exit(1);
    }

    const boolValue = normalizedValue === 'true';
    configStore.set('clearBeforeRunning', boolValue);
    console.log(i18next.t('commands.config.success_set', { key: 'clearBeforeRunning', value: boolValue }));
}

/**
 * Interactive Clack CLI wizard configuration prompt flow.
 */
async function runInteractiveConfig(): Promise<void> {
    console.log(); // Terminal vertical layout spacing
    p.intro(`⚙️  ${i18next.t('commands.config.help_header')}`);

    const settings = await p.group(
        {
            action: () =>
                p.select({
                    message: i18next.t('usage.header'),
                    options: [
                        { value: 'change_lang', label: '🌐 Change language' },
                        { value: 'toggle_clear', label: '🧹 Toggle clear screen before running' },
                        { value: 'view', label: '👀 View current config' },
                        { value: 'quit', label: '❌ Quit' },
                    ],
                }),
            lang: ({ results }) => {
                if (results.action !== 'change_lang') return;
                return p.select({
                    message: 'Select your language',
                    options: SUPPORTED_LANGUAGES.map(lang => ({
                        value: lang,
                        label: lang.toUpperCase()
                    })),
                    initialValue: configStore.get('lang')
                });
            },
            clearBeforeRunning: ({ results }) => {
                if (results.action !== 'toggle_clear') return;
                return p.select({
                    message: 'Clear screen before running?',
                    options: [
                        { value: true, label: 'Yes, clear console' },
                        { value: false, label: 'No, keep history' }
                    ],
                    initialValue: configStore.get('clearBeforeRunning')
                });
            }
        },
        {
            onCancel: () => {
                p.cancel('Operation cancelled');
                process.exit(0);
            },
        }
    );

    if (settings.action === 'quit') {
        p.outro('Goodbye!');
        return;
    }

    if (settings.action === 'view') {
        let summary = '';
        Object.entries(configStore.store).forEach(([cfgKey, cfgVal]) => {
            summary += `${cfgKey}: ${cfgVal}\n`;
        });
        p.note(summary.trim(), i18next.t('commands.config.list_title'));
        p.outro('End of view.');
        return;
    }

    if (settings.action === 'change_lang' && settings.lang) {
        const newLang = settings.lang as Language;
        configStore.set('lang', newLang);
        await i18next.changeLanguage(newLang);
        p.outro(i18next.t('commands.config.success_set', { key: 'lang', value: newLang }));
    }

    if (settings.action === 'toggle_clear' && settings.clearBeforeRunning !== undefined) {
        configStore.set('clearBeforeRunning', settings.clearBeforeRunning);
        p.outro(i18next.t('commands.config.success_set', { key: 'clearBeforeRunning', value: settings.clearBeforeRunning }));
    }
}