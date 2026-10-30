import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
        }
      }
    }
  }
});

