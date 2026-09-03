import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { assertResolved, OVERRIDE, type Downloads } from "./releases.ts";

/**
 * The guard that keeps a rate-limited build from deploying fallback links.
 *
 * This is the actual regression: for several deploys the live page said
 * v0.1.0 and every button went to the releases index, because the build's
 * unauthenticated API call was rate-limited and the fallback shipped silently.
 */
const downloads = (resolved: boolean): Downloads => ({
  version: "v9.9.9",
  macosArm: "https://example.test/arm.dmg",
  macosIntel: "https://example.test/x64.dmg",
  windows: "https://example.test/setup.exe",
  linux: "https://example.test/x86_64.AppImage",
  linuxArm: "https://example.test/arm64.AppImage",
  resolved,
});

describe("assertResolved", () => {
  afterEach(() => {
    delete process.env[OVERRIDE];
  });

  it("passes a build that read the releases API", () => {
    assertResolved(downloads(true), false);
  });

  it("fails a production build that fell back", () => {
    assert.throws(() => assertResolved(downloads(false), false), /GITHUB_TOKEN/);
  });

  it("lets astro dev fall back, so the site runs offline", () => {
    assertResolved(downloads(false), true);
  });

  it("lets an explicit override through", () => {
    process.env[OVERRIDE] = "1";
    assertResolved(downloads(false), false);
  });

  it("ignores anything but 1 in the override", () => {
    process.env[OVERRIDE] = "true";
    assert.throws(() => assertResolved(downloads(false), false));
  });
});
