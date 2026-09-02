/**
 * Everything on the page that points somewhere real, in one place.
 */

export const REPO = "https://github.com/klarluft/gitwarren-app";
export const RELEASES = `${REPO}/releases`;
export const LICENCE = `${REPO}/blob/main/LICENSE`;

/**
 * The version in the app's package.json. There is no release behind it yet,
 * which is why every download href below is still a placeholder.
 */
export const VERSION = "v0.1.0";

/**
 * PLACEHOLDER. electron-builder puts the version in the asset name
 * (GitWarren-0.1.0-arm64.dmg), so these cannot be static
 * `releases/latest/download/...` URLs — they get baked in at build time from
 * the GitHub releases API. Until that is wired up they stay as `#`.
 */
export const DOWNLOADS = {
  macos: "#",
  windows: "#",
  linux: "#",
} as const;
