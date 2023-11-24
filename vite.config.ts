import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "multishot-generator",
      formats: ["es", "cjs"],
    },
  },
});
