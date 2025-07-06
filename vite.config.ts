import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "dist-react",
    sourcemap: true,
  },
  server: {
    port: 5123,
    strictPort: true,
    watch: {
      ignored: ["**/src/electron/**", "**/src/backend/**"],
      usePolling: false,
    },
    hmr: {
      overlay: true,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["electron"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/ui"),
    },
  },
});
