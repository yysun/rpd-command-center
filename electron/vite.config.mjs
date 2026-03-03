import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5181,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'renderer/dist'),
    emptyOutDir: true,
  },
})
