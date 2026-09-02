# Product screenshots

Dark theme, 2x, captured from a packaged build against a seeded demo database.
Nothing here touches a real repository or the real GitWarren database.

Every image is the app's own renderer, captured over the DevTools protocol —
no window chrome, no desktop, no wallpaper showing through rounded corners. The
band of empty space at the top of the wide shots is the app's title bar area,
which is where a landing page would draw its own traffic lights.

## The set

| File | Size | What it shows |
| --- | --- | --- |
| `01-review-files-uncommitted.png` | 1200×800 | **The hero.** Branch header with the amber *uncommitted work* badge, the *Include uncommitted* switch, and the "1 staged, 1 unstaged, 1 untracked" banner. |
| `09-untracked-file.png` | 1200×800 | **The differentiator.** A file that exists only in the working tree, badged *untracked*, with a multi-line agent comment anchored to it. |
| `10-inline-thread.png` | 1200×800 | A file badged *uncommitted*, additions against a deletion, collapsed-context expanders. |
| `08-agent-thread.png` | 1200×800 | An agent finding something real and a human answering, plus a resolved thread below. |
| `02-review-conversation.png` | 1200×800 | Top of the conversation tab: description, first thread, the `(AI)` attribution. |
| `11-agent-access.png` | 1200×800 | The MCP block the app prints for a real install path. |
| `03-repository-reviews.png` | 1200×800 | Reviews against one repository, open/closed/all filter. |
| `04-home-repositories.png` | 1200×800 | The entry point: three tracked repositories. |
| `05-review-commits.png` | 1200×800 | The commits tab. |
| `06-conversation-narrow.png` | 760×900 | Portrait crop for a mobile breakpoint. |
| `07-files-narrow.png` | 760×900 | Portrait crop of the diff. |

## Notes for the landing page

- **Lead with 01 or 09.** Both say the thing no other review tool says: the work
  under review is not a commit yet. 09 is the stronger image, 01 is the clearer
  explanation.
- `03`, `04` and `11` have deliberate empty space below the content. Crop them
  rather than scaling them down.
- A healthy repository shows **no** git-state badge — GitWarren only badges
  problems. That is correct behaviour, not a missing screenshot.

## Regenerating

The scripts that produce this set live in the **app** repository, because
`seed-demo.ts` imports the app's own services and `capture-demo.mjs` drives the
running app:

- `scripts/seed-demo.ts` — writes demo repositories, reviews and comment
  threads into a throwaway database through the same services the app and its
  MCP server use, so anchors are captured against a real diff and agent
  comments carry real MCP attribution.
- `scripts/capture-demo.mjs` — drives the app over the Chrome DevTools
  Protocol. No Screen Recording permission, nothing else on the desktop in
  frame, an exact viewport at a guaranteed 2x.

```bash
cd ~/github.com/klarluft/gitwarren-app

# 1. Demo repositories the reviews point at. Expected under
#    ~/github.com/klarluft (override with DEMO_REPO_ROOT):
#      gitwarren-app     - a clone with a demo branch carrying staged,
#                          unstaged and untracked changes at the same time
#      gitwarren-docs    - any small repo, to fill the list
#      klarluft-website  - likewise

# 2. Seed a throwaway database
rm -rf /tmp/gw-demo
GITWARREN_DATA_DIR=/tmp/gw-demo npx tsx scripts/seed-demo.ts

# 3. Run a packaged build, so the MCP panel prints a real install path
npx electron-vite build && npx vite build --config vite.mcp.config.ts
npx electron-builder --dir --publish never
cp -R release/0.1.0/mac-arm64/GitWarren.app ~/Applications/
GITWARREN_DATA_DIR=/tmp/gw-demo \
  ~/Applications/GitWarren.app/Contents/MacOS/GitWarren --remote-debugging-port=9222 &

# 4. Capture straight into this directory
SHOT_DIR=~/github.com/klarluft/gitwarren-site/design/screenshots \
  node scripts/capture-demo.mjs
```

The unpackaged app works for every shot except `11-agent-access.png`, where the
MCP config would print the dev checkout's path instead of an install path.

### Two things that will bite

**Backdate the reviews last.** Every comment thread bumps its review's
`updatedAt`, so backdating reviews before creating the discussion leaves them
all reading "just now". `seed-demo.ts` already does this in the right order.

**Commit dates come from git, not the seed.** They cannot be backdated from the
script. If the commits tab reads "18 minutes ago" while the review says it was
last active three hours ago, rewrite the demo branch's commit dates first.

### The demo repositories are gone

The throwaway repositories this set was captured against were deleted.
Recreating them is the only manual part: a clone of the app with a feature
branch that has one staged file, one unstaged file and one untracked file at
the same time, plus two other small repos to populate the repository list.
