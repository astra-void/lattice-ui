import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import type { ESLint } from "eslint";
import prettier from "eslint-plugin-prettier";
import robloxTs from "eslint-plugin-roblox-ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typescriptEslintPlugin = typescriptEslint as unknown as ESLint.Plugin;
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
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:roblox-ts/recommended-legacy",
      "plugin:prettier/recommended",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      robloxTs,
      prettier,
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

    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
    },
  },
  {
    files: ["packages/cli/**/*.ts"],
    ignores: ["packages/cli/templates/**/*.ts"],
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      prettier,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./packages/cli/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
    },
  },
  {
    files: ["scripts/**/*.ts"],
    extends: compat.extends(
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      prettier,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
