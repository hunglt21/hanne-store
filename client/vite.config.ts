import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: the SPA runs on 5173 and proxies API + uploads to the Express server on 4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
