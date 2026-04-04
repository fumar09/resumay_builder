import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: []
  }
})
