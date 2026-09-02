# gitwarren.com

Marketing site for [GitWarren](https://github.com/klarluft/gitwarren-app) — a
desktop app for reviewing your own git repositories, including the work that
hasn't been committed yet.

Static site, built with Astro and Tailwind v4, deployed on Cloudflare Workers.

## Status

Built. One page, no client-side JavaScript.

**Still placeholders:** every download href is `#`, in
[`src/config.ts`](src/config.ts). They get baked in at build time from the
GitHub releases API — `v0.1.0` has no release behind it yet. See
[`CLAUDE.md`](CLAUDE.md) for that plan, and for the positioning, tokens, type
system and hero treatment the page was built from.

The design canvas, which is the easiest way to see the page as intended, is
linked from that file.

## Layout

| Path | What |
| --- | --- |
| `design/canvas/` | Design source — `.dc.html` artboards and `canvas.json`. |
| `design/screenshots/` | Full-resolution app screenshots, 2400x1600 @2x. |
| `design/brand/` | The 1710px master logo. |
| `src/assets/` | Full-resolution image sources. Astro emits the derivatives. |
| `src/components/` | The page, in pieces. |
| `src/styles/global.css` | The design system, as a Tailwind `@theme` block. |

Screenshots are regenerated from the app repo — see
[`design/screenshots/README.md`](design/screenshots/README.md).

## Development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output into dist/
npm run preview  # serve the build locally
npm run check    # astro check — keep this at 0 errors
```

## Deployment

Cloudflare Workers, static assets only — `wrangler.jsonc` declares no `main`,
so there is no Worker script, just `dist/` served from the edge. Connect the
repository through Workers Builds for production deploys on `main` and preview
URLs on pull requests, or push a build by hand:

```bash
npm run deploy
```

## Licence

All rights reserved. The app itself is GPL-3.0 and lives in its own repository.
