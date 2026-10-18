import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Installed design tooling ships third-party scripts, not application code.
    ".github/skills/**",
    // Local-only agent scratch files, sample preview and generated test builds.
    ".codex-*/**",
    ".next-e2e/**",
    ".next-e2e-build/**",
    "playwright-report/**",
    "test-results/**",
    "app/featured-admin-preview/**",
  ]),
]);

export default eslintConfig;
