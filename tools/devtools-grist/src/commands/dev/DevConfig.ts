import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {DevtoolsError} from "../shared/DevtoolsError.js";
import type {ProjectConfig} from "./type.js";

import * as ANSI from '../../utils/console/ansi.js';
import {getVerbosityHumanReadable, isVerbose} from "../../utils/console/levelVerbosity.js";
import {COLOR_PRIMARY} from "../../utils/console/output.js";
import {configStore} from "../config/configurationStore.js";
const { STYLE } = ANSI;

async function readPackageJson(packageJsonPath: string, projectDirectory: string) {
    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        throw new DevtoolsError(
            'READ_PACKAGE_JSON_FAILED',
            `Unable to find or read the package.json inside ${projectDirectory}`,
            error
        );
    }
}

function resolveDockerComposePath(): { dockerComposeUrl: string; dockerComposeFilePath: string } {
    try {
        const dockerComposeUrl = import.meta.resolve('@aot-dep-badi/devtools-grist/docker-compose.yml');
        const dockerComposeFilePath = fileURLToPath(dockerComposeUrl);

        return {
            dockerComposeUrl,
            dockerComposeFilePath
        };
    } catch (error) {
        // Fallback for local development in workspace of @aot-dep-badi/devtools-grist
        try {
            const localRootPath = path.resolve(process.cwd(), 'docker-compose.yml');

            return {
                dockerComposeUrl: `file:///${localRootPath.replace(/\\/g, '/')}`,
                dockerComposeFilePath: localRootPath
            };
        } catch (fallbackError) {
            throw new DevtoolsError(
                'DOCKER_RESOLVE_PATH_FAILED',
                "Failed to resolve the shared devtools docker-compose.yml file path. Verify that '@aot-dep-badi/devtools-grist' is correctly installed in your dependencies.",
                error
            );
        }
    }
}

export async function loadProjectConfig(): Promise<ProjectConfig> {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const projectDirectory = path.dirname(packageJsonPath);

    /** @throws {DevtoolsError} 'READ_PACKAGE_JSON_FAILED' */
    const pkg = await readPackageJson(packageJsonPath, projectDirectory);

    /** @throws {DevtoolsError} 'DOCKER_RESOLVE_PATH_FAILED' */
    const {dockerComposeUrl, dockerComposeFilePath} = resolveDockerComposePath();

    const dockerContainerName = pkg.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '');

    return {
        projectName: pkg.name,
        projectVersion: pkg.version,
        projectPackageJsonPath: packageJsonPath,
        projectDirectory: projectDirectory,
        dockerComposeUrl: dockerComposeUrl,
        dockerComposeFilePath: dockerComposeFilePath,
        dockerContainerName: dockerContainerName
    };
}

export function logProjectConfig(projectConfig: ProjectConfig): void {
    if (!isVerbose()) return;

    // Define the color for the arrow prefix (gray)
    const colorText = COLOR_PRIMARY + STYLE.BOLD;
    const colorArrow = STYLE.FG_RGB(100, 100, 100);

    if (isVerbose()) {
        [
            ``,
            `${colorText}Environment setup${STYLE.RESET}`,
            `  ${colorArrow}➜${STYLE.RESET}  Vite.js v8.0.10`,
            `  ${colorArrow}➜${STYLE.RESET}  Docker image Grist-core v1.7`,
            `  ${colorArrow}➜${STYLE.RESET}  Devtools Grist verbosity level: ${STYLE.DIM}${getVerbosityHumanReadable()}${STYLE.RESET}`,
            `  ${colorArrow}➜${STYLE.RESET}  Devtools Grist language: ${STYLE.DIM}${configStore.get('lang')}${STYLE.RESET}`,
        ].forEach(line => console.log(line));
    }

    Object.entries(projectConfig).forEach(([key, value]) => {
        const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());

        if (key === 'projectName') {
            console.log(`  ${colorArrow}➜${STYLE.RESET}  Project widget: ${STYLE.DIM}${value} v${projectConfig.projectVersion}${STYLE.RESET}`);
        } else if (key === 'projectVersion') {
            return;
        } else {
            console.log(`  ${colorArrow}➜${STYLE.RESET}  ${formattedKey}: ${STYLE.DIM}${value}${STYLE.RESET}`);
        }
    });
}
