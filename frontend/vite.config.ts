import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          // Split large components
          calendar: ['./src/components/Pages/Calendar.tsx'],
          live: ['./src/components/Pages/Live.tsx'],
          highlights: ['./src/components/Pages/Highlights.tsx'],
        }
      }
    },
    // Enable minification
    minify: 'esbuild',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
})
