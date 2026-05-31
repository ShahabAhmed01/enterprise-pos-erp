import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import { builtinModules } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Externalise everything that should NOT be bundled into the Electron
// main/preload ESM output.  Bundling CJS packages (electron-store, bcryptjs,
// electron-log, sql.js, etc.) into an ES-module bundle causes the well-known
// "__dirname is not defined" error because CJS globals are unavailable in ESM.
// Keeping them external means Electron's Node runtime loads them natively
// where __dirname / require() work correctly.
const electronExternals = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.js',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            target: 'node18',
            outDir: 'dist-vite/main',
            minify: false,
            rollupOptions: {
              // Externalise electron, all Node built-ins, AND every npm package
              // listed in dependencies / devDependencies so that CJS modules
              // are never bundled into the ESM output.
              external(id) {
                if (electronExternals.includes(id)) return true;
                // Treat any bare package name (no leading '.' or '/') as external
                return !id.startsWith('.') && !path.isAbsolute(id);
              },
            },
          },
        },
      },
      {
        entry: 'src/preload/preload.js',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            target: 'node18',
            outDir: 'dist-vite/preload',
            minify: false,
            rollupOptions: {
              external(id) {
                if (electronExternals.includes(id)) return true;
                return !id.startsWith('.') && !path.isAbsolute(id);
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
