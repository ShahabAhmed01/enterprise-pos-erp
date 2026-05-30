import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
              external: ['electron', 'sql.js']
            }
          }
        }
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
              external: ['electron', 'sql.js']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer')
    }
  }
});
