import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the backend runs in development. /api requests are forwarded there.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: BACKEND_URL, changeOrigin: true } },
  },
})
