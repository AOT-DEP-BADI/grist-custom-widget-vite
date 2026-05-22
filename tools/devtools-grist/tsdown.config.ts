import { defineConfig } from 'tsdown'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineConfig({
  entry: [
    'src/cli.ts',
    'src/vite/plugins/grist-manifest.ts'
  ],
  dts: true,
  exports: false,
  deps: {
    neverBundle: [
      'vite'
    ]
  },

  plugins: [
    {
      name: 'copy-docker-compose',
      async buildStart() {
        try {
          const src = path.resolve(process.cwd(), 'docker-compose.yml');
          const dest = path.resolve(process.cwd(), 'dist/docker-compose.yml');
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.copyFile(src, dest);
          console.log('[tsdown-plugin :: copy-docker-compose] ✓ Successfully copied docker-compose.yml to dist');
        } catch (error) {
          console.error('[tsdown-plugin :: copy-docker-compose] ✗ Failed to copy docker-compose.yml to dist', error);
        }
      }
    }
  ]
})
