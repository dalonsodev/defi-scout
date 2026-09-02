import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (normalizedId.includes('/node_modules/')) {
            if (normalizedId.includes('/node_modules/@firebase/')) {
              return 'vendor-firebase'
            }

            if (normalizedId.includes('/node_modules/firebase/')) {
              return 'vendor-firebase'
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
