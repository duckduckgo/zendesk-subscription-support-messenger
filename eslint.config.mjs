import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import ddgConfig from "@duckduckgo/eslint-config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...ddgConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Define global variables from third-party scripts
  // zE is provided by Zendesk Web Widget SDK (loaded dynamically via Script component)
  // Type definitions are provided by @types/zendesk-web-widget
  {
    languageOptions: {
      globals: {
        zE: "readonly", // Zendesk Web Widget API
      },
    },
  },
]);

export default eslintConfig;
