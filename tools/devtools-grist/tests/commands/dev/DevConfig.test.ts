import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { loadProjectConfig } from "../../../src/commands/dev/DevConfig.js";
import { DevtoolsError } from "../../../src/commands/shared/DevtoolsError.js";

vi.mock('node:fs/promises', () => ({
    default: {
        readFile: vi.fn(),
    },
}));

// Global mock for import.meta.resolve because Vitest/Node does not allow easy on-the-fly modification
vi.stubGlobal('import', {
    meta: {
        resolve: (specifier: string) => {
            if (specifier.includes('@aot-dep-badi/devtools-grist')) {
                return 'file:///mocked/path/to/node_modules/@aot-dep-badi/devtools-grist/docker-compose.yml';
            }
            throw new Error('Module not found');
        },
    },
});

describe('DevConfig - loadProjectConfig', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Force the working directory to precisely control the package.json location
        vi.spyOn(process, 'cwd').mockReturnValue('/mocked/project/root');
    });

    it('should successfully load and parse a valid configuration', async () => {
        const fakePackageJson = {
            name: '@my-scope/awesome-widget',
            version: '1.0.0',
        };

        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(fakePackageJson));

        const config = await loadProjectConfig();

        expect(config.projectName).toBe('@my-scope/awesome-widget');
        expect(config.projectVersion).toBe('1.0.0');
        // The container name must sanitize special characters according to your regex
        expect(config.dockerContainerName).toBe('my_scope_awesome_widget');
        expect(config.dockerComposeFilePath).toContain('docker-compose.yml');
    });

    it('should throw a DevtoolsError with READ_PACKAGE_JSON_FAILED code if package.json is missing or corrupted', async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file or directory'));

        await expect(loadProjectConfig()).rejects.toThrow(DevtoolsError);

        try {
            await loadProjectConfig();
        } catch (error: any) {
            expect(error.code).toBe('READ_PACKAGE_JSON_FAILED');
            expect(error.message).toContain('Unable to find or read the package.json');
        }
    });

    it('should throw a DevtoolsError with DOCKER_RESOLVE_PATH_FAILED code if docker-compose cannot be resolved', async () => {
        // Valid mock for package.json
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ name: 'test', version: '1.0.0' }));

        // Temporarily override the global stub to simulate a resolution failure
        vi.stubGlobal('import', {
            meta: {
                resolve: () => { throw new Error('Cannot find module'); },
            },
        });

        try {
            await loadProjectConfig();
        } catch (error: any) {
            expect(error).toBeInstanceOf(DevtoolsError);
            expect(error.code).toBe('DOCKER_RESOLVE_PATH_FAILED');
        }
    });
});