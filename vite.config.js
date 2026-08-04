import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        texture: resolve(import.meta.dirname, "texture.html"),
        instancing: resolve(import.meta.dirname, "instancing.html"),
      },
    },
  },
});
