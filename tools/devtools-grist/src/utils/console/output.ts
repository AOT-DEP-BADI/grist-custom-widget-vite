import os from 'node:os';
import { isVerbose, getVerbosity } from './levelVerbosity.js';
import * as ANSI from './ansi.js';

const {STYLE} = ANSI;

export const COLOR_PRIMARY = STYLE.FG_RGB(255, 135, 0);

export function logVerbose(requiredLevel: number | unknown, ...args: unknown[]): void {
    if (typeof requiredLevel === 'number') {
        if (getVerbosity() >= requiredLevel) {
            console.log(...args);
        }
    } else {
        if (isVerbose()) {
            console.log(requiredLevel, ...args);
        }
    }
}

export function logError(message: string, error?: unknown, ...args: unknown[]): void {
    // Main error header line
    console.error(`${STYLE.BG_RED + STYLE.FG_WHITE}${message}${STYLE.RESET}`);

    // If an error object or extra details are provided, print them cleanly indented
    if (error !== undefined && error !== null) {
        const rawDetails = error instanceof Error
            ? error.stack || error.message
            : String(error);

        let formattedDetails = rawDetails
            .split('\n')
            .map(line => `│ ${line}`)
            .join('\n');

        formattedDetails = formattedDetails + "\n└─◇";

        console.error(`${STYLE.FG_RED + STYLE.BOLD}${formattedDetails}${STYLE.RESET}`);
    }

    // Print any remaining arguments if present
    if (args.length > 0) {
        process.stderr.write(STYLE.DIM);
        console.error(...args);
        process.stderr.write(STYLE.RESET);
    }
    console.error('');
}

interface SplashscreenOptions {
    title?: string;
    colorPrimary?: string;
    width?: number;
    clearConsole?: boolean;
    newlineBefore?: boolean;
    newlineAfter?: boolean;
}

export const splashscreen = (options: SplashscreenOptions = {}): void => {
    const {
        title = "GRIST-WIDGET",
        colorPrimary = COLOR_PRIMARY,
        width = 60,
        clearConsole = false,
        newlineBefore = false,
        newlineAfter = false,
    } = options;

    const line = '─'.repeat(width);
    const colorBorder = colorPrimary;

    const colorText = colorPrimary + STYLE.BOLD;
    const spaces = width - title.length;
    const padLeft = Math.floor(spaces / 2);
    const padRight = spaces - padLeft;
    const centeredTitle = ' '.repeat(padLeft) + colorText + title + STYLE.RESET + ' '.repeat(padRight);

    if (clearConsole) {
        console.clear();
    }

    if (newlineBefore) console.log();

    [
        `${colorBorder}┌${line}┐${STYLE.RESET}`,
        `${colorBorder}│${STYLE.RESET}${' '.repeat(width)}${colorBorder}│${STYLE.RESET}`,
        `${colorBorder}│${centeredTitle}${colorBorder}│${STYLE.RESET}`,
        `${colorBorder}│${STYLE.RESET}${' '.repeat(width)}${colorBorder}│${STYLE.RESET}`,
        `${colorBorder}└${line}┘${STYLE.RESET}`,
    ].forEach(line => console.log(line));

    if (newlineAfter) console.log();
};

interface TitleOptions {
    prefix?: string;
    suffix?: string;
    colorPrimary?: string;
    stylePrefix?: string;
    styleText?: string;
    styleBorder?: string;
    newlineBefore?: boolean;
    newlineAfter?: boolean;
    onlyVerbose?: boolean;
}

export const title = (message: string, options: TitleOptions = {}): void => {
    const {
        prefix = ">>",
        suffix = "<<",
        colorPrimary = COLOR_PRIMARY,
        stylePrefix = colorPrimary + STYLE.BOLD,
        styleText = STYLE.FG_WHITE,
        styleBorder = colorPrimary,
        newlineBefore = true,
        newlineAfter = true,
        onlyVerbose = false
    } = options;

    if (onlyVerbose && !isVerbose()) {
        return;
    }

    const lineChar = '─';
    const fullMessage = `${prefix} ${message} ${suffix}`;
    const border = lineChar.repeat(fullMessage.length);

    if (newlineBefore) console.log();

    logVerbose(`${styleBorder}${border}${STYLE.RESET}`);
    console.log(`${stylePrefix}${prefix}${STYLE.RESET}${styleText} ${message} ${STYLE.RESET}${stylePrefix}${suffix}${STYLE.RESET}`);
    logVerbose(`${styleBorder}${border}${STYLE.RESET}`);

    if (newlineAfter) console.log();
};

interface DevtoolsServerInfoOptions {
    vitePort?: number|string;
    gristPort?: number|string;
}

export const devtoolsServerInfo = (options: DevtoolsServerInfoOptions = {}): void => {
    const {
        vitePort = 5173,
        gristPort = 8484,
    } = options;

    const getNetworkIps = (): string[] => {
        const interfaces = os.networkInterfaces();
        const addresses: string[] = [];

        for (const name of Object.keys(interfaces)) {
            const currentInterface = interfaces[name];
            if (!currentInterface) continue;

            for (const interfaceMetadatas of currentInterface) {
                // Keep only IPv4 and ignore localhost (127.0.0.1)
                if (interfaceMetadatas.family === 'IPv4' && !interfaceMetadatas.internal) {
                    addresses.push(interfaceMetadatas.address);
                }
            }
        }
        return addresses;
    };

    const networkIps = getNetworkIps();
    const arrow = `${STYLE.FG_RGB(100, 100, 100)}➜${STYLE.RESET}`;
    const bold = STYLE.BOLD;
    const cyan = STYLE.FG_CYAN;
    const bCyan = STYLE.FG_BRIGHT_CYAN;
    const reset = STYLE.RESET;

    console.log(`  ${arrow}  ${bold}Vite local:${reset}   ${cyan}http://localhost:${bCyan}${vitePort}${reset}${cyan}/${reset}`);
    networkIps.forEach(ip => {
        console.log(`  ${arrow}  ${bold}Vite network:${reset} ${cyan}http://${ip}:${bCyan}${vitePort}${reset}${cyan}/${reset}`);
    });
    console.log(`  ${arrow}  ${bold}Grist manifest widgets:${reset} ${cyan}http://localhost:${bCyan}${vitePort}${reset}${cyan}/manifest.json${reset}`);
    console.log(`  ${arrow}  ${bold}Grist instance local:${reset}   ${cyan}http://localhost:${bCyan}${gristPort}${reset}${cyan}/${reset}`);
};