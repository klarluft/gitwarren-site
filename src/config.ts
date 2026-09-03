/**
 * Everything on the page that points somewhere real, in one place.
 */

export const REPO = "https://github.com/klarluft/gitwarren-app";
export const RELEASES = `${REPO}/releases`;
export const LICENCE = `${REPO}/blob/main/LICENSE`;

/**
 * Shown only when the releases API can't be reached, which a production build
 * now refuses to ship (see `assertResolved` in src/lib/releases.ts) — so in
 * practice this reaches the page under `astro dev` alone.
 *
 * Deliberately not a real version. It used to be "v0.1.0", and a fallback
 * build duly told everyone the current release was v0.1.0 long after v0.1.3
 * had shipped. A number nobody can mistake for a release is the point.
 */
export const FALLBACK_VERSION = "v0.0.0-dev";
