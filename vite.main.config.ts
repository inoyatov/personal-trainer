import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'app/shared'),
      '@backend': path.resolve(__dirname, 'app/backend'),
    },
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3'],
    },
  },
});
