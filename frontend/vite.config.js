import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // simple-peer requires Node.js 'global' and 'process' to be available in browser
    global: "window",
    "process.env": {},
    "process.nextTick": "((fn) => setTimeout(fn, 0))",
  },
  optimizeDeps: {
    include: ["simple-peer", "socket.io-client"],
  },
  server: {
    port: 5173,
  },
})