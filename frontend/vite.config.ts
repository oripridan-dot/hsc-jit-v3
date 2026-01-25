import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 500
    }
  },
  build: {
    // Aggressive code-splitting to reduce main bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor
          'vendor-react': ['react', 'react-dom'],
          'vendor-zod': ['zod', 'zustand', 'react-error-boundary'],
          // Separate heavy libraries
          'vendor-framer': ['framer-motion'],
          'vendor-lucide': ['lucide-react'],
          // Search
          'vendor-fuse': ['fuse.js'],
        },
      },
    },
    // More aggressive chunk splitting
    chunkSizeWarningLimit: 300,
  },
})
