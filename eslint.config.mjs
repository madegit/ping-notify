import globals from "globals";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

const compat = new FlatCompat();

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config(reactPlugin.configs.recommended),
  ...compat.config(nextPlugin.configs.recommended),
  ...compat.config(nextPlugin.configs["core-web-vitals"]),
  {
    rules: {
      // Add any custom rules here
    },
  },
];