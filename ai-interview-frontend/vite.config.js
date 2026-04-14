import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
    "process.env": {},
    "process.nextTick": "((fn) => setTimeout(fn, 0))",
  },
  optimizeDeps: {
    include: [
      "@tensorflow/tfjs",
      "@tensorflow-models/coco-ssd",
      "@vladmandic/face-api",
      "axios",
      "simple-peer",
      "socket.io-client",
    ],
  },
  server: {
    port: 5174,
  },
});
