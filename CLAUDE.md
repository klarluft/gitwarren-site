# gitwarren.com

The marketing site for **GitWarren**, a desktop app for local git code review.

This file carries the decisions already made, so you don't have to re-derive
them. The design is settled, and the page is built.

---

## Working on it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output into dist/
npm run check    # astro check — must stay at 0 errors
npm test         # the download-platform decision matrix
```

**If you are working from a git worktree under `.claude/worktrees/`** and the
build dies with `Tsconfig not found astro/tsconfigs/strict`, the cause is
outside the worktree: the resolver walks up and finds the parent checkout's
`tsconfig.json`, which cannot resolve the bare specifier without its own
`node_modules`. Fix it with `npm ci` in the repository root. CI is unaffected,
because there is no checkout above it.

The page is one route, `src/pages/index.astro`, composed from
`src/components/`. The design system lives in `src/styles/global.css` as a
Tailwind v4 `@theme` block — colours, type scale and spacing are tokens there,
not values scattered through the markup. See **The design** for what it was
built from.

## Why this is a separate repo from the app

The app (`klarluft/gitwarren-app`, checked out at
`~/github.com/klarluft/gitwarren-app`) is GPL-3.0, has a CLA bot on every PR,
and a CI job that rebuilds `better-sqlite3` against Electron headers. Marketing
copy should pay none of those costs, and GPL is the wrong licence for brand
assets. Keep this repo free of app code, and the app repo free of this.

- Domain: **gitwarren.com** (owned; point DNS at Cloudflare)
- Host: **Cloudflare Workers** free tier, static assets only — `wrangler.jsonc`
  has no `main`, so Cloudflare serves `dist/` from its edge without running a
  Worker script. Workers Builds gives preview URLs on pull requests, which is
  the only thing the host is actually being asked for here: downloads redirect
  to GitHub release assets, so host bandwidth is irrelevant.

  Chosen over **Cloudflare Pages** because Pages is in maintenance mode —
  it still works and is still supported, but new development goes to Workers,
  and Cloudflare's own guidance for new projects is to start there. Chosen over
  **Netlify** only marginally: Netlify would have done this fine, and its build
  hook is simpler than the deploy path below.

## Stack

- **Astro** + **Tailwind CSS v4**. Static output, zero JS by default: SEO and
  link unfurls matter more here than interactivity.
- No design system shared with the app. The app's UI is stock shadcn with no
  identity worth propagating; this site has its own, below.

## Repo layout

| Path | What |
| --- | --- |
| `design/canvas/` | The design source. `.dc.html` artboards + `canvas.json`. |
| `design/canvas/images/` | Tiny copies for the canvas payload only. Not for the site. |
| `design/screenshots/` | Full-resolution app screenshots, 2400x1600 @2x. |
| `design/brand/` | The 1710px master logo. |
| `src/assets/` | Image **sources** for the site. Full resolution — see below. |
| `src/pages/index.astro` | The main route. Composes the sections, nothing else. |
| `src/pages/privacy.astro` | Privacy policy. Prose only — see **Analytics and the legal pages**. |
| `src/pages/legal.astro` | Legal notice / imprint. Who operates the site. |
| `src/components/` | The page, in pieces. |
| `src/layouts/Layout.astro` | Shell: fonts, meta, OG tags, canonical, analytics beacon. |
| `src/layouts/Legal.astro` | Prose shell for the two legal pages. Carries their type styles. |
| `src/styles/global.css` | The `@theme` block. Tokens live here, not in markup. |
| `src/config.ts` | Every real URL, the company details, and the download placeholders. |
| `src/env.d.ts` | Types the one build-time env var. |
| `src/lib/images.ts` | `srcset` builder used by `Screenshot.astro`. |

The scripts that regenerate the screenshots live in the app repo
(`scripts/seed-demo.ts`, `scripts/capture-demo.mjs`) — see
`design/screenshots/README.md`.

## Images

`src/assets/` holds full-resolution **sources**, not shippable files:

| File | Size | From |
| --- | --- | --- |
| `hero.png` | 2400x1600 | `design/screenshots/01-review-files-uncommitted.png` |
| `untracked.png` | 2400x1600 | `design/screenshots/09-untracked-file.png` |
| `agents.png` | 2400x1600 | `design/screenshots/08-agent-thread.png` |
| `narrow.png` | 1520x1800 | `design/screenshots/07-files-narrow.png` |
| `logo.png` | 600x600 | `design/brand/gitwarren-logo.png` |
| `hero.webm`, `hero.mp4` | 2400x1600, ~24s | `scripts/capture-hero-video.mjs` in the app repo |

The two videos are the one exception to "sources, not shippable files": Vite
copies them through with a hashed name and no processing, so they are encoded
for delivery already (VP9 and H.264, no audio, 2–3MB each). `hero.png` is the
first frame of the same recording, which is what lets the poster and the video
start identical. Regenerate the three together — see
`design/screenshots/README.md`.

**Use Astro's `<Image>` / `<Picture>` component on them** so the build emits
sized WebP/AVIF derivatives. Do not serve these files directly, and do not
hand-compress them first — that throws away the quality the pipeline needs.

The hero renders at ~1040 CSS px, so a 2400px source covers 2x comfortably.

Ignore `design/canvas/images/` entirely: those are ~50 KB, 880px copies that
exist only because the design canvas re-publishes its whole payload on every
save.

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
5. **Download** — logo, headline, three platform buttons, the Homebrew
   one-liner (`brew install --cask klarluft/tap/gitwarren`; the cask lives in
   the `klarluft/homebrew-tap` repo and bumps itself on each release), GPL-3.0
   line.
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

## How the two artboards were reconciled

They specify 1280px and 390px and say nothing about the widths in between, and
they differ in content as well as in size. The built page resolves that as
follows — change these deliberately, not by accident:

- **One set of copy, the desktop set.** The mobile artboard shortens several
  paragraphs; duplicating text in show/hide pairs would hurt SEO and double the
  maintenance, so the fuller wording is used at every width. The mobile
  artboard governs *layout* only.
- **Everything scales continuously.** Display type, gutters and section rhythm
  are `clamp()`s interpolating linearly between the two artboards, so 900px is
  covered rather than snapping at a breakpoint.
- **The breakpoint is 640px** (`sm`), where the artboards themselves diverge.
  Nav links appear at 768px (`md`); the three-card grids go to three columns at
  1024px (`lg`), because three columns any narrower leaves ~24 characters a
  line.
- **The hero screenshot is art-directed**, not just scaled: `narrow.png` below
  640px, `hero.png` above. A 2400px-wide app UI is unreadable at 390px.
- **The two section screenshots are dropped below 640px**, as the mobile
  artboard does, for the same reason. They are lazy-loaded, so a phone does not
  pay for them.
- **Fonts are self-hosted** via `@fontsource` (latin subsets only) rather than
  linked from Google Fonts as the artboards do, and the two above-the-fold
  faces are preloaded. Same faces, two fewer third-party connections.

## Download links

electron-builder names assets with the version in them
(`GitWarren-0.1.0-arm64.dmg`), so `releases/latest/download/<name>` will not
work as a static URL.

**Done.** `src/lib/releases.ts` resolves them at build time and hands the URLs
to the two components that link downloads.

On the API, use `/releases`, never `/releases/latest`: the latter excludes
prereleases, v0.1.0 is flagged as one, and it 404s. (The web fallback below
*does* use `/releases/latest`, on github.com rather than the API, where it
redirects instead of 404ing — a different endpoint with a different failure
mode.)

### Two lookups, because a build runner has no API quota

Unauthenticated api.github.com is capped at **60 requests an hour per IP**, and
a build runner shares its IP with every other tenant on the box. The quota is
usually spent before the build asks, while a local build — its own IP, its own
quota — resolves fine every time. That is exactly what went wrong: for several
deploys the site said `v0.1.0` and pointed every button at the releases index,
long after v0.1.3 had shipped, and nothing reproduced it in development.

So `src/lib/releases.ts` has two lookups, and tries them in order:

1. **`resolveFromApi`** — `api.github.com/.../releases`, retried three times on
   403/429/5xx. Preferred because it sees prereleases and reads the real asset
   names. Sends `GITHUB_TOKEN` if the environment has one (5000 an hour, per
   token rather than per IP), which is worth setting where it is free — Actions
   has `${{ github.token }}` — but is **not required**.
2. **`resolveFromWeb`** — `github.com/.../releases/latest`, which answers 302
   with the current tag in `Location`. Plain github.com, not the API, so there
   is no budget to exhaust. From the tag it *constructs* the asset names and
   `HEAD`s each one: 302 means the file is there, 404 means it is not, so
   nothing ships unverified.

The one difference, and why the web lookup is second: `/releases/latest` skips
prereleases. If the newest release is flagged as one it resolves the newest
stable instead — older, but true, with every link pointing at a real file.

### Where the token lives

Set in both places the site is built, so the API lookup is the one that
normally answers and prereleases stay visible:

- **Cloudflare Workers Builds** — dashboard, the Worker, **Settings → Build →
  Build variables and secrets**, type *Secret*, name `GITHUB_TOKEN`. A
  fine-grained PAT scoped to public repositories with **no permissions
  selected**: fine-grained tokens carry public read implicitly, and reading a
  public repo's releases needs nothing beyond that. The token exists to make
  the request attributable, not to grant access.
- **GitHub Actions**, in the app repo's `deploy-site.yml` — `${{ github.token }}`.
  Nothing to create or rotate.

**Do not confuse Settings → Build with Settings → Variables & Secrets.** The
latter is *runtime*, and it refuses outright on this Worker — with no `main`
there is no script to inject anything into. That refusal is correct and says
nothing about the build. An hour went into that distinction; it is written down
so the next hour does not.

Neither is load-bearing. `resolveFromWeb` covers a build with no token at all,
and both paths were verified to emit byte-identical URLs.

**`SUFFIX` is the single naming table** both lookups derive from — the API one
turns it into anchored match patterns, the web one into literal filenames.
`npm test` pins it against the real v0.1.3 asset list, including that the
Windows entry is the universal NSIS installer and not one of the per-arch
`.exe` files sitting beside it. Change electron-builder's naming and that test
is what tells you.

### Failing rather than deploying a fallback

If both lookups fail, `fetchDownloads` still returns fallback links and still
never throws — but `assertResolved`, called in `src/pages/index.astro`, then
**fails the build**.

That is deliberate, and it replaces the previous behaviour of falling back
quietly. A fallback build is not a degraded page, it is a *wrong* one: the
buttons drop to the releases index and the version line reads
`FALLBACK_VERSION`. Refusing to build leaves the last good deploy up, which is
at worst one release behind rather than confidently stale. Both lookups failing
now means the build has no network at all, so there is nothing to lose by
stopping. `astro dev` is exempt so the site still runs offline, and
`ALLOW_STALE_DOWNLOADS=1` forces a build through for the same reason.

### The one piece of JavaScript

`src/components/PlatformDownloads.astro` picks the right build for the visitor.
This is the deliberate exception to the zero-JS rule, because without it a
Windows visitor's primary CTA is a macOS disk image and an Intel Mac gets an
Apple-silicon build that will not run.

It is progressive enhancement, and must stay that way:

- Every button is server-rendered with a working Apple-silicon target.
- The platform names in the hero's version line are **real links** to each
  build, server-rendered. That is what makes a wrong guess recoverable, so do
  not turn them back into plain text.
- The decision is a pure function in `src/lib/platform.ts`, tested by
  `npm test`. Change the matrix there, not in the component.

**Mac architecture detection is a heuristic and will sometimes be wrong.**
`navigator.platform` reports `MacIntel` on Apple silicon too — deliberately —
so the signals are `userAgentData.getHighEntropyValues`, which Safari does not
implement, then the WebGL renderer string. An unknown architecture keeps the
Apple-silicon default rather than guessing Intel.

### Redeploys

The app repo's `.github/workflows/deploy-site.yml` rebuilds and deploys this
site on every `release: published` event, so the buttons refresh on their own.
It can also be run by hand from the Actions tab (`workflow_dispatch`) after a
site change lands on `main`.

## Discoverability

What the build ships for search engines and link unfurls, and the parts that
live outside this repo:

- **Sitemap** — `@astrojs/sitemap` emits `sitemap-index.xml`; `public/robots.txt`
  points at it. Submit it once in Google Search Console and Bing Webmaster
  Tools; after that both pick up changes on their own.
- **Structured data** — `src/pages/index.astro` builds a schema.org
  `SoftwareApplication` object (version, platforms, licence, the same download
  URLs the buttons carry) and hands it to `Layout.astro`, which emits it as
  JSON-LD. Keep every value in it something the page already says.
- **`public/llms.txt`** — a plain-text summary for AI assistants. Keep it in
  step with the page copy.
- **Cloudflare's managed robots.txt** was switched **off** for the zone on
  3 September 2026, so `/robots.txt` now serves this repo's file unmodified.
  Left on, Cloudflare prepends disallows for ClaudeBot, GPTBot and others,
  which stops assistants reading the page and recommending the app. It is a
  dashboard setting (Security → Settings → Bot traffic), not a file here, so
  a zone-wide change can undo it silently — `curl https://gitwarren.com/robots.txt`
  is the check.
