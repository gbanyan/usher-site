import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site:
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:4321",
  output: "static",
  build: { format: "file" },
  trailingSlash: "never",
  vite: { plugins: [tailwindcss()] },
});
