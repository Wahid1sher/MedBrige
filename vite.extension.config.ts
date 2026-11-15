import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    lib: {
      entry: { content: resolve(import.meta.dirname, 'extension/content.ts') },
      formats: ['iife'],
      name: 'MedBridgeLocal',
      fileName: () => 'content.js',
    },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
