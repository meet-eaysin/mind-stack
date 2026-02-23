import { defineConfig } from "eslint/config";
import { nextJsConfig } from "@repo/eslint-config/next-js";

export default defineConfig([
  ...nextJsConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
