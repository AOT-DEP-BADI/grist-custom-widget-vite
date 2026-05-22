import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

import pkg from './package.json' with { type: 'json' };
import {generateGristManifestPlugin, updateGristManifestDistPlugin} from "@6i/devtools-grist/vite";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    generateGristManifestPlugin(pkg),
    updateGristManifestDistPlugin(pkg)
  ],
})
