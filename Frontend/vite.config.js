import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js
export default {
  server: {
    hmr: {
      host: 'techandtomorrow.social',
      protocol: 'wss', // Use 'ws' if not using SSL/HTTPS
    },
    allowedHosts: ['techandtomorrow.social'] 
  }
}