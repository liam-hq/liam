import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
