import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        texture: resolve(import.meta.dirname, "texture.html"),
        instancing: resolve(import.meta.dirname, "instancing.html"),
        storageBuffer: resolve(import.meta.dirname, "storage-buffer.html"),
        flyingPaper: resolve(import.meta.dirname, "flying-paper.html"),
        movingPaper: resolve(import.meta.dirname, "moving-paper.html"),
        postProcessing: resolve(import.meta.dirname, "post-processing.html"),
      },
    },
  },
});
