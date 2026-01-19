import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 500
    },
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        changeOrigin: true,
        ws: true
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    },
    middlewares: [
      {
        apply: 'serve',
        use(req, res, next) {
          // Serve /data/* files from public/data
          if (req.url?.startsWith('/data/')) {
            const filePath = path.join(__dirname, 'public', req.url);
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(fs.readFileSync(filePath, 'utf-8'));
              return;
            }
          }
          next();
        }
      }
    ]
  },
  // Watch public/data for changes
  optimizeDeps: {
    exclude: []
  }
})
