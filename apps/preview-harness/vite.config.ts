import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import { createAutoMockPropsPlugin } from "../../packages/preview/src/source/autoMockPlugin";
import { createPreviewVitePlugin } from "../../packages/preview/src/source/plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

const previewTargets = [
  {
    name: "checkbox",
    packageName: "@lattice-ui/checkbox",
    packageRoot: path.resolve(workspaceRoot, "packages/checkbox"),
    sourceRoot: path.resolve(workspaceRoot, "packages/checkbox/src"),
  },
  {
    name: "switch",
    packageName: "@lattice-ui/switch",
    packageRoot: path.resolve(workspaceRoot, "packages/switch"),
    sourceRoot: path.resolve(workspaceRoot, "packages/switch/src"),
  },
  {
    name: "dialog",
    packageName: "@lattice-ui/dialog",
    packageRoot: path.resolve(workspaceRoot, "packages/dialog"),
    sourceRoot: path.resolve(workspaceRoot, "packages/dialog/src"),
  },
] as const;

export default defineConfig({
  plugins: [
    createAutoMockPropsPlugin({
      targets: [...previewTargets],
    }),
    createPreviewVitePlugin({
      projectName: "Lattice Preview",
      targets: [...previewTargets],
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
      allow: [workspaceRoot, ...previewTargets.flatMap((target) => [target.packageRoot, target.sourceRoot])],
    },
    port: 4174,
  },
});
