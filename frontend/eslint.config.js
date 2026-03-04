import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/**", "node_modules/**"] },
  { files: ["**/*.{js,mjs,cjs}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  pluginReact.configs.flat.recommended,
  nextPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["components/ui/sidebar.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];