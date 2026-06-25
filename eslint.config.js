import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "prefer-const": "error"
    },
  },

  ...tseslint.config({
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    }
  }),

  {
    files: ["tailwind.config.js", "postcss.config.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-undef": "off",
    },
  },
]);
