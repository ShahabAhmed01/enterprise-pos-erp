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
  'electron-store',
  'electron-log',
  'sql.js',
  'bcryptjs',
  'uuid',
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
            lib: {
              entry: 'src/main/main.js',
              formats: ['cjs'],
              fileName: () => 'main.cjs'
            },
            outDir: 'dist-vite/main',
            rollupOptions: {
              external: electronExternals,
              output: {
                format: 'cjs',
                entryFileNames: 'main.cjs',
                exports: 'auto',
                generatedCode: {
                  constBindings: true
                },
                interop: 'auto'
              }
            },
            minify: false,
            emptyOutDir: true
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
  build: {
    outDir: 'dist-vite/renderer',
    base: './'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
