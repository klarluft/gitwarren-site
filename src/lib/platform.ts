import type { PlatformKey } from "./releases";

export type Os = "mac" | "win" | "linux";
/** What the browser reports, when it reports anything at all. */
export type Arch = "arm" | "x86" | null;

/**
 * Which build to offer, given what detection managed to work out.
 *
 * Pure and exhaustive so it can be tested directly — getting this wrong hands
 * someone a binary that will not run on their machine.
 *
 * An unknown architecture is not a guess of Intel: it keeps the Apple-silicon
 * default, which matches both the server-rendered markup and the overwhelming
 * majority of Macs in use. A wrong guess stays recoverable from the platform
 * links under the hero button.
 */
export function chooseBuild(os: Os | null, arch: Arch): PlatformKey | null {
  if (os === null) return null;
  if (os === "win") return "windows";
  if (os === "mac") return arch === "x86" ? "macosIntel" : "macosArm";
  return arch === "arm" ? "linuxArm" : "linux";
}

/**
 * Normalise whatever platform string is available into an OS.
 *
 * Accepts navigator.userAgentData.platform, navigator.platform or the raw
 * user-agent — they differ in spelling but not in the substrings that matter.
 */
export function readOs(platform: string): Os | null {
  const value = platform.toLowerCase();
  if (/mac|iphone|ipad|ipod/.test(value)) return "mac";
  if (/win/.test(value)) return "win";
  if (/linux|x11|cros|android/.test(value)) return "linux";
  return null;
}

/**
 * Apple silicon reports "Apple GPU" or "Apple M<n>"; Intel Macs report their
 * real Intel or AMD GPU. A heuristic, and the only option in Safari, which
 * does not implement userAgentData.
 */
export function readArchFromRenderer(renderer: string): Arch {
  if (/apple\s*(m\d|gpu)/i.test(renderer)) return "arm";
  if (/intel|amd|radeon/i.test(renderer)) return "x86";
  return null;
}
