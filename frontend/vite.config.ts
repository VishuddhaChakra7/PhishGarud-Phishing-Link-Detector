import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite server with local proxy to redirect API calls directly to Uvicorn
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
