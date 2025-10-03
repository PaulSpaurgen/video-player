import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build config for `oxideplayer`
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "OxidePlayer",
      formats: ["es", "cjs"],
      fileName: (format) => `oxideplayer.${format === "es" ? "esm" : "cjs"}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    assetsDir: "assets",
  },
})
