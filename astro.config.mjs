// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://gitwarren.com",
  // Static output, deployed to Cloudflare Workers as plain assets.
  output: "static",
  build: {
    // Cloudflare's asset server resolves /path to /path/index.html.
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
