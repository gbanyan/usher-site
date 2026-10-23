import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default defineConfig([
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  globalIgnores([
    "dist/**",
    ".next/**",
    ".astro/**",
    "hugo-archive/**",
    "content-snapshots/**",
    "public/**",
    "scripts/**",
    ".superpowers/**",
  ]),
]);
