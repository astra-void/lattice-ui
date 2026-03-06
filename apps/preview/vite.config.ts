import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { createPreviewVitePlugin } from "../../packages/preview/src/source/plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../..");

function createPreviewSourceRedirectPlugin(): Plugin {
  const entrypoints = new Map<string, string>([
    [
      path.resolve(workspaceRoot, "packages/preview/dist/index.js"),
      path.resolve(workspaceRoot, "packages/preview/src/index.ts"),
    ],
    [
      path.resolve(workspaceRoot, "packages/preview/dist/ui/index.js"),
      path.resolve(workspaceRoot, "packages/preview/src/ui/index.ts"),
    ],
    [
      path.resolve(workspaceRoot, "packages/preview/dist/runtime/index.js"),
      path.resolve(workspaceRoot, "packages/preview/src/runtime/index.ts"),
    ],
  ]);

  return {
    name: "lattice-preview-source-redirect",
    enforce: "pre",
    load(id) {
      const [filePath] = id.split("?", 1);
      const sourceEntrypoint = entrypoints.get(filePath);
      if (!sourceEntrypoint) {
        return undefined;
      }

      return `export * from ${JSON.stringify(sourceEntrypoint)};\n`;
    },
  };
}

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
    createPreviewSourceRedirectPlugin(),
    createPreviewVitePlugin({
      projectName: "Lattice Preview",
      targets: [...previewTargets],
    }),
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "@lattice-ui/preview/runtime",
        replacement: path.resolve(workspaceRoot, "packages/preview/src/runtime/index.ts"),
      },
      {
        find: "@lattice-ui/preview/ui",
        replacement: path.resolve(workspaceRoot, "packages/preview/src/ui/index.ts"),
      },
      {
        find: "@lattice-ui/preview",
        replacement: path.resolve(workspaceRoot, "packages/preview/src/index.ts"),
      },
    ],
  },
  server: {
    fs: {
      allow: [workspaceRoot, ...previewTargets.flatMap((target) => [target.packageRoot, target.sourceRoot])],
    },
    port: 4174,
  },
});
