import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: "tsconfig.lib.json",
      include: ["src/lib/**/*.ts", "src/lib/**/*.vue"],
      outDirs: ["dist"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/index.ts"),
      name: "SileoVue",
      formats: ["es", "cjs"],
      fileName: (format) => `vue-sileo.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
    cssCodeSplit: false,
  },
});
