import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
    exclude: ['node_modules', '.vite', 'dist'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'app/shared'),
      '@backend': path.resolve(__dirname, 'app/backend'),
    },
  },
});
