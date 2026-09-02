import { defineConfig } from "vite"
import { resolve } from "path"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        options: resolve(__dirname, "src/options/options.html"),
        preview: resolve(__dirname, "preview.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "src/[name].js",
        chunkFileNames: "src/chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
})
