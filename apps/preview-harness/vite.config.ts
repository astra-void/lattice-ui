import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { loadPreviewConfig } from "../../packages/preview/src/config";
import { createAutoMockPropsPlugin } from "../../packages/preview/src/source/autoMockPlugin";
import { createPreviewVitePlugin } from "../../packages/preview/src/source/plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");
const previewRuntimeEntry = path.resolve(workspaceRoot, "packages/preview-runtime/src/index.ts");
const previewConfig = await loadPreviewConfig({ cwd: __dirname });

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@lattice-ui/preview-runtime",
        replacement: previewConfig.runtimeModule ?? previewRuntimeEntry,
      },
    ],
  },
  plugins: [
    createAutoMockPropsPlugin({
      targets: previewConfig.targets,
    }),
    createPreviewVitePlugin({
      projectName: previewConfig.projectName,
      runtimeModule: previewConfig.runtimeModule ?? previewRuntimeEntry,
      targets: previewConfig.targets,
      transformMode: previewConfig.transformMode,
    }),
    react(),
    wasm(),
    topLevelAwait(),
  ],
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["@lattice-ui/layout-engine", "layout-engine"],
  },
  server: {
    fs: {
      allow: previewConfig.server.fsAllow,
    },
    host: previewConfig.server.host,
    open: previewConfig.server.open,
    port: previewConfig.server.port,
  },
});
