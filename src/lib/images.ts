import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

export type Format = "avif" | "webp";

const QUALITY: Record<Format, number> = { avif: 55, webp: 72 };

/**
 * Build a srcset for one source file in one format.
 *
 * Widths wider than the source are dropped rather than upscaled — the
 * screenshots are 2400px and the logo is 600px, so the same width list can be
 * handed to both.
 */
export async function srcset(
  image: ImageMetadata,
  widths: number[],
  format: Format,
): Promise<string> {
  const usable = widths.filter((w) => w <= image.width);
  if (usable.length === 0) usable.push(image.width);

  const built = await Promise.all(
    usable.map((width) =>
      getImage({ src: image, width, format, quality: QUALITY[format] }),
    ),
  );

  return built.map((img, i) => `${img.src} ${usable[i]}w`).join(", ");
}
