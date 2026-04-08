import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@rbxts/react", replacement: "react" },
      { find: "@rbxts/services", replacement: path.resolve(__dirname, "./tests/vitest/setup/rbxts-services.ts") },
      { find: /^@lattice-ui\/(.*)$/, replacement: path.resolve(__dirname, "./packages/$1/src") },
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
