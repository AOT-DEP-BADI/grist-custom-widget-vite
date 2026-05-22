import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from 'vite';
import { execa } from 'execa';
import {startGristDocker, startViteServer} from "../../../src/commands/dev/DevTasks.js";
import {DevtoolsError} from "../../../src/commands/shared/DevtoolsError.js";
import type {ProjectConfig} from "../../../src/commands/dev/type.js";


// Mock heavy/external dependencies
vi.mock('vite', () => ({
    createServer: vi.fn(),
}));

vi.mock('execa', () => ({
    execa: vi.fn(),
}));

// Suppress console logs to keep a clean test terminal
vi.mock('../../utils/console/output.js', () => ({
    title: vi.fn(),
    logVerbose: vi.fn(),
    isVerbose: false,
}));

describe('DevTasks', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('startViteServer', () => {
        it('should start the Vite server and return its instance', async () => {
            const mockViteServer = {
                listen: vi.fn().mockResolvedValue(undefined),
                config: {
                    server: { port: 5173 },
                },
            };
            vi.mocked(createServer).mockResolvedValue(mockViteServer as any);

            // FIX: Added targetPort argument (5173)
            const server = await startViteServer(5173);

            expect(createServer).toHaveBeenCalled();
            expect(mockViteServer.listen).toHaveBeenCalled();
            expect(server).toBe(mockViteServer);
        });

        it('should throw a DevtoolsError (VITE_SERVER_FAILED) if server creation fails', async () => {
            vi.mocked(createServer).mockRejectedValue(new Error('Vite crash'));

            // FIX: Added targetPort argument (5173) to both calls
            await expect(startViteServer(5173)).rejects.toThrow(DevtoolsError);
            try {
                await startViteServer(5173);
            } catch (error: any) {
                expect(error.code).toBe('VITE_SERVER_FAILED');
                expect(error.message).toContain('Unable to create vite web server');
            }
        });
    });

    describe('startGristDocker', () => {
        const mockConfig: ProjectConfig = {
            projectName: '@scope/widget',
            projectVersion: '1.0.0',
            projectDirectory: '/root',
            projectPackageJsonPath: '/root/package.json',
            dockerComposeUrl: 'file:///root/docker-compose.yml',
            dockerComposeFilePath: '/root/docker-compose.yml',
            dockerContainerName: 'scope_widget',
        };

        it('should call Docker Compose with the correct arguments and the GRIST_WIDGET_LIST_URL variable', async () => {
            vi.mocked(execa).mockResolvedValue({} as any);

            // FIX: Added gristServerPort argument (8484)
            await startGristDocker(mockConfig, 5173, 8484);

            expect(execa).toHaveBeenCalledWith(
                'docker',
                ['compose', '-f', '/root/docker-compose.yml', '-p', 'scope_widget', 'up', '-d'],
                expect.objectContaining({
                    env: expect.objectContaining({
                        GRIST_WIDGET_LIST_URL: 'http://host.docker.internal:5173/manifest.json',
                    }),
                })
            );
        });

        it('should throw a DevtoolsError (DOCKER_COMPOSE_FAILED) if the docker command fails', async () => {
            vi.mocked(execa).mockRejectedValue(new Error('Docker daemon not running'));

            // FIX: Added gristServerPort argument (8484) to both calls
            await expect(startGristDocker(mockConfig, 5173, 8484)).rejects.toThrow(DevtoolsError);
            try {
                await startGristDocker(mockConfig, 5173, 8484);
            } catch (error: any) {
                expect(error.code).toBe('DOCKER_COMPOSE_FAILED');
                expect(error.message).toContain('Unable to start Grist-core Docker container');
            }
        });
    });
});