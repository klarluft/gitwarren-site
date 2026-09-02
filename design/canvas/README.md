# Design canvas source

These are the artboards behind the published design canvas:

**https://claude.ai/code/artifact/082039e8-61be-4084-a176-034d35996415**

Open that link to see the design as intended — the artboards animate, and the
canvas lays them out on pages.

## Files

| Artboard | Page | What |
| --- | --- | --- |
| `Main.dc.html` | Landing page | The desktop page, full length. **The deliverable.** |
| `Mobile.dc.html` | Landing page | The same page at 390px. |
| `Wordmark.dc.html` | Landing page | Seven typefaces for the app name. Outfit was chosen. |
| `HeroSpectrum.dc.html` | Not chosen | Hero option B. |
| `HeroPortal.dc.html` | Not chosen | Hero option C. |
| `HeroRabbit.dc.html` | Not chosen | Hero option D — a flat geometric rabbit mark. |
| `TerminalLocal.dc.html` | Not chosen | An early whole-page direction. |
| `Blueprint.dc.html` | Not chosen | An early whole-page direction. |

`canvas.json` is the layout manifest: artboard positions, pages, sticky notes,
and which view a fresh open lands on.

The two "not chosen" whole-page directions still carry an older *"review your
own code"* positioning, from before the page was reframed around agent work.
They are kept as a record, not as a reference.

## These are not shippable

`.dc.html` is Design Component HTML — a format for the canvas editor, not for
the web. It uses `{{handlebars}}` holes, an `<x-dc>` wrapper and a
`<script src="./support.js">` line the editor replaces at render time.

Read them for exact values — colours, sizes, spacing, the halo's blur and
timing — and rebuild in Astro. Do not try to serve them.

## Images

The artboards reference images by bare filename. Those files live in
`../../src/assets/`:

`logo.png`, `hero.jpg`, `untracked.jpg`, `agents.jpg`, `narrow.jpg`

They are compressed for the web (the whole canvas re-publishes on every save,
so each is kept small). For anything needing more resolution, go back to
`../screenshots/` or the 1710px logo source.

## Editing the canvas

The canvas is created and re-seeded by the `/design` skill in Claude Code,
which packages these files into a single self-contained HTML page and publishes
it as an Artifact. To change the design: edit the `.dc.html` files here, then
ask a Claude Code session to re-seed and update the existing canvas at the URL
above.

Edits made visually in the published canvas do **not** flow back to these
files automatically — they can be extracted from the published page, but the
files here are the working copy.
