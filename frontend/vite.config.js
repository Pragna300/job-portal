import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // simple-peer requires Node.js 'global' to be available in browser
    global: "window",
  },
  optimizeDeps: {
    include: ["simple-peer", "socket.io-client"],
  },
  server: {
    port: 5173,
  },
})