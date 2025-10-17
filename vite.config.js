import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@o7c/shared': path.resolve(__dirname, '../shared/src')
    }
  },
  optimizeDeps: {
    include: ['@o7c/shared']
  }
})