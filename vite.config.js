import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // 1. 將警告門檻從 500kb 提高到 1000kb，眼不見為淨
    chunkSizeWarningLimit: 1000,
    
    // 2. 實施「分流打包」策略
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 把 node_modules 裡面的套件（如 Firebase）拆分出去
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})