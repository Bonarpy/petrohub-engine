import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // 1. Pintu Utama (Dashboard)
        main: resolve(__dirname, 'index.html'),
        // 2. Kamar Lama (PVT Week 1)
        pvt: resolve(__dirname, 'reservoir/pvt.html'),
        // 3. Kamar Baru (Material Balance Week 2 - Nanti kita buat)
        mbal: resolve(__dirname, 'reservoir/material-balance.html'),
      },
    },
  },
})