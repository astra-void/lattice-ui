import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/vitest/**/*.test.ts", "tests/vitest/**/*.test.tsx"],
    setupFiles: ["tests/vitest/setup/roblox-shim.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
