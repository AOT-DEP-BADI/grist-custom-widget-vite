import { loadProjectConfig, logProjectConfig } from "./DevConfig.js";
import type { ProjectConfig } from "./type.js";
import { DevtoolsError } from "../shared/DevtoolsError.js";
import {COLOR_PRIMARY, devtoolsServerInfo, logError, logVerbose, splashscreen, title} from "../../utils/console/output.js";
import type { ViteDevServer } from "vite";
import { startGristDocker, startViteServer } from "./DevTasks.js";
import * as ANSI from "../../utils/console/ansi.js";
import { execa } from "execa";
import readline from "readline";
import i18next from "i18next";
import {isVerbose, setVerbosity} from "../../utils/console/levelVerbosity.js";

const { STYLE } = ANSI;

interface DevOptions {
    verbose: number;
    vitePort: number;
    gristPort: number;
}

let projectConfig: ProjectConfig | null = null;
let viteServer: ViteDevServer | null = null;
let isCleaningUp: boolean = false;

export async function runDev(options: DevOptions): Promise<void> {
    setVerbosity(options.verbose);

    if (process.platform === "win32") {
        // Windows workaround hack
        // We use readline to capture Ctrl+C directly from the TTY input stream.
        // This prevents Windows from prematurely releasing the PowerShell prompt.
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on("SIGINT", () => {
            // Manually forward the signal to our global cleanup function
            cleanup("SIGINT");
        });
    } else {
        // Standard behavior for Linux / macOS
        process.on('SIGINT', () => cleanup("SIGINT"));
        process.on('SIGTERM', () => cleanup("SIGTERM"));
    }

    process.on('uncaughtException', async (error) => {
        logError(i18next.t('commands.dev.error_unexpected'), error);
        await cleanup("UNCAUGHT_EXCEPTION");
    });

    process.on('unhandledRejection', async (reason) => {
        logError(i18next.t('commands.dev.error_unexpected'), reason);
        await cleanup("UNHANDLED_REJECTION");
    });

    try {
        splashscreen({
            title: 'DEVTOOLS GRIST CUSTOM WIDGET • RUNNING DEV',
            colorPrimary: COLOR_PRIMARY,
            width: 60,
            newlineBefore: false
        });

        // Load and display project configuration
        projectConfig = await loadProjectConfig();
        logProjectConfig(projectConfig);

        // Start local Vite.js development server
        viteServer = await startViteServer(options.vitePort);
        const viteActualPort = viteServer.config.server.port ?? options.vitePort;

        // Start Grist instance via Docker Compose
        const gristActualPort = await startGristDocker(projectConfig, viteActualPort, options.gristPort);

        // Success notification and display localized access URLs
        title(i18next.t('commands.dev.ready'), { colorPrimary: COLOR_PRIMARY, newlineBefore: true });
        devtoolsServerInfo({
            vitePort: viteActualPort,
            gristPort: gristActualPort
        });

        if (viteServer) {
            console.log();
            viteServer.bindCLIShortcuts({ print: true });
            console.log();

            // Intercept close for Vite shortcut manual exits (e.g. 'q')
            const originalViteClose = viteServer.close.bind(viteServer);
            viteServer.close = async () => {
                if (!isCleaningUp) {
                    await cleanup("VITE_QUIT");
                }
                await originalViteClose();
            };
        }
    } catch (error) {
        if (error instanceof DevtoolsError) {
            logError(error.message, error.originalError);
        } else {
            logError(i18next.t('commands.dev.error_unexpected'), error);
        }

        await cleanup("ERROR");
    }
}

async function cleanup(reason: string = "EXIT") {
    if (isCleaningUp) {
        return;
    }
    isCleaningUp = true;

    title(i18next.t('commands.dev.shutdown'), { colorPrimary: COLOR_PRIMARY, newlineBefore: true });
    logVerbose(`${STYLE.DIM}${i18next.t('commands.dev.shutdown_cleanup_reason', { reason })}${STYLE.RESET}`);

    // Stop Vite development server
    if (viteServer) {
        logVerbose(`${STYLE.DIM}${i18next.t('commands.dev.shutdown_vite')}${STYLE.RESET}`);
        await viteServer.close().catch((error) => logError(i18next.t('commands.dev.error_stopping_vite'), error));
    }

    // Stop and remove Docker containers via Execa
    if (projectConfig) {
        try {
            logVerbose(`${STYLE.DIM}${i18next.t('commands.dev.shutdown_docker')}${STYLE.RESET}`);
            await execa('docker', [
                'compose',
                '-f', projectConfig.dockerComposeFilePath,
                '-p', projectConfig.dockerContainerName,
                'down'
            ], {
                stdio: ['ignore', isVerbose() ? 'inherit' : 'ignore', isVerbose() ? 'inherit' : 'ignore'],
                cleanup: true,
                forceKillAfterDelay: 10000
            });
            logVerbose('');

            console.log(` ${STYLE.FG_GREEN}✓${STYLE.RESET} ${i18next.t('commands.dev.shutdown_success')}`);
        } catch (error: any) {
            if (error.isForcefullyTerminated) {
                logError(i18next.t('commands.dev.error_timeout_docker'));
            } else if (error.isTerminated) {
                logError(i18next.t('commands.dev.error_signal_docker', { signal: error.signal }));
            } else {
                logError(i18next.t('commands.dev.error_failed_docker'), error);
            }
        }
    }

    console.log();
    process.exit(0);
}