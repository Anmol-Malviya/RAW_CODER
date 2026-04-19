import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'framer-motion',
      'lucide-react',
      'jwt-decode',
      'socket.io-client',
      '@tensorflow/tfjs',
      '@tensorflow-models/coco-ssd',
    ],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }
            if (id.includes('@tensorflow')) {
              return 'vendor-tf';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
})
