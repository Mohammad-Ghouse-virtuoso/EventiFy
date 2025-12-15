import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        // keep /api prefix so frontend uses '/api/v1/...'
        // If backend is mounted at /api/v1, no rewrite needed
        // rewrite: (path) => path.replace(/^\/api/, ''), // not needed here
      },
      // Proxy backend static files (served by FastAPI) so '/static/...'
      // requests from the frontend resolve correctly in dev
      '/static': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
