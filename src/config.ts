/**
 * Everything on the page that points somewhere real, in one place.
 */

export const REPO = "https://github.com/klarluft/gitwarren-app";
export const RELEASES = `${REPO}/releases`;
export const LICENCE = `${REPO}/blob/main/LICENSE`;

/**
 * Only used when the releases API can't be reached at build time, so the
 * version line still reads sensibly. The real number comes from the release
 * tag — see src/lib/releases.ts.
 */
export const FALLBACK_VERSION = "v0.1.0";
