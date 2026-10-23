/**
 * Build-time responsive image variants (replaces what next/image did on the
 * old site). For local raster images under public/ and CMS storage images,
 * `optimize()` writes resized WebP variants into a gitignored cache directory
 * and returns `{ src, srcset, width, height }` for the <img>. The originals in
 * public/ are never touched; the `imageVariants` Astro integration copies the
 * variants referenced by the built HTML into dist/_img/.
 *
 * Failure policy: all-or-nothing. A missing local file, an undecodable image
 * or a failed CMS download throws, which fails the build.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

export const IMAGE_OUTPUT_PREFIX = "/_img/";
/** Close to next/image's deviceSizes, capped at 1920 for this site. */
export const DEFAULT_WIDTHS = [384, 640, 750, 828, 1080, 1200, 1920];
export const IMAGE_QUALITY = 75;
export const IMAGE_CACHE_DIR = path.join(process.cwd(), "node_modules", ".cache", "usher-images");

const LOCAL_PREFIXES = ["/images/", "/uploads/", "/attachment/", "/attachments/"];
const REMOTE_PREFIXES = ["https://member.usher.org.tw/storage/"];
const RASTER_EXT = /\.(jpe?g|png|webp)$/i;

export interface OptimizedImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

export interface OptimizeOptions {
  /** Candidate widths; capped at the source width. Defaults to DEFAULT_WIDTHS. */
  widths?: number[];
}

export type ImageOptimizeFn = (url: string, options?: OptimizeOptions) => Promise<OptimizedImage | null>;

function stripQuery(url: string): string {
  return url.replace(/[?#].*$/, "");
}

export function classifyImageUrl(url: string): "local" | "remote" | null {
  if (!url) return null;
  const clean = stripQuery(url);
  if (!RASTER_EXT.test(clean)) return null;
  if (LOCAL_PREFIXES.some((p) => clean.startsWith(p))) return "local";
  if (REMOTE_PREFIXES.some((p) => clean.startsWith(p))) return "remote";
  return null;
}

export function selectWidths(sourceWidth: number, widths: number[] = DEFAULT_WIDTHS): number[] {
  const out = new Set<number>();
  for (const w of widths) out.add(Math.min(Math.round(w), sourceWidth));
  return [...out].sort((a, b) => a - b);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function variantFileName(url: string, hash: string, width: number): string {
  const base = path.posix.basename(safeDecode(stripQuery(url))).replace(RASTER_EXT, "");
  const stem =
    base
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "img";
  return `${stem}.${hash}.${width}.webp`;
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

interface OptimizerConfig {
  publicDir: string;
  cacheDir: string;
  quality?: number;
  fetch?: typeof fetch;
}

export function createImageOptimizer({
  publicDir,
  cacheDir,
  quality = IMAGE_QUALITY,
  fetch: fetchImpl = fetch,
}: OptimizerConfig) {
  const root = path.resolve(publicDir);
  const sources = new Map<string, Promise<{ buffer: Buffer; hash: string; width: number; height: number }>>();
  const writes = new Map<string, Promise<void>>();

  async function loadSource(url: string, kind: "local" | "remote") {
    let buffer: Buffer;
    if (kind === "local") {
      const file = path.resolve(root, `.${safeDecode(stripQuery(url))}`);
      if (!file.startsWith(root + path.sep)) {
        throw new Error(`[images] ${url} resolves outside ${root}`);
      }
      try {
        buffer = await readFile(file);
      } catch (error) {
        throw new Error(`[images] cannot read local image ${url} (${file}): ${(error as Error).message}`);
      }
    } else {
      const response = await fetchImpl(url);
      if (!response.ok) {
        throw new Error(`[images] fetching ${url} failed: HTTP ${response.status}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    }
    let meta: Metadata;
    try {
      meta = await sharp(buffer).metadata();
    } catch (error) {
      throw new Error(`[images] cannot decode ${url}: ${(error as Error).message}`);
    }
    if (!meta.width || !meta.height) throw new Error(`[images] ${url} has no dimensions`);
    // EXIF orientations 5-8 rotate by 90 degrees; variants are auto-oriented.
    const rotated = (meta.orientation ?? 1) >= 5;
    const hash = createHash("sha256").update(buffer).update(`webp-q${quality}`).digest("hex").slice(0, 12);
    return {
      buffer,
      hash,
      width: rotated ? meta.height : meta.width,
      height: rotated ? meta.width : meta.height,
    };
  }

  function writeVariant(buffer: Buffer, file: string, width: number): Promise<void> {
    let pending = writes.get(file);
    if (!pending) {
      pending = (async () => {
        if (await exists(file)) return;
        const data = await sharp(buffer).rotate().resize({ width }).webp({ quality }).toBuffer();
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, data);
        await rename(tmp, file);
      })();
      writes.set(file, pending);
    }
    return pending;
  }

  async function optimize(url: string, options: OptimizeOptions = {}): Promise<OptimizedImage | null> {
    const kind = classifyImageUrl(url);
    if (!kind) return null;
    let source = sources.get(url);
    if (!source) {
      source = loadSource(url, kind);
      sources.set(url, source);
    }
    const { buffer, hash, width, height } = await source;
    await mkdir(cacheDir, { recursive: true });
    const widths = selectWidths(width, options.widths);
    const entries = await Promise.all(
      widths.map(async (w) => {
        const name = variantFileName(url, hash, w);
        await writeVariant(buffer, path.join(cacheDir, name), w);
        return { url: `${IMAGE_OUTPUT_PREFIX}${name}`, w };
      })
    );
    return {
      src: entries.at(-1)!.url,
      srcset: entries.map((e) => `${e.url} ${e.w}w`).join(", "),
      width,
      height,
    };
  }

  return { optimize };
}

const VARIANT_REF = /\/_img\/([a-z0-9_-]+\.[0-9a-f]+\.\d+\.webp)/g;

/** Variant file names referenced by a built HTML page. */
export function findVariantRefs(html: string): string[] {
  return [...new Set([...html.matchAll(VARIANT_REF)].map((m) => m[1]))];
}

let siteOptimizer: ReturnType<typeof createImageOptimizer> | undefined;

/** The site-wide optimizer (public/ → node_modules/.cache/usher-images). */
export const optimizeImage: ImageOptimizeFn = (url, options) => {
  siteOptimizer ??= createImageOptimizer({
    publicDir: path.join(process.cwd(), "public"),
    cacheDir: IMAGE_CACHE_DIR,
  });
  return siteOptimizer.optimize(url, options);
};
