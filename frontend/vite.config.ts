import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          wagmi: ["wagmi", "viem"],
          charts: ["d3", "lightweight-charts"]
        }
      }
    }
  }
});