- **OG image** is cropped from the hero at build time in `Layout.astro`. The
  GitHub repo's social preview is a separate upload in the repo settings.

## Analytics and the legal pages

**There is no cookie banner, and adding one would be a mistake.** The rule that
produces consent banners is ePrivacy Article 5(3): you must ask before storing
or reading information on the visitor's device. Nothing here does that, so
there is nothing to consent to. A banner would be pure friction with no legal
work to do.

That is a constraint on what may be added later, not just a description of
today. **Anything that sets a cookie, writes to local storage, or fingerprints
the visitor changes the answer** and drags a consent flow onto the page with
it. Weigh that cost before adding one.

### The measurement

Cloudflare Web Analytics, chosen over Plausible because it is free and already
inside the account that hosts the site. Cookieless: no identifier reaches the
browser, and visit uniqueness is computed server-side from a hash Cloudflare
discards.

**The beacon is injected at the edge, not built into the page.** Web Analytics
is set to automatic injection (dashboard → Web Analytics → Manage site →
*Enable*), so Cloudflare rewrites the HTML on the way out and this repo ships
no analytics JavaScript at all. Two things follow, and both matter:

- **`PUBLIC_CF_BEACON_TOKEN` must stay unset.** `Layout.astro` still knows how
  to emit the beacon itself, and setting the variable would put a second copy
  on the page and double-count every visit. The manual path is kept
  deliberately, as a dormant fallback: edge injection depends on Cloudflare
  being able to rewrite the response, and if it ever stops working the fix is
  one environment variable rather than a code change. See `.env.example`.
- **Automatic injection only changes where the data goes**, not where the
  script comes from. `beacon.min.js` is still fetched from
  `static.cloudflareinsights.com`; what becomes first-party is the
  measurement POST, which goes to `gitwarren.com/cdn-cgi/rum` instead of
  Cloudflare's domain. So the privacy policy's claim that the page makes
  exactly one third-party request is still true. Do not "improve" it into
  *no* third-party requests — that is wrong.

Injection is also what keeps dev, previews and forks out of the production
numbers: it happens on this zone only, and Workers Builds previews live on
`*.workers.dev`.

Two things silently break it. A `Cache-Control` containing `no-transform`
stops Cloudflare rewriting the payload, and so does invalid HTML.

**To check whether injection is live, send a browser `User-Agent`.** Cloudflare
only rewrites HTML for requests that look like a browser, so a plain `curl`
sees no beacon on a working site and it is easy to conclude, wrongly, that
injection is off:

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
  AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36" \
  -H 'Accept: text/html' https://gitwarren.com | grep -o '"token":"[a-f0-9]*"'
```

The docs suggest a GET to `/cdn-cgi/rum` should answer **405** when the
endpoint is armed. It does not here — it answers **404** even with injection
demonstrably working — so that check is useless on this site. Grep the HTML
instead.

**The token it prints will not match the `siteTag` in the dashboard URL, and
that is correct.** Cloudflare gives each Web Analytics site two identifiers:
`site_tag` names it in the dashboard, `site_token` goes in the beacon. Both
are 32 hex characters, so the mismatch reads like two separate site entries
with the traffic landing in the wrong one. It isn't. For the record, this
site's tag is `85d349df…` and its token is `c170321…`. Don't go looking for a
duplicate to delete.

This is still the *second* deliberate exception to the zero-JS rule, after the
platform picker — the page runs the beacon, even though the repo does not
contain it.

### The pages

`privacy.astro` and `legal.astro`, both on `layouts/Legal.astro`, which carries
their prose styles as scoped `:global()` rules — legal pages are the only place
on the site with real reading length, so they get a 42rem measure and a smaller
type scale than the marketing sections. No new tokens were invented for them.

**The privacy policy is a factual document, not boilerplate.** Every claim in
it was checked against this repo and the app repo: no storage in
`PlatformDownloads.astro`, no telemetry anywhere in the app, self-hosted fonts,
and the updater's six-hourly GitHub check as the app's only outbound request.
If any of those change, the policy is wrong and must change with them.

A legal notice is there because EU rules entitle a visitor to identify the
operator of an online service before downloading from it. Terms of Use and a
separate cookie policy were considered and deliberately skipped: GPL-3.0
governs the app, and a page saying "we set no cookies" is one line, not a page.

## Placeholders that must be replaced

- `PUBLIC_CF_BEACON_TOKEN` is not set anywhere yet, so nothing is measured.

**`COMPANY` in `src/config.ts` is filled in**, from the details published on
klarluft.com and cross-checked against the page source: Van Aerssenlaan 40C,
3039 KE Rotterdam, KvK 86875590, VAT NL864128915B01,
`contact@klarluft.com`. These are load-bearing rather than decorative — the
legal notice exists so a visitor can identify who operates the service — so if
the company moves or the contact address changes, both legal pages are wrong
until `COMPANY` changes with it.

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
