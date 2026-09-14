import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames(chunkInfo) {
          if (chunkInfo.moduleIds.some((id) => id.includes('/node_modules/@firebase/firestore/'))) {
            return 'assets/vendor-firebase-firestore-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        },
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (normalizedId.includes('/node_modules/')) {
            if (normalizedId.includes('/node_modules/@firebase/auth/')) {
              return 'vendor-firebase-auth'
            }

            if (
              normalizedId.includes('/node_modules/@firebase/component/') ||
              normalizedId.includes('/node_modules/@firebase/logger/') ||
              normalizedId.includes('/node_modules/@firebase/util/')
            ) {
              return 'vendor-firebase-shared'
            }

            if (normalizedId.includes('/node_modules/@tanstack/')) {
              return 'vendor-tanstack-table'
            }

            return undefined
          }
        }
      }
    }
  }
})
