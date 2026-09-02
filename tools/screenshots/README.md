# Regenerating the app screenshots

The screenshots in `design/screenshots/` are not taken by hand. These two
scripts produce the whole set, so it can be regenerated when the app's UI
changes rather than re-staged manually.

**They have to run inside a checkout of the app**, because `seed-demo.ts`
imports the app's own services and schema. Copy them into
`~/github.com/klarluft/gitwarren-app/scripts/` to use them, and don't commit
them there — that repo is deliberately kept free of marketing tooling.

| Script | What it does |
| --- | --- |
| `seed-demo.ts` | Writes demo repositories, reviews and comment threads into a throwaway database, through the same services the app and its MCP server use — so anchors are captured against a real diff and agent comments carry real MCP attribution. Refuses to write to a database that already has repositories in it. |
| `capture-demo.mjs` | Drives the running app over the Chrome DevTools Protocol and captures each screen. Not `screencapture(1)`: talking to the renderer needs no Screen Recording permission, catches nothing else on the desktop, and gives an exact viewport at a guaranteed 2x. |

## Full procedure

```bash
APP=~/github.com/klarluft/gitwarren-app
cp seed-demo.ts capture-demo.mjs "$APP/scripts/"
cd "$APP"

# 1. Demo repositories the reviews point at. seed-demo.ts expects them under
#    ~/github.com/klarluft (override with DEMO_REPO_ROOT):
#      gitwarren-app     — a clone with a demo branch carrying staged,
#                          unstaged and untracked changes at once
#      gitwarren-docs    — any small repo, to fill the list
#      klarluft-website  — likewise

# 2. Seed a throwaway database
rm -rf /tmp/gw-demo
GITWARREN_DATA_DIR=/tmp/gw-demo npx tsx scripts/seed-demo.ts

# 3. Run a packaged build, so the MCP panel prints a real install path
npx electron-vite build && npx vite build --config vite.mcp.config.ts
npx electron-builder --dir --publish never
cp -R release/0.1.0/mac-arm64/GitWarren.app ~/Applications/
GITWARREN_DATA_DIR=/tmp/gw-demo \
  ~/Applications/GitWarren.app/Contents/MacOS/GitWarren --remote-debugging-port=9222 &

# 4. Capture
SHOT_DIR=~/github.com/klarluft/gitwarren-site/design/screenshots \
  node scripts/capture-demo.mjs
```

The unpackaged app works for every shot except `11-agent-access.png`, where the
MCP config would print the dev checkout's path instead of an install path.

## Two things that will bite

**Backdate the reviews last.** Every comment thread bumps its review's
`updatedAt`, so backdating reviews before creating the discussion leaves them
all reading "just now". `seed-demo.ts` already does this in the right order.

**Commit dates come from git, not the seed.** They cannot be backdated from the
script. If the commits tab shows "18 minutes ago" while the review says it was
last active three hours ago, rewrite the demo branch's commit dates before
capturing.

## The demo repositories are gone

The throwaway repositories these scripts were originally run against were
deleted. Recreating them is the only manual part of the process: a clone of
the app with a feature branch that has one staged file, one unstaged file and
one untracked file at the same time, plus two other small repos to populate
the repository list.
