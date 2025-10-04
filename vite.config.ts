import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Plugin to copy pkg directory to dist after build
function copyPkgPlugin() {
  return {
    name: "copy-pkg",
    closeBundle() {
      const src = "src/pkg";
      const dst = "dist/pkg";
      
      if (existsSync(src)) {
        mkdirSync(dst, { recursive: true });
        const files = readdirSync(src);
        for (const file of files) {
          copyFileSync(join(src, file), join(dst, file));
        }
        console.log("✓ Copied pkg directory to dist/pkg");
      }
    },
  };
}

// Library build config for `oxideplayer`
export default defineConfig({
  plugins: [react(), copyPkgPlugin()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "OxidePlayer",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "oxideplayer.esm.js" : "oxideplayer.cjs"),
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
