import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'https://party-game-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'socket.io-client', 'framer-motion']
        }
      }
    }
  }
}) 