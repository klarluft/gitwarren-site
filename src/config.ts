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
 * The guides, in the order they are listed everywhere that lists them: the
 * docs index, the footer, and the "next" link at the foot of each page.
 *
 * One array rather than a link in each template, because the ordering is the
 * argument — install, then reach another machine, then the platform-specific
 * corners — and three copies of it drift.
 */
export const DOCS = [
  {
    href: "/docs/install",
    title: "Installing GitWarren",
    blurb:
      "The desktop app, or the command line that serves the same review UI into a browser tab.",
  },
  {
    href: "/docs/another-machine",
    title: "Reviewing on another machine",
    blurb:
      "Add a machine you can reach over ssh, and GitWarren installs itself there over the same connection.",
  },
  {
    href: "/docs/tailnet",
    title: "Your tailnet, and your phone",
    blurb:
      "Let your machines find each other by themselves, get live updates, and open a review on a phone.",
  },
  {
    href: "/docs/wsl",
    title: "WSL, from the Windows app",
    blurb:
      "A WSL distro is a host like any other. Windows-native repositories stay first class.",
  },
  {
    href: "/docs/linux",
    title: "Running on Linux",
    blurb:
      "The AppImage, the headless daemon, the systemd user unit, and the one Tailscale permission.",
  },
  {
    href: "/docs/windows",
    title: "Running on Windows",
    blurb:
      "The installer, starting at logon, and pointing an agent at a Windows-native repository.",
  },
] as const;

export const DOCS_INDEX = "/docs";

/**
 * The Product Hunt listing the hero badge links to.
 *
 * Their embed snippet appends `?embed=true` and three `utm_*` parameters,
 * which are only there to attribute the click back to the badge. We serve the
 * badge ourselves (see `ProductHunt.astro`), so the campaign name would be
 * describing an image Product Hunt never sent — the plain product URL is the
 * one that is true.
 */
export const PRODUCT_HUNT = "https://www.producthunt.com/products/gitwarren";

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
