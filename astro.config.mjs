// @ts-check
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

/**
 * Astro emits each image source alongside the AVIF/WebP/JPEG derivatives it
 * actually references — about 1.1MB of PNGs nothing ever requests. Drop the
 * ones no emitted page links to.
 *
 * Deliberately conservative: it reads every built page first and only deletes
 * a file whose name appears in none of them.
 */
/** @returns {import("astro").AstroIntegration} */
function pruneUnreferencedImages() {
  return {
    name: "prune-unreferenced-images",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        const assetsDir = path.join(distDir, "_astro");

        /** @type {string[]} */
        const pages = [];
        const walk = async (/** @type {string} */ current) => {
          for (const entry of await readdir(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) await walk(full);
            else if (entry.name.endsWith(".html")) pages.push(full);
          }
        };
        await walk(distDir);

        const markup = (await Promise.all(pages.map((p) => readFile(p, "utf8")))).join("\n");

        let removed = 0;
        let bytes = 0;
        for (const name of await readdir(assetsDir)) {
          if (!/\.(png|jpe?g)$/i.test(name)) continue;
          if (markup.includes(name)) continue;

          const full = path.join(assetsDir, name);
          bytes += (await stat(full)).size;
          await unlink(full);
          removed++;
        }

        if (removed > 0) {
          logger.info(
            `pruned ${removed} unreferenced image${removed === 1 ? "" : "s"} (${(bytes / 1048576).toFixed(2)} MB)`,
          );
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://gitwarren.com",
  // Static output, deployed to Cloudflare Workers as plain assets.
  output: "static",
  build: {
    // Cloudflare's asset server resolves /path to /path/index.html.
    format: "directory",
  },
  // The sitemap is what Search Console and Bing Webmaster Tools are handed;
  // one page today, but it also carries lastmod for every page that follows.
  integrations: [sitemap(), pruneUnreferencedImages()],
  vite: {
    plugins: [tailwindcss()],
  },
});
