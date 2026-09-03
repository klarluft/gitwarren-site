import { RELEASES, REPO } from "../config.ts";

const SLUG = REPO.split("github.com/")[1];

/**
 * Download URLs, resolved at build time.
 *
 * electron-builder puts the version in every asset name
 * (GitWarren-0.1.0-arm64.dmg), so there is no static
 * `releases/latest/download/<name>` URL to hard-code — the names change on
 * every release. Hence the lookup.
 */
export interface Downloads {
  /** Tag these point at, e.g. "v0.1.3". */
  version: string;
  macosArm: string;
  macosIntel: string;
  windows: string;
  linux: string;
  linuxArm: string;
  /** Which of the two lookups produced these — or "none" for the fallback. */
  source: Source;
}

/** @see resolveFromApi, resolveFromWeb, and the fallback in `fetchDownloads`. */
export type Source = "api" | "web" | "none";

/** The platforms the primary button can resolve to. */
export type PlatformKey = "macosArm" | "macosIntel" | "windows" | "linux" | "linuxArm";

/**
 * electron-builder's naming convention, once, as the suffix after
 * `GitWarren-<version>`. Both lookups derive from this: the API one matches
 * asset names against it, the web one constructs them from it. Keeping it in
 * one place is what stops the two paths from disagreeing about what a Windows
 * build is called.
 *
 * Windows has no arch suffix on purpose — that is the universal NSIS
 * installer, which carries both x64 and arm64. The per-arch `.exe` files sit
 * beside it and are not what anyone should be handed.
 */
const SUFFIX: Record<PlatformKey, string> = {
  macosArm: "-arm64.dmg",
  macosIntel: "-x64.dmg",
  windows: ".exe",
  linux: "-x86_64.AppImage",
  linuxArm: "-arm64.AppImage",
};

export const PLATFORMS = Object.keys(SUFFIX) as PlatformKey[];

/**
 * Anchored, so `GitWarren-0.1.3-arm64.dmg.blockmap` cannot pass for the dmg
 * and `GitWarren-0.1.3-x64.exe` cannot pass for the universal installer.
 */
export function matcher(platform: PlatformKey): RegExp {
  const escaped = SUFFIX[platform].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^GitWarren-[\\d.]+${escaped}$`);
}

export function assetName(platform: PlatformKey, version: string): string {
  return `GitWarren-${version.replace(/^v/, "")}${SUFFIX[platform]}`;
}

const NOWHERE: Record<PlatformKey, string | null> = {
  macosArm: null,
  macosIntel: null,
  windows: null,
  linux: null,
  linuxArm: null,
};

function assemble(
  version: string,
  found: Record<PlatformKey, string | null>,
  source: Source,
): Downloads {
  for (const platform of PLATFORMS) {
    if (!found[platform]) console.warn(`[releases] no ${platform} asset in ${version}`);
  }
  return {
    version,
    macosArm: found.macosArm ?? RELEASES,
    macosIntel: found.macosIntel ?? RELEASES,
    windows: found.windows ?? RELEASES,
    linux: found.linux ?? RELEASES,
    linuxArm: found.linuxArm ?? RELEASES,
    source,
  };
}

/** Nothing here is worth stalling a build over. */
const TIMEOUT = 10_000;

const UA = { "User-Agent": "gitwarren-site-build" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* The API lookup — preferred, because it sees prereleases              */
/* ------------------------------------------------------------------ */

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
}

/**
 * NOT `/releases/latest` — that endpoint excludes prereleases, and v0.1.0 is
 * flagged as one, so it 404s. Take the newest non-draft release instead, which
 * keeps working whether or not a release is marked prerelease.
 */
const API = `https://api.github.com/repos/${SLUG}/releases`;

/**
 * Unauthenticated api.github.com allows 60 requests an hour *per IP*, and a
 * build runner's IP is shared with every other tenant on the box — so the
 * quota is usually gone before the build asks. That is why the deployed page
 * advertised v0.1.0 while v0.1.3 was current, and why a local build, with its
 * own quota, never reproduced it.
 *
 * A token raises the limit to 5000 an hour, counted per token rather than per
 * IP. It is an optimisation, not a requirement: without one this lookup fails
 * and `resolveFromWeb` picks up. Set it where it is free to set — Actions has
 * `${{ github.token }}`.
 */
function authHeader(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** What the API says about the quota, for the build log. */
function quota(res: Response): string {
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining === null) return "";
  const reset = res.headers.get("x-ratelimit-reset");
  const at = reset ? new Date(Number(reset) * 1000).toISOString() : "unknown";
  return ` (rate limit ${remaining}/${res.headers.get("x-ratelimit-limit")} left, resets ${at})`;
}

const ATTEMPTS = 3;

/** The rate limit, and the API having a moment. Both can come good. */
const RETRYABLE = /^(403|429|5\d\d)$/;

async function resolveFromApi(): Promise<Downloads | null> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(attempt * 1000);

    try {
      const res = await fetch(API, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...UA,
          ...authHeader(),
        },
        signal: AbortSignal.timeout(TIMEOUT),
      });

      if (!res.ok) {
        console.warn(
          `[releases] api: ${res.status} on attempt ${attempt}/${ATTEMPTS}${quota(res)}`,
        );
        // A 401 (bad token) or 404 (wrong repo) will never come good.
        if (RETRYABLE.test(String(res.status))) continue;
        return null;
      }

      const release = ((await res.json()) as GitHubRelease[]).find((r) => !r.draft);
      if (!release) {
        console.warn("[releases] api: no non-draft release");
        return null;
      }

      const found = { ...NOWHERE };
      for (const platform of PLATFORMS) {
        const pattern = matcher(platform);
        found[platform] =
          release.assets.find((a) => pattern.test(a.name))?.browser_download_url ?? null;
      }
      return assemble(release.tag_name, found, "api");
    } catch (error) {
      console.warn(`[releases] api: attempt ${attempt}/${ATTEMPTS} failed (${String(error)})`);
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* The web fallback — no API budget to run out of                       */
/* ------------------------------------------------------------------ */

/**
 * github.com, not api.github.com, so none of this touches the 60-an-hour
 * budget the API lookup can exhaust. `/releases/latest` answers 302 with the
 * current tag in `Location`, and every asset URL answers 302 to a signed
 * download or 404 if it does not exist — which is what makes it safe to
 * *construct* the names from `SUFFIX` rather than read them: nothing is
 * shipped that has not been confirmed to resolve.
 *
 * The one real difference from the API path, and the reason it is second:
 * `/releases/latest` skips prereleases. If the newest release is flagged as
 * one, this resolves the newest stable instead — old, but true, and every
 * link still points at a file that exists.
 */
const LATEST = `https://github.com/${SLUG}/releases/latest`;

async function head(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      headers: UA,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    // 302 to the signed asset host is the success case; 200 if that ever changes.
    return res.status === 302 || res.ok;
  } catch (error) {
    console.warn(`[releases] web: HEAD ${url} failed (${String(error)})`);
    return false;
  }
}

