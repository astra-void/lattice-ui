import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = __dirname;

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@lattice-ui/compiler",
        replacement: path.resolve(workspaceRoot, "packages/compiler/index.js"),
      },
      {
        find: "@lattice-ui/preview-runtime",
        replacement: path.resolve(workspaceRoot, "packages/preview-runtime/src/index.ts"),
      },
      {
        find: "@lattice-ui/preview/runtime",
        replacement: path.resolve(workspaceRoot, "packages/preview/src/runtime/index.ts"),
      },
      {
        find: "@lattice-ui/preview",
        replacement: path.resolve(workspaceRoot, "packages/preview/src/index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/vitest/**/*.test.ts", "tests/vitest/**/*.test.tsx"],
    setupFiles: ["tests/vitest/setup/roblox-shim.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
