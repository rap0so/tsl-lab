import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        texture: resolve(import.meta.dirname, "texture/index.html"),
        instancing: resolve(import.meta.dirname, "instancing/index.html"),
        postprocessing: resolve(
          import.meta.dirname,
          "postprocessing/index.html",
        ),
        flyingPaper: resolve(import.meta.dirname, "flying-paper.html"),
        movingPaper: resolve(import.meta.dirname, "moving-paper.html"),
      },
    },
  },
});
