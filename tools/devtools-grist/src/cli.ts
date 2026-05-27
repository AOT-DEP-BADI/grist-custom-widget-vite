#!/usr/bin/env node
import {Command, Help} from 'commander';
import i18next from 'i18next';
import {initI18n} from './utils/i18n/i18n.js';
import {runDev} from './commands/dev/dev.js';
import {runConfig} from './commands/config/config.js';
import {COLOR_PRIMARY, logError, splashscreen} from "./utils/console/output.js";
import {increaseVerbosity, setVerbosity} from "./utils/console/levelVerbosity.js";
import * as ANSI from './utils/console/ansi.js';
import pkg from '../package.json' with {type: 'json'};
import {configStore} from "./commands/config/configurationStore.js";
import {DevtoolsError} from "./commands/shared/DevtoolsError.js";
import {runBuild} from "./commands/build/build.js";

const {STYLE} = ANSI;
const program = new Command();

async function main() {
    await initI18n();

    // Detection of clear flags, and clean process.argv for Commander closed with no error exit
    const clearFlags = ['--clear', '-c'];
    const shouldClear = process.argv.some(arg => clearFlags.includes(arg));
    const isClearConfigEnabled = configStore.get('clearBeforeRunning');
    if (shouldClear || isClearConfigEnabled) {
        process.stdout.write('\x1Bc'); // Nettoie la console
        process.argv = process.argv.filter(arg => !clearFlags.includes(arg));
    }
    const isNoCommandProvided = process.argv.length === 2;
    if (isNoCommandProvided) {
        splashscreen({
            title: `DEVTOOLS GRIST CLI v${pkg.version}`,
            colorPrimary: COLOR_PRIMARY,
            width: 60,
            newlineBefore: true,
            newlineAfter: true
        });
    }

    // Configuration of Commander CLI application
    program
        .name('devtools-grist')
        .version(pkg.version)
        .description(i18next.t('application.description'))
        .helpCommand(false)
        .enablePositionalOptions()
        .passThroughOptions()
        .option('-c, --clear', i18next.t('application.options.clear_description'))
        .configureHelp({
            formatHelp: (cmd, helper) => {
                const baseHelper = new Help();
                const output = baseHelper.formatHelp(cmd, helper);

                const commandsHeading = i18next.t('application.headings.commands_available');
                let customizedOutput = output.replace(/^Commands:/gm, `${commandsHeading}:`);

                customizedOutput = customizedOutput.replace(
                    new RegExp(`^(Usage|Options|Arguments|${commandsHeading}|Available Commands):`, 'gm'),
                    `${STYLE.BOLD}${COLOR_PRIMARY}$1:${STYLE.RESET}`
                );

                customizedOutput = customizedOutput.replace(
                    /(\b(?:default|défaut)\s*[:=-]\s*)([^)\s\]]+)/gi,
                    `${STYLE.FG_YELLOW}$1${STYLE.DIM + STYLE.BOLD}$2${STYLE.RESET}`
                );

                return customizedOutput;
            },
            optionTerm: (option) => {
                return `${STYLE.FG_GREEN}${option.flags}${STYLE.RESET}`;
            },
            subcommandTerm: (cmd) => {
                return `${STYLE.FG_GREEN}${cmd.name()}${STYLE.RESET}`;
            },
            optionDescription: (option) => {
                if (option.flags === '-h, --help') {
                    return i18next.t('application.options.help_description')
                } else if (option.flags === '-V, --version') {
                    return i18next.t('application.options.version_description')
                }

                return option.description;
            }
        });

    // Add 'dev' subcommands
    program
        .command('dev')
        .description(i18next.t('commands.dev.description'))
        .option('--vite-port <port>', i18next.t('commands.dev.option_vite_port', { default: `5173` }), (val) => parseInt(val, 10), 5173)
        .option('--grist-port <port>', i18next.t('commands.dev.option_grist_port', { default: 8484 }), (val) => parseInt(val, 10), 8484)
        .option('-v, --verbose', i18next.t('application.options.verbose_description'), increaseVerbosity, 0)
        .action(async (options) => {
            const globalOpts = program.opts();
            setVerbosity(globalOpts.verbose || 0);

            await runDev(options);
        });

    // Add 'build' subcommand
    program
        .command('build')
        .description(i18next.t('commands.build.description'))
        .addHelpText('after', i18next.t('commands.build.detailed_help', {
            boldDim: STYLE.BOLD + STYLE.DIM,
            reset: STYLE.RESET
        }))
        .option(
            '-s, --build-strategy <strategy>',
            i18next.t('commands.build.option_strategy', { default: 'STANDARD' }),
            (val) => {
                const upper = val.toUpperCase();
                const ALLOWED_BUILD_STRATEGIES = ['SPA', 'STANDARD'];
                if (!ALLOWED_BUILD_STRATEGIES.includes(upper)) {
                    throw new DevtoolsError('INVALID_BUILD_STRATEGY', i18next.t('commands.build.error_invalid_strategy', {
                        strategy: val,
                        allowedStrategies: ALLOWED_BUILD_STRATEGIES.join(', ')
                    }));
                }
                return upper;
            },
            'STANDARD'
        )
        .option('-v, --verbose', i18next.t('application.options.verbose_description'), increaseVerbosity, 0)
        .action(async (options) => {
            const globalOpts = program.opts();
            setVerbosity(globalOpts.verbose || 0);

            await runBuild(options);
        });


    // Add 'config' subcommand
    // Notes: Arguments (action, key, value) are optional to trigger Clack
    program
        .command('config')
        .description(i18next.t('commands.config.description'))
        .argument('[action]',
            `get  | ${i18next.t('commands.config.actions.get')} | Usage: ${STYLE.DIM}config get lang${STYLE.RESET}\n` +
            `set  | ${i18next.t('commands.config.actions.set')} | Usage: ${STYLE.DIM}config set lang fr${STYLE.RESET}\n` +
            `list | ${i18next.t('commands.config.actions.list')} | Usage: ${STYLE.DIM}config list${STYLE.RESET}`)
        .argument('[key]', i18next.t('commands.config.key_description'))
        .argument('[value]', i18next.t('commands.config.value_description'))
        .action(async (action, key, value) => {
            await runConfig(action, key, value);
        });

    // Set verbosity level based on command line options
    program.hook('preAction', (thisCommand, actionCommand) => {
        const rootVerbose = program.opts().verbose;
        const subVerbose = actionCommand.opts().verbose;

        // On prend la valeur la plus haute trouvée (avant ou après la commande)
        const finalVerbosity = Math.max(rootVerbose || 0, subVerbose || 0);
        setVerbosity(finalVerbosity);
    });

    if (process.argv.length === 2) {
        program.outputHelp();
        process.exit(0);
    }

    await program.parseAsync(process.argv);
}

main().catch((err) => {
    const errorPrefix = i18next.isInitialized ? i18next.t('errors.fatal') : '💥 Fatal error. Unable to start the application. A critical error has occurred.';
    logError(errorPrefix, err);
    process.exit(1);
});