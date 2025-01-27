import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import shadcnThemeJson from '@replit/vite-plugin-shadcn-theme-json'
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    shadcnThemeJson(),
    runtimeErrorModal()
  ],
  server: {
    port: Number(process.env.PORT) || 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 5000}`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@autocrm/ui-components': '/packages/ui-components/src',
      '@autocrm/api-types': '/packages/api-types/src',
      '@autocrm/utils': '/packages/utils/src'
    }
  }
})
