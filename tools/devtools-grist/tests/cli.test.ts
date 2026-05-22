import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import path from 'node:path';

describe('devtools-grist CLI application', () => {

    // Path to your compiled binary
    const CLI_PATH = path.resolve(__dirname, '../dist/cli.mjs');

    it('should display default help and exit with code 1', async () => {
        try {
            await execa('node', [CLI_PATH]);
        } catch (error: any) {
            // Framework Execa throw an error if the exit code is not 0
            expect(error.exitCode).toBe(1);
        }
    });

    it('should fail gracefully in a directory without package.json', async () => {
        try {
            await execa('node', [CLI_PATH, 'dev'], { cwd: '..' });
        } catch (error: any) {
            expect(error.exitCode).toBe(1);
            expect(error.stderr).toContain('Error: Unable to find or read the package.json');
        }
    });

});