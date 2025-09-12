import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000', // Ajusta al puerto donde corre tu backend local
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist', // deja en dist/ como ahora
      assetsDir: 'assets', // los assets irán a dist/assets/
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Evita chunks enormes y mejora cacheo
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    base: mode === 'production' ? '/static/' : '/', // ✅ en producción Django servirá los assets desde /static/
  };
});
