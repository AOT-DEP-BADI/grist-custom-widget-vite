import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { type Plugin } from 'vite';
import * as ANSI from '../../utils/console/ansi.js';
import {logVerbose} from "../../utils/console/output.js";

const { STYLE } = ANSI;

interface GristWidgetManifestItem {
    name: string;
    url: string;
    widgetId: string;
    published?: boolean;
    accessLevel?: 'none' | 'read' | 'full';
    renderAfterReady?: boolean;
    description?: string;
    isGristLabsMaintained?: boolean;
    authors?: string[] | string;
    version?: string;
    lastUpdatedAt?: string;
    isPreview?: boolean;
    [key: string]: any;
}

interface PackageJsonMinimal {
    version: string;
}

function getTargetVitePort(defaultPort: string = '5173'): string {
    return process.env.VITE_PORT || defaultPort;
}

async function loadSourceManifest(rootPath: string): Promise<GristWidgetManifestItem[]> {
    const sourceManifestPath = path.join(rootPath, 'manifest.json');

    if (!existsSync(sourceManifestPath)) {
        throw new Error(`Missing 'manifest.json' at the root of the template project (${sourceManifestPath})`);
    }

    const content = await fs.readFile(sourceManifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    if (!Array.isArray(manifest)) {
        throw new Error("The source 'manifest.json' must contain a collection (JSON Array '[]')");
    }

    return manifest;
}

export const generateGristManifestPlugin = (): Plugin => ({
    name: 'generate-grist-manifest',
    async buildStart() {
        try {
            const rootDir = process.cwd();
            const publicDir = path.resolve(rootDir, 'public');
            const targetManifestPath = path.join(publicDir, 'manifest.json');
            const manifestCollection = await loadSourceManifest(rootDir);
            const targetVitePort = getTargetVitePort('5173');

            for (const widget of manifestCollection) {
                if (widget.isDevInProgress === true) {
                    if (widget.url) {
                        widget.lastUpdatedAt = new Date().toISOString();
                        widget.url = widget.url.replace(/:\d+/, `:${targetVitePort}`);
                    }
                }
            }

            await fs.writeFile(targetManifestPath, JSON.stringify(manifestCollection, null, 2), 'utf-8');

            const msg = `${STYLE.FG_BRIGHT_BLACK}[vite][plugin generate-grist-manifest]${STYLE.RESET} ${STYLE.FG_GREEN}✓${STYLE.RESET} Grist custom widgets manifest deployed to ${STYLE.FG_BLUE}/public${STYLE.RESET}`;
            const newLine = process.env.NODE_ENV === 'production' ? '\n' : '';
            logVerbose(`${newLine}${msg}${newLine}`);
        } catch (error: any) {
            console.error(`${STYLE.FG_BRIGHT_BLACK}[vite][plugin generate-grist-manifest]${STYLE.RESET} ${STYLE.FG_RED}✗ Error on Grist widgets manifest publication.`, error.message || error, `${STYLE.RESET}\n`);
            process.exit(2);
        }
    }
});

export const updateGristManifestDistPlugin = (pkg: PackageJsonMinimal): Plugin => ({
    name: 'update-grist-manifest-dist',
    apply: 'build',
    async closeBundle() {
        try {
            const rootDir = process.cwd();
            const strategy = (process.env.VITE_BUILD_STRATEGY || 'STANDARD').toLowerCase();
            const distFolderName = `v${pkg.version}-${strategy}`;
            const distDir = path.resolve(rootDir, 'dist', distFolderName);
            const distManifestPath = path.join(distDir, 'manifest.json');

            if (existsSync(distManifestPath)) {
                const fileContent = await fs.readFile(distManifestPath, 'utf-8');
                const manifestCollection: GristWidgetManifestItem[] = JSON.parse(fileContent);

                if (Array.isArray(manifestCollection)) {
                    const isPreview = process.env.PREVIEW_MODE === 'true';
                    const usedPort = isPreview ? getTargetVitePort('4173') : getTargetVitePort('5173');

                    for (const widget of manifestCollection) {
                        if (widget.isDevInProgress === true) {
                            widget.lastUpdatedAt = new Date().toISOString();
                            widget.version = pkg.version;
                            widget.isPreview = isPreview;

                            if (widget.url) {
                                widget.url = widget.url.replace(/:\d+/, `:${usedPort}`);
                            }

                            delete widget.isDevInProgress;
                        }
                    }

                    await fs.writeFile(distManifestPath, JSON.stringify(manifestCollection, null, 2), 'utf-8');

                    const msg = `${STYLE.FG_BRIGHT_BLACK}[vite][plugin update-grist-manifest-dist]${STYLE.RESET} ${STYLE.FG_GREEN}✓${STYLE.RESET} All items in Grist manifest collection updated in ${STYLE.FG_CYAN}./dist/${distFolderName}/manifest.json${STYLE.RESET}`;
                    const newLine = process.env.NODE_ENV === 'production' ? '\n' : '';
                    console.log(`${newLine}${msg}${newLine}`);
                }
            }
        } catch (error) {
            console.error(`${STYLE.FG_BRIGHT_BLACK}[vite][plugin update-grist-manifest-dist]${STYLE.RESET} ${STYLE.FG_RED}✗ Error updating manifest collection in dist.${STYLE.RESET}`, error, '\n');
        }
    }
});