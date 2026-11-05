import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "public"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.worker,
        loadPyodide: "readonly",
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "warn",
      "no-control-regex": "off",
      "no-useless-escape": "warn",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
];
