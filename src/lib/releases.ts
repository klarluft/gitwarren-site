import { RELEASES, REPO } from "../config.ts";

/**
 * Download URLs, resolved at build time from the GitHub releases API.
 *
 * electron-builder puts the version in every asset name
 * (GitWarren-0.1.0-arm64.dmg), so there is no static
 * `releases/latest/download/<name>` URL to hard-code — the names change on
 * every release. Hence the build-time fetch.
 */
export interface Downloads {
  /** Tag of the release these point at, e.g. "v0.1.0". */
  version: string;
  macosArm: string;
  macosIntel: string;
  windows: string;
  linux: string;
  linuxArm: string;
  /**
   * True when a real release was read from the API. False means the API could
   * not be reached at all and every link falls back to the releases page.
   *
   * An individual asset missing from an otherwise readable release does not
   * clear this — that one link falls back and is warned about, but the rest of
   * the page is still telling the truth.
   */
  resolved: boolean;
}

/** The platforms the primary button can resolve to. */
export type PlatformKey = "macosArm" | "macosIntel" | "windows" | "linux" | "linuxArm";

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
const API = `https://api.github.com/repos/${REPO.split("github.com/")[1]}/releases`;

/** electron-builder's own artefacts, never user downloads. */
const NOT_A_DOWNLOAD = /\.(blockmap|yml|yaml)$/i;

const PICKERS: Record<PlatformKey, RegExp> = {
  macosArm: /-arm64\.dmg$/i,
  macosIntel: /-x64\.dmg$/i,
  // The universal NSIS installer: no arch suffix, carries both x64 and arm64.
  windows: /^GitWarren-[\d.]+\.exe$/i,
  linux: /x86_64\.AppImage$/i,
  linuxArm: /-arm64\.AppImage$/i,
};

function pick(assets: GitHubAsset[], pattern: RegExp): string | null {
  const hit = assets
    .filter((a) => !NOT_A_DOWNLOAD.test(a.name))
    .find((a) => pattern.test(a.name));
  return hit?.browser_download_url ?? null;
}

/**
 * Unauthenticated calls to api.github.com are capped at 60 an hour *per IP*,
 * and a build runner's IP is shared with every other tenant on the box. That
 * is why the deployed page kept falling back while a local build resolved
 * fine: the developer machine had its own quota, the runner had none left.
 *
 * A token — `${{ github.token }}` in Actions, a fine-grained PAT with no
 * scopes at all in the Cloudflare build settings, since the repository is
 * public — raises the limit to 5000 an hour and is per-token, not per-IP.
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

/** Statuses worth a second look: the rate limit, and the API misbehaving. */
const RETRYABLE = /^(403|429|5\d\d)$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Never throws. A rate-limited or offline build falls back to the releases
 * page rather than failing here — but see `assertResolved`, which is what
 * stops a fallback from being *deployed*.
 */
export async function fetchDownloads(fallbackVersion: string): Promise<Downloads> {
  const fallback: Downloads = {
    version: fallbackVersion,
    macosArm: RELEASES,
    macosIntel: RELEASES,
    windows: RELEASES,
    linux: RELEASES,
    linuxArm: RELEASES,
    resolved: false,
  };

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    // Transient by nature: a shared runner's quota can free up, and 5xx from
    // the API is usually gone a second later. Worth three tries before
    // giving up on the whole release.
    if (attempt > 1) await sleep(attempt * 1000);

    try {
      const res = await fetch(API, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "gitwarren-site-build",
          ...authHeader(),
        },
      });
      if (!res.ok) {
        console.warn(
          `[releases] GitHub API returned ${res.status} on attempt ${attempt}/${ATTEMPTS}${quota(res)}`,
        );
        // 403/429 is the rate limit and 5xx is the API having a moment; both
        // can come good. A 401 (bad token) or 404 (wrong repo) will not, so
        // stop and let the build fail with something readable.
        if (RETRYABLE.test(String(res.status))) continue;
        break;
      }

      const releases = (await res.json()) as GitHubRelease[];
      const release = releases.find((r) => !r.draft);
      if (!release) {
        console.warn("[releases] no non-draft release found; using fallback links");
        return fallback;
      }

      const found = Object.fromEntries(
        (Object.keys(PICKERS) as PlatformKey[]).map((key) => [
          key,
          pick(release.assets, PICKERS[key]),
        ]),
      ) as Record<PlatformKey, string | null>;

      for (const [platform, url] of Object.entries(found)) {
        if (!url) console.warn(`[releases] no ${platform} asset in ${release.tag_name}`);
      }

      console.log(`[releases] resolved downloads from ${release.tag_name}`);

      return {
        version: release.tag_name,
        macosArm: found.macosArm ?? RELEASES,
        macosIntel: found.macosIntel ?? RELEASES,
        windows: found.windows ?? RELEASES,
        linux: found.linux ?? RELEASES,
        linuxArm: found.linuxArm ?? RELEASES,
        resolved: true,
      };
    } catch (error) {
      console.warn(
        `[releases] fetch failed on attempt ${attempt}/${ATTEMPTS} (${String(error)})`,
      );
    }
  }

  console.warn("[releases] giving up; using fallback links");
  return fallback;
}

/** Set to `1` to build anyway — for working offline, and nothing else. */
export const OVERRIDE = "ALLOW_STALE_DOWNLOADS";

/**
 * Refuse to build a page whose download links are the fallback.
 *
 * Falling back looks harmless and is not: the buttons drop to the releases
 * index and the version line reads `FALLBACK_VERSION`, a number that is a lie
 * the moment a newer release exists — which is exactly what shipped when
 * v0.1.3 was current and the page still said v0.1.0. A build that cannot see
 * the releases API has nothing true to say about downloads, so it should not
 * produce a deployable page at all; the previous deploy stays up, which is at
 * worst one release behind instead of confidently wrong.
 *
 * `astro dev` is exempt, so the site still runs offline.
 */
export function assertResolved(downloads: Downloads, dev: boolean): void {
  if (downloads.resolved || dev || process.env[OVERRIDE] === "1") return;

  throw new Error(
    "Could not resolve download links from the GitHub releases API, so this " +
      "build would ship the releases page and a hard-coded version number.\n" +
      "  Most likely cause: an unauthenticated, rate-limited API call. Set " +
      "GITHUB_TOKEN in the build environment.\n" +
      `  To build anyway (offline work only): ${OVERRIDE}=1`,
  );
}
