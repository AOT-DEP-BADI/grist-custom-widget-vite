import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { splashscreen, title, devtoolsServerInfo, logError, COLOR_PRIMARY } from '../../src/utils/console/output.js';
import * as ANSI from '../../src/utils/console/ansi.js';
import * as levelVerbosity from '../../src/utils/console/levelVerbosity.js';
import os from 'node:os';

const { STYLE } = ANSI;

describe('Output Module - splashscreen', () => {
    let logSpy: any;
    let clearSpy: any;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should display the default splashscreen layout', () => {
        splashscreen();

        expect(logSpy).toHaveBeenCalled();

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');
        expect(printedOutput).toContain('┌' + '─'.repeat(60) + '┐');
        expect(printedOutput).toContain('GRIST-WIDGET');
        expect(printedOutput).toContain('└' + '─'.repeat(60) + '┘');
        expect(printedOutput).toContain(COLOR_PRIMARY); // Utilise la couleur orange par défaut
    });

    it('should respect custom options (title, width, color)', () => {
        const customColor = STYLE.FG_RED;
        splashscreen({
            title: 'TEST-APP',
            width: 40,
            colorPrimary: customColor
        });

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');

        expect(printedOutput).toContain('┌' + '─'.repeat(40) + '┐');
        expect(printedOutput).toContain('TEST-APP');
        expect(printedOutput).toContain(customColor);
    });

    it('should clear the console if clearConsole is true', () => {
        splashscreen({ clearConsole: true });
        expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('should not clear the console if clearConsole is false', () => {
        splashscreen({ clearConsole: false });
        expect(clearSpy).not.toHaveBeenCalled();
    });

    it('should handle leading and trailing newlines options', () => {
        splashscreen({ newlineBefore: true, newlineAfter: true });

        // Vérifie qu'un log vide (newline) a été appelé au début et à la fin
        expect(logSpy.mock.calls[0][0]).toBeUndefined();
        expect(logSpy.mock.calls[logSpy.mock.calls.length - 1][0]).toBeUndefined();
    });
});

describe('Output Module - title', () => {
    let logSpy: any;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should display a correctly formatted section title', () => {
        const message = 'Database Migration';
        title(message, { newlineBefore: false, newlineAfter: false });

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');

        expect(printedOutput).toContain(message);
        expect(printedOutput).toContain('>>');
        expect(printedOutput).toContain('<<');
        expect(printedOutput).toContain(STYLE.FG_WHITE);
    });

    it('should respect custom options (prefix, suffix, styles)', () => {
        title('Custom Section', {
            prefix: '[[',
            suffix: ']]',
            styleText: STYLE.FG_YELLOW,
            stylePrefix: STYLE.FG_MAGENTA,
            newlineBefore: false,
            newlineAfter: false
        });

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');

        expect(printedOutput).toContain('[[');
        expect(printedOutput).toContain(']]');
        expect(printedOutput).toContain('Custom Section');
        expect(printedOutput).toContain(STYLE.FG_YELLOW);
        expect(printedOutput).toContain(STYLE.FG_MAGENTA);
    });

    it('should skip printing completely if onlyVerbose is true and verbose is disabled', () => {
        vi.spyOn(levelVerbosity, 'isVerbose').mockReturnValue(false);

        title('Hidden Title', { onlyVerbose: true });
        expect(logSpy).not.toHaveBeenCalled();
    });
});

describe('Output Module - devtoolsServerInfo', () => {
    let logSpy: any;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log standard local development URLs with default ports', () => {
        vi.spyOn(os, 'networkInterfaces').mockReturnValue({
            lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true, mac: '00:00:00:00:00:00', netmask: '255.0.0.0', cidr: '127.0.0.1/8' }],
            eth0: [{ address: '192.168.1.50', family: 'IPv4', internal: false, mac: '00:00:00:00:00:00', netmask: '255.255.255.0', cidr: '192.168.1.50/24' }]
        });

        devtoolsServerInfo();

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');

        expect(printedOutput).toContain('http://localhost:');
        expect(printedOutput).toContain('5173');
        expect(printedOutput).toContain('192.168.1.50');
        expect(printedOutput).toContain('/manifest.json');
        expect(printedOutput).toContain('8484');

        expect(printedOutput).toContain('Vite local:');
        expect(printedOutput).toContain('Vite network:');
        expect(printedOutput).toContain('Grist manifest widgets:');
        expect(printedOutput).toContain('Grist instance local:');
    });

    it('should respect custom ports for Vite and Grist', () => {
        vi.spyOn(os, 'networkInterfaces').mockReturnValue({});

        devtoolsServerInfo({ vitePort: 3000, gristPort: 9000 });

        const printedOutput = logSpy.mock.calls.map((call: any) => call[0]).join('\n');

        expect(printedOutput).toContain('3000');
        expect(printedOutput).toContain('9000');
        expect(printedOutput).not.toContain('5173');
        expect(printedOutput).not.toContain('8484');
    });
});

describe('Output Module - logError', () => {
    let errorSpy: any;

    beforeEach(() => {
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log a custom message with correct ANSI styling', () => {
        logError('Unable to create vite web server.');

        expect(errorSpy).toHaveBeenCalled();

        const printedOutput = errorSpy.mock.calls.map((call: any) => call.join(' ')).join('\n');

        expect(printedOutput).toContain('Unable to create vite web server.');
        expect(printedOutput).toContain(STYLE.BG_RED);
        expect(printedOutput).toContain(STYLE.FG_WHITE);
    });

    it('should extract and append error details with custom box drawings when an Error object is passed', () => {
        const mockError = new Error('Port 5173 is already in use');
        mockError.stack = 'Error: Port 5173 is already in use\n    at main.js:1:1';

        logError('Vite bundle crash', mockError);

        const printedOutput = errorSpy.mock.calls.map((call: any) => call.join(' ')).join('\n');

        expect(printedOutput).toContain('Vite bundle crash');
        expect(printedOutput).toContain('│ Error: Port 5173 is already in use');
        expect(printedOutput).toContain('│     at main.js:1:1');
        expect(printedOutput).toContain('└─◇');
        expect(printedOutput).toContain(STYLE.FG_RED + STYLE.BOLD);
    });

    it('should handle optional extra arguments seamlessly', () => {
        logError('Build failed', undefined, 'Context extra info');

        const printedOutput = errorSpy.mock.calls.map((call: any) => call.join(' ')).join('\n');

        expect(printedOutput).toContain('Build failed');
        expect(printedOutput).toContain('Context extra info');
    });
});