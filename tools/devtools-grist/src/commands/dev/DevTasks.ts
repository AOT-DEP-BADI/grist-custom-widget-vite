import { createServer, type ViteDevServer } from 'vite';
import {DevtoolsError} from "../shared/DevtoolsError.js";
import * as ANSI from '../../utils/console/ansi.js';
import {COLOR_PRIMARY, logVerbose, title} from "../../utils/console/output.js";
import type {ProjectConfig} from "./type.js";
import {execa} from "execa";
import {isVerbose} from "../../utils/console/levelVerbosity.js";
const { STYLE } = ANSI;

export async function startViteServer(targetPort: number): Promise<ViteDevServer> {
    title("Launching Vite.js server (HMR enabled)", { colorPrimary: COLOR_PRIMARY, newlineBefore: true, onlyVerbose: true });

    try {
        process.env.VITE_PORT = String(targetPort);
        const viteServer = await createServer({
            server: {
                host: true,
                port: targetPort,
                strictPort: false,
                allowedHosts: ['host.docker.internal', 'localhost']
            }
        });

        await viteServer.listen();
        let viteActualPort = viteServer.config.server.port ?? targetPort;
        logVerbose(`${STYLE.FG_BRIGHT_BLACK}[vite]${STYLE.RESET} ${STYLE.FG_GREEN}✓${STYLE.RESET} Vite web server local is available at ${ANSI.LINK(`http://localhost:${viteActualPort}`)}`);
        logVerbose(`${STYLE.FG_BRIGHT_BLACK}[vite]${STYLE.RESET} ${STYLE.FG_GREEN}✓${STYLE.RESET} Grist manifest is available at ${ANSI.LINK(`http://localhost:${viteActualPort}/manifest.json`)}\n`);

        return viteServer;
    } catch (error) {
        throw new DevtoolsError('VITE_SERVER_FAILED', 'Unable to create vite web server.', error);
    }
}

export async function startGristDocker(config: ProjectConfig, viteServerPort: number, gristServerPort: number): Promise<number> {
    title("Launching Grist (Docker)", { colorPrimary: COLOR_PRIMARY, newlineBefore: false, onlyVerbose: true });

    const gristWidgetManifestUrl = `http://host.docker.internal:${viteServerPort}/manifest.json`;

    logVerbose(`${STYLE.FG_BRIGHT_BLACK}[grist-docker]${STYLE.RESET} Using Docker compose file: ${STYLE.DIM}${config.dockerComposeFilePath}${STYLE.RESET}`);
    logVerbose(`${STYLE.FG_BRIGHT_BLACK}[grist-docker]${STYLE.RESET} Using Docker compose url: ${STYLE.DIM}${config.dockerComposeUrl}${STYLE.RESET}`);
    logVerbose(`${STYLE.FG_BRIGHT_BLACK}[grist-docker]${STYLE.RESET} Using Docker container name: ${STYLE.DIM}${config.dockerContainerName}${STYLE.RESET}`);
    logVerbose(`${STYLE.FG_BRIGHT_BLACK}[grist-docker]${STYLE.RESET} Grist instance will be available at ${ANSI.LINK(`http://localhost:${gristServerPort}`)}`);
    logVerbose(`${STYLE.FG_BRIGHT_BLACK}[grist-docker]${STYLE.RESET} Linking Grist to manifest with GRIST_WIDGET_LIST_URL: ${ANSI.LINK(gristWidgetManifestUrl)}`);

    try {
        process.env.GRIST_PORT = String(gristServerPort);
        await execa(
            'docker',
            ['compose', '-f', config.dockerComposeFilePath, '-p', config.dockerContainerName, 'up', '-d'],
            {
                stdio: isVerbose() ? 'inherit' : 'pipe',
                env: {
                    ...process.env,
                    GRIST_WIDGET_LIST_URL: gristWidgetManifestUrl,
                    GRIST_PORT: String(gristServerPort),
                    VITE_PORT: String(viteServerPort)
                }
            }
        );

        return gristServerPort;
    } catch (error) {
        throw new DevtoolsError('DOCKER_COMPOSE_FAILED', 'Unable to start Grist-core Docker container. Please ensure Docker engine is running.', error);
    }
}