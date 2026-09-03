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

export const PRIVACY = "/privacy";
export const LEGAL = "/legal";

/**
 * Klarluft B.V. is the controller for everything this site processes, and the
 * operator an EU visitor is entitled to be able to identify.
 *
 * These are the details published on klarluft.com, and they are load-bearing:
 * the legal notice exists to let a visitor identify who runs this service, so
 * if the company moves or the contact address changes, this is what makes the
 * page wrong. Keep it in step with the KvK register.
 */
export const COMPANY = {
  legalName: "Klarluft B.V.",
  address: "Van Aerssenlaan 40C, 3039 KE Rotterdam, The Netherlands",
  kvk: "86875590",
  vat: "NL864128915B01",
  email: "contact@klarluft.com",
} as const;

/** Shown on both legal pages so a visitor can see how current they are. */
export const LEGAL_UPDATED = "3 September 2026";
