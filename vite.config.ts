import {defineConfig} from 'vite';

export default defineConfig({
  base: '/face/',
  publicDir: 'public',
  server: {host: '127.0.0.1', port: 5173, strictPort: true},
  preview: {host: '127.0.0.1', port: 4173, strictPort: true},
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {phaser: ['phaser']}
      }
    }
  }
});
