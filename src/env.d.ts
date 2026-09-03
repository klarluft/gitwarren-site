/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Cloudflare Web Analytics site token, from the dashboard entry for
   * gitwarren.com. Public by nature — it identifies the site being measured,
   * not an account — but kept out of the repository so preview and fork
   * builds don't report into the production numbers.
   *
   * Unset means no beacon is emitted at all. See src/layouts/Layout.astro.
   */
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