async function resolveFromWeb(): Promise<Downloads | null> {
  let version: string;
  try {
    const res = await fetch(LATEST, {
      method: "HEAD",
      redirect: "manual",
      headers: UA,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const tag = res.headers.get("location")?.match(/\/releases\/tag\/(.+)$/)?.[1];
    if (!tag) {
      console.warn(`[releases] web: ${res.status}, no tag in Location`);
      return null;
    }
    version = decodeURIComponent(tag);
  } catch (error) {
    console.warn(`[releases] web: could not read the latest tag (${String(error)})`);
    return null;
  }

  const urls = Object.fromEntries(
    PLATFORMS.map((platform) => [
      platform,
      `https://github.com/${SLUG}/releases/download/${version}/${assetName(platform, version)}`,
    ]),
  ) as Record<PlatformKey, string>;

  const live = await Promise.all(PLATFORMS.map((platform) => head(urls[platform])));

  const found = { ...NOWHERE };
  PLATFORMS.forEach((platform, i) => {
    if (live[i]) found[platform] = urls[platform];
  });

  // Every constructed name missing means the convention moved, not that one
  // build was skipped. Guessing further would only produce dead links.
  if (!Object.values(found).some(Boolean)) {
    console.warn(`[releases] web: no constructed asset name resolved in ${version}`);
    return null;
  }
  return assemble(version, found, "web");
}

/* ------------------------------------------------------------------ */

/**
 * Never throws. If both lookups fail, every link falls back to the releases
 * page — but see `assertResolved`, which is what stops a fallback from being
 * *deployed*.
 */
export async function fetchDownloads(fallbackVersion: string): Promise<Downloads> {
  const downloads = (await resolveFromApi()) ?? (await resolveFromWeb());

  if (downloads) {
    console.log(`[releases] resolved ${downloads.version} via ${downloads.source}`);
    return downloads;
  }

  console.warn("[releases] both lookups failed; using fallback links");
  return assemble(fallbackVersion, { ...NOWHERE }, "none");
}

/** Set to `1` to build anyway — for working offline, and nothing else. */
export const OVERRIDE = "ALLOW_STALE_DOWNLOADS";

/**
 * Refuse to build a page whose download links are the fallback.
 *
 * Falling back looks harmless and is not: the buttons drop to the releases
 * index and the version line reads `FALLBACK_VERSION`, a number that is a lie
 * the moment a newer release exists — which is exactly what shipped when
 * v0.1.3 was current and the page still said v0.1.0. A build that can reach
 * neither GitHub API nor github.com has nothing true to say about downloads,
 * so it should not produce a deployable page; the previous deploy stays up,
 * at worst one release behind instead of confidently wrong.
 *
 * `astro dev` is exempt, so the site still runs offline.
 */
export function assertResolved(downloads: Downloads, dev: boolean): void {
  if (downloads.source !== "none" || dev || process.env[OVERRIDE] === "1") return;

  throw new Error(
    "Could not resolve download links from either the GitHub releases API or " +
      "github.com, so this build would ship the releases page and a " +
      "hard-coded version number.\n" +
      "  Both lookups failing usually means the build has no network at all.\n" +
      `  To build anyway (offline work only): ${OVERRIDE}=1`,
  );
}
