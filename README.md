# gitwarren.com

Marketing site for [GitWarren](https://github.com/klarluft/gitwarren-app) — a
desktop app for reviewing your own git repositories, including the work that
hasn't been committed yet.

Static site, built with Astro and Tailwind, deployed on Netlify.

## Status

Design settled, site not yet built. See [`CLAUDE.md`](CLAUDE.md) for the brief:
positioning, tokens, type system, the hero treatment, and how the download
links are wired to GitHub releases.

The design canvas, which is the easiest way to see the page as intended, is
linked from that file.

## Layout

| Path | What |
| --- | --- |
| `design/canvas/` | Design source — `.dc.html` artboards and `canvas.json`. |
| `design/screenshots/` | Full-resolution app screenshots, 2x. |
| `src/assets/` | Web-optimised images the site ships. |

Screenshots are regenerated from the app repo — see
[`design/screenshots/README.md`](design/screenshots/README.md).

## Development

Once scaffolded:

```bash
npm install
npm run dev
```

## Licence

All rights reserved. The app itself is GPL-3.0 and lives in its own repository.
