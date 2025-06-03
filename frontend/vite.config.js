import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://party-game-backend.onrender.com'
          : 'http://localhost:4000',
        ws: true
      }
    }
  }
}); 