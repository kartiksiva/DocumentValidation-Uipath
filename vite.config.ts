import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import codedAppsDev from '@uipath/coded-apps-dev/vite';

export default defineConfig({
  base: './',
  plugins: [react(), codedAppsDev()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
