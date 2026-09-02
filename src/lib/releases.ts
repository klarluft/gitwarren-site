import { RELEASES, REPO } from "../config";

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
  /** False when the API could not be reached and every link falls back. */
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
 * Never throws. A rate-limited or offline build falls back to the releases
 * page — every button still goes somewhere useful — rather than failing the
 * build or, worse, shipping dead `#` hrefs.
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

  try {
    const res = await fetch(API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "gitwarren-site-build",
      },
    });
    if (!res.ok) {
      console.warn(`[releases] GitHub API returned ${res.status}; using fallback links`);
      return fallback;
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

    return {
      version: release.tag_name,
      macosArm: found.macosArm ?? RELEASES,
      macosIntel: found.macosIntel ?? RELEASES,
      windows: found.windows ?? RELEASES,
      linux: found.linux ?? RELEASES,
      linuxArm: found.linuxArm ?? RELEASES,
      resolved: Object.values(found).every(Boolean),
    };
  } catch (error) {
    console.warn(`[releases] fetch failed (${String(error)}); using fallback links`);
    return fallback;
  }
}
