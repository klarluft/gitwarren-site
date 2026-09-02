# gitwarren.com

The marketing site for **GitWarren**, a desktop app for local git code review.

This file carries the decisions already made, so you don't have to re-derive
them. The design is settled; the site is not built yet.

---

## First thing to do

Nothing is scaffolded. Step one:

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-git
npx astro add tailwind
```

Then build the page from `design/canvas/Main.dc.html` (see **The design**).

## Why this is a separate repo from the app

The app (`klarluft/gitwarren-app`, checked out at
`~/github.com/klarluft/gitwarren-app`) is GPL-3.0, has a CLA bot on every PR,
and a CI job that rebuilds `better-sqlite3` against Electron headers. Marketing
copy should pay none of those costs, and GPL is the wrong licence for brand
assets. Keep this repo free of app code, and the app repo free of this.

- Domain: **gitwarren.com** (owned; point DNS at Netlify)
- Host: **Netlify** free tier — chosen over GitHub Pages for deploy previews on
  PRs. Downloads redirect to GitHub release assets, so host bandwidth is
  irrelevant.

## Stack

- **Astro** + **Tailwind CSS v4**. Static output, zero JS by default: SEO and
  link unfurls matter more here than interactivity.
- No design system shared with the app. The app's UI is stock shadcn with no
  identity worth propagating; this site has its own, below.

## Repo layout

| Path | What |
| --- | --- |
| `design/canvas/` | The design source. `.dc.html` artboards + `canvas.json`. |
| `design/screenshots/` | Full-resolution app screenshots, 2x. |
| `src/assets/` | Web-optimised images the site actually ships. |

The scripts that regenerate the screenshots live in the app repo
(`scripts/seed-demo.ts`, `scripts/capture-demo.mjs`) — see
`design/screenshots/README.md`.

## The design

Visual source of truth, and the easiest way to see it:
**https://claude.ai/code/artifact/082039e8-61be-4084-a176-034d35996415**

`design/canvas/Main.dc.html` is the desktop page and `Mobile.dc.html` the
narrow one. They are Design Component HTML — read them for exact values, then
rebuild in Astro components. They are not shippable code.

### Positioning — don't dilute this

The page leads with **reviewing agent-written code before it reaches GitHub**.
The insight the whole page rests on: *an agent's output starts life as an
uncommitted worktree*, which is exactly the state no other review tool can see.
Do not soften this back into generic "code review for git".

Headline: **"Review what your agents wrote, before GitHub ever sees it."**

### Section order

1. **Hero** — halo treatment (below), headline, sub, download CTA, `hero.jpg`.
2. **Before the commit** — "An agent's output isn't a commit. It's a dirty
   worktree." Screenshot `untracked.jpg`.
3. **Agents in the loop** — MCP server, seventeen tools, agents as review
   participants. Screenshot `agents.jpg`. Three cards: always attributed / two
   agents stay two / yours to edit.
4. **Local by construction** — no account, nothing cached, one SQLite file.
5. **Download** — logo, headline, three platform buttons, GPL-3.0 line.
6. **Footer.**

### Tokens

```css
--ground:      #121110;  /* warm near-black */
--surface:     #161513;  /* cards */
--border:      #232120;
--border-soft: #2a2825;
--text:        #f2efe9;
--text-muted:  #a8a29a;
--text-faint:  #8f8a82;  /* contrast floor - do not go darker */
--accent:      #f0b429;  /* amber */
```

**The amber is not arbitrary**: it is the colour the app itself uses to badge
uncommitted and untracked work. The accent means something. Keep it.

Secondary hues, used only in the hero halo, sampled from the logo:
`#ff4d9d` magenta, `#35d6c4` teal.

### Type

| Role | Face | Notes |
| --- | --- | --- |
| Wordmark | **Outfit** 600 | 21px desktop / 19px mobile, `letter-spacing: -0.015em` |
| Headlines | **Instrument Serif** 400 | h1 78px, h2 52px desktop |
| Body | **IBM Plex Sans** 400/500/600 | |
| Eyebrows, refs, versions | **IBM Plex Mono** 400/500 | 12px, `letter-spacing: 0.18em`, amber |

All four are Google Fonts. Give each a real fallback stack.

### The hero halo

The logo at **168px**, centred above the headline, with:

- A blurred copy of the logo behind it as the colour source — 900px,
  `filter: blur(110px) saturate(2)`, opacity 0.7, breathing 0.58 to 0.82 over 9s.
- Two counter-rotating SVG ring groups: outer 90s clockwise, inner 60s
  anticlockwise, amber / magenta / teal at 10-22% stroke opacity.
- A radial scrim over the bloom so the headline keeps its contrast.
- `drop-shadow` glow on the logo in magenta and teal.

**Wrap all of it in `prefers-reduced-motion`.** The artboards animate
unconditionally because they are mockups; the real site must not.

## Download links

electron-builder names assets with the version in them
(`GitWarren-0.1.0-arm64.dmg`), so `releases/latest/download/<name>` will not
work as a static URL.

1. Fetch the GitHub releases API **at build time** in Astro; bake real URLs in.
2. Add a Netlify build hook and have the app repo's `release.yml` ping it after
   a successful release, so the buttons refresh on every release.
3. Detect OS/arch client-side to pick the primary button — Apple silicon vs
   Intel is worth getting right.

## Placeholders that must be replaced

- Every download href is `#`.
- `v0.1.0` is the real number in the app's `package.json`, but **no release
  exists behind it yet**.

## Copy rules

The copy in the artboards is real and specific. Keep it that way.

- No lorem, no "Welcome to our website", no interchangeable filler.
- **No fabricated testimonials, client logos, or statistics.** There is
  deliberately no social-proof strip — do not invent one.
- Missing a real fact? Use a visibly marked placeholder (`[YOUR PRICE]`), never
  a plausible-looking invention.
- Every product claim on the page was checked against the app's README. Check
  any new one the same way.

## Known loose end

The app still ships an older 128x128 rabbit at
`src/renderer/src/assets/logo.png`, while `src/assets/logo.png` here is derived
from the current 1710x1710 mark. If the app's icon is refreshed, re-export the
web copy from the same source.
