import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Wichtig für GitHub Pages, damit Pfade relativ sind
  build: {
    chunkSizeWarningLimit: 2000 // Warnung erst ab 2000 kB
  }
})
