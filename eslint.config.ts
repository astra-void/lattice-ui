import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import robloxTs from "eslint-plugin-roblox-ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/out/**", "**/dist/**", "**/include/**"]),
  {
    files: ["{packages,apps}/**/*.{ts,tsx}"],
    ignores: ["packages/cli/**"],
    extends: compat.extends("plugin:roblox-ts/recommended-legacy"),

    plugins: {
      robloxTs,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        jsx: true,
        useJSXTextNode: true,
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
]);
