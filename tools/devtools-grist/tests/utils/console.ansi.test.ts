import { describe, it, expect } from 'vitest';
import * as ANSI from '../../src/utils/console/ansi.js';
const { STYLE } = ANSI;

describe('ANSI styles', () => {

    it('should generate a correct FG_RGB escape sequence', () => {
        const result = STYLE.FG_RGB(255, 165, 0);
        expect(result).toBe('\x1b[38;2;255;165;0m');
    });

    it('should generate a correct BG_RGB escape sequence', () => {
        const result = STYLE.BG_RGB(10, 20, 30);
        expect(result).toBe('\x1b[48;2;10;20;30m');
    });

    it('should wrap text with BOLD style', () => {
        const result = ANSI.BOLD('Hello');
        expect(result).toBe(`${STYLE.BOLD}Hello${STYLE.RESET}`);
    });

});

describe('ANSI LINK method', () => {
    const url = 'https://google.com';

    it('should generate a clickable link with default cyan color and no underline', () => {
        const url = 'http://localhost:5173';
        const result = ANSI.LINK(url);

        expect(result).toContain(`\x1b]8;;${url}\x1b\\`);
        expect(result).toContain(ANSI.STYLE.FG_CYAN);
        expect(result).not.toContain(ANSI.STYLE.UNDERLINE);
        expect(result).toContain(`${ANSI.STYLE.RESET}\x1b]8;;\x1b\\`);
    });

    it('should generate a clickable link with custom color and underline when options are provided', () => {
        const url = 'http://localhost:5173';
        const result = ANSI.LINK(url, undefined, { color: ANSI.STYLE.FG_BLUE, underline: true });

        expect(result).toContain(`\x1b]8;;${url}\x1b\\`);
        expect(result).toContain(ANSI.STYLE.FG_BLUE);
        expect(result).toContain(ANSI.STYLE.UNDERLINE);
        expect(result).toContain(`${ANSI.STYLE.RESET}\x1b]8;;\x1b\\`);
    });

    it('should allow custom text instead of URL', () => {
        const text = 'More information here';
        const result = ANSI.LINK(url, text);
        expect(result).toContain(text);
        expect(result).not.toContain(`${ANSI.STYLE.FG_BLUE}${url}`);
    });

    it('should allow changing the color of the link', () => {
        const result = ANSI.LINK(url, url, { color: ANSI.STYLE.FG_RED });
        expect(result).toContain(ANSI.STYLE.FG_RED);
        expect(result).not.toContain(ANSI.STYLE.FG_BLUE);
    });
});