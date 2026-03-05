import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import robloxTs from "eslint-plugin-roblox-ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["out", "include"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:roblox-ts/recommended-legacy",
      "plugin:prettier/recommended",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslint,
      robloxTs,
      prettier,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        jsx: true,
        useJSXTextNode: true,
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
