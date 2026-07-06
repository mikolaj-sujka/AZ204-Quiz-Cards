import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/AZ204-Quiz-Cards/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**']
  }
});
