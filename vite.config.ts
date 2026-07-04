/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative asset paths so the build works when served from a sub-path
  // (e.g., /silse-editor/index.html via Next.js iframe embedding).
  base: '/silse-editor/',
  plugins: [react()],
  build: {
    // OPTIMASI-01: split vendor into separate chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cacheable
          'react-vendor': ['react', 'react-dom'],
          // Zustand state management — small, stable
          'state-vendor': ['zustand'],
        },
      },
    },
    // Increase warning threshold so our split chunks don't trigger noise
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
  },
});
