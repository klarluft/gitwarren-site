import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  assertResolved,
  assetName,
  matcher,
  OVERRIDE,
  PLATFORMS,
  selectRelease,
  type Downloads,
  type GitHubRelease,
  type Source,
} from "./releases.ts";

/**
 * The guard that keeps a rate-limited build from deploying fallback links.
 *
 * This is the actual regression: for several deploys the live page said
 * v0.1.0 and every button went to the releases index, because the build's
 * unauthenticated API call was rate-limited and the fallback shipped silently.
 */
const downloads = (source: Source): Downloads => ({
  version: "v9.9.9",
  macosArm: "https://example.test/arm.dmg",
  macosIntel: "https://example.test/x64.dmg",
  windows: "https://example.test/setup.exe",
  linux: "https://example.test/x86_64.AppImage",
  linuxArm: "https://example.test/arm64.AppImage",
  source,
});

describe("assertResolved", () => {
  afterEach(() => {
    delete process.env[OVERRIDE];
  });

  it("passes a build that read the releases API", () => {
    assertResolved(downloads("api"), false);
  });

  it("passes a build that fell through to the github.com lookup", () => {
    assertResolved(downloads("web"), false);
  });

  it("fails a production build that fell back", () => {
    assert.throws(() => assertResolved(downloads("none"), false), /github\.com/);
  });

  it("lets astro dev fall back, so the site runs offline", () => {
    assertResolved(downloads("none"), true);
  });

  it("lets an explicit override through", () => {
    process.env[OVERRIDE] = "1";
    assertResolved(downloads("none"), false);
  });

  it("ignores anything but 1 in the override", () => {
    process.env[OVERRIDE] = "true";
    assert.throws(() => assertResolved(downloads("none"), false));
  });
});

/**
 * Which release the download buttons are allowed to point at.
 *
 * The prerelease clause is the one worth a test: for a while this lookup
 * deliberately took the newest non-draft release *because* v0.1.0 was a
 * prerelease and there was nothing else to show. Once stable releases existed,
 * that same line became the way a beta would reach everyone arriving at the
 * site — the opposite of what publishing a beta is for.
 */
describe("selectRelease", () => {
  const entry = (tag: string, flags: Partial<GitHubRelease> = {}): GitHubRelease => ({
    tag_name: tag,
    draft: false,
    prerelease: false,
    assets: [],
    ...flags,
  });

  /** The app repository's own list, newest first, while v0.1.7 was in beta. */
  const real = [
    entry("v0.1.7-beta.2", { draft: true, prerelease: true }),
    entry("v0.1.7-beta.1", { draft: true, prerelease: true }),
    entry("v0.1.6"),
    entry("v0.1.5"),
    entry("v0.1.0", { prerelease: true }),
  ];

  it("takes the newest stable release", () => {
    assert.equal(selectRelease(real)?.tag_name, "v0.1.6");
  });

  it("walks past a published prerelease", () => {
    const published = [entry("v0.1.7-beta.2", { prerelease: true }), ...real];
    assert.equal(selectRelease(published)?.tag_name, "v0.1.6");
  });

  it("walks past a draft, whose assets nobody else can download", () => {
    const drafted = [entry("v0.2.0", { draft: true }), ...real];
    assert.equal(selectRelease(drafted)?.tag_name, "v0.1.6");
  });

  it("answers with nothing when there is no stable release at all", () => {
    assert.equal(selectRelease([entry("v0.1.0", { prerelease: true })]), null);
    assert.equal(selectRelease([]), null);
  });
});

/**
 * `SUFFIX` is load-bearing twice over: the API lookup matches asset names
 * against it, and the github.com fallback *constructs* them from it. If it
 * drifts from what electron-builder actually emits, the fallback builds URLs
 * that 404 — caught at build time by the HEAD check, but far better caught
 * here. These are the real asset names from v0.1.3.
 */
describe("electron-builder's naming convention", () => {
  const real = [
    "GitWarren-0.1.3-arm64.AppImage",
    "GitWarren-0.1.3-arm64.dmg",
    "GitWarren-0.1.3-arm64.dmg.blockmap",
    "GitWarren-0.1.3-arm64.exe",
    "GitWarren-0.1.3-arm64.zip",
    "GitWarren-0.1.3-x64.dmg",
    "GitWarren-0.1.3-x64.dmg.blockmap",
    "GitWarren-0.1.3-x64.exe",
    "GitWarren-0.1.3-x64.zip",
    "GitWarren-0.1.3-x86_64.AppImage",
    "GitWarren-0.1.3.exe",
    "GitWarren-0.1.3.exe.blockmap",
  ];

  it("constructs the name each platform actually has", () => {
    assert.deepEqual(
      PLATFORMS.map((p) => assetName(p, "v0.1.3")),
      [
        "GitWarren-0.1.3-arm64.dmg",
        "GitWarren-0.1.3-x64.dmg",
        "GitWarren-0.1.3.exe",
        "GitWarren-0.1.3-x86_64.AppImage",
        "GitWarren-0.1.3-arm64.AppImage",
      ],
    );
  });

  it("matches exactly one real asset per platform", () => {
    for (const platform of PLATFORMS) {
      const hits = real.filter((name) => matcher(platform).test(name));
      assert.deepEqual(hits, [assetName(platform, "v0.1.3")], platform);
    }
  });

  it("never matches a blockmap, a zip, or a per-arch exe", () => {
    const decoys = real.filter(
      (name) => !PLATFORMS.some((p) => name === assetName(p, "v0.1.3")),
    );
    for (const name of decoys) {
      for (const platform of PLATFORMS) {
        assert.equal(matcher(platform).test(name), false, `${platform} matched ${name}`);
      }
    }
  });

  it("tolerates a tag with or without its leading v", () => {
    assert.equal(assetName("windows", "0.1.3"), assetName("windows", "v0.1.3"));
  });
});
