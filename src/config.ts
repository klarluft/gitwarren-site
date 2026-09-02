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

export const PRIVACY = "/privacy";
export const LEGAL = "/legal";

/**
 * Klarluft B.V. is the controller for everything this site processes, and the
 * operator an EU visitor is entitled to be able to identify.
 *
 * The bracketed values are real gaps, not sample data — fill them from the KvK
 * register before launch. They render in amber on the legal pages, so an
 * unfilled one is impossible to miss.
 */
export const COMPANY = {
  legalName: "Klarluft B.V.",
  address: "[REGISTERED ADDRESS]",
  kvk: "[KVK NUMBER]",
  vat: "[VAT NUMBER]",
  email: "[CONTACT EMAIL]",
} as const;

/** Shown on both legal pages so a visitor can see how current they are. */
export const LEGAL_UPDATED = "2 September 2026";
