import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0', // Allow access from Windows to WSL
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});