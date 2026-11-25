import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // relative base so GitHub Pages subpath hosting works
  base: './',
  plugins: [react(), tailwindcss()],
})
