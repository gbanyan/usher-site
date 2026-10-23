import { mkdtemp, mkdir, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WIDTHS,
  IMAGE_OUTPUT_PREFIX,
  classifyImageUrl,
  createImageOptimizer,
  findVariantRefs,
  selectWidths,
  variantFileName,
} from "./images";

async function writePng(file: string, width: number, height: number) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 58, b: 95 } },
  })
    .png()
    .toFile(file);
}

describe("classifyImageUrl", () => {
  it("accepts local raster images under the content folders", () => {
    for (const url of [
      "/images/banner/hero.jpg",
      "/images/a.JPEG",
      "/uploads/articles/images/x.png",
      "/attachment/old.webp",
      "/attachments/new.jpg",
    ]) {
      expect(classifyImageUrl(url)).toBe("local");
    }
  });
  it("skips vector, animated and non-content paths", () => {
    for (const url of [
      "/images/partners/logo.svg",
      "/images/anim.gif",
      "/materiel/a.jpg",
      "/fonts/x.png",
      "images/relative.jpg",
      "",
    ]) {
      expect(classifyImageUrl(url)).toBeNull();
    }
  });
  it("accepts CMS storage images but leaves third-party hosts alone", () => {
    expect(classifyImageUrl("https://member.usher.org.tw/storage/articles/images/a.jpg")).toBe("remote");
    expect(classifyImageUrl("https://member.usher.org.tw/storage/a.svg")).toBeNull();
    expect(classifyImageUrl("http://member.usher.org.tw/storage/a.jpg")).toBeNull();
    expect(classifyImageUrl("https://www.tfrd.org.tw/tfrd/assets/images/Logo.png")).toBeNull();
    expect(classifyImageUrl("https://static.wixstatic.com/media/a.jpg")).toBeNull();
  });
});

describe("selectWidths", () => {
  it("keeps requested widths below the source width and caps at the source", () => {
    expect(selectWidths(944)).toEqual([384, 640, 750, 828, 944]);
  });
  it("keeps every requested width when the source is larger", () => {
    expect(selectWidths(4000)).toEqual(DEFAULT_WIDTHS);
  });
  it("returns only the source width for small sources", () => {
    expect(selectWidths(200)).toEqual([200]);
  });
  it("does not upscale explicit widths and dedupes", () => {
    expect(selectWidths(408, [48, 96, 96, 512])).toEqual([48, 96, 408]);
    expect(selectWidths(1080, [1080, 640])).toEqual([640, 1080]);
  });
});

describe("variantFileName", () => {
  it("is deterministic and keeps a readable ASCII stem", () => {
    expect(variantFileName("/images/banner/Hero Support.jpg", "abc123", 640)).toBe(
      "hero-support.abc123.640.webp"
    );
    expect(variantFileName("/uploads/%E5%9C%96.png", "abc123", 384)).toBe("img.abc123.384.webp");
  });
});

describe("createImageOptimizer", () => {
  let root: string;
  let publicDir: string;
  let cacheDir: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "usher-img-"));
    publicDir = path.join(root, "public");
    cacheDir = path.join(root, "cache");
    await writePng(path.join(publicDir, "images", "wide.png"), 1000, 500);
    await writePng(path.join(publicDir, "images", "logo.png"), 408, 408);
    await writePng(path.join(publicDir, "uploads", "圖片.png"), 300, 200);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("returns a capped srcset, intrinsic size and writes WebP variants", async () => {
    const optimizer = createImageOptimizer({ publicDir, cacheDir });
    const result = await optimizer.optimize("/images/wide.png");
    expect(result).not.toBeNull();
    expect(result!.width).toBe(1000);
    expect(result!.height).toBe(500);
    const entries = result!.srcset.split(", ");
    expect(entries.map((e) => e.split(" ")[1])).toEqual(["384w", "640w", "750w", "828w", "1000w"]);
    for (const entry of entries) {
      expect(entry.startsWith(IMAGE_OUTPUT_PREFIX)).toBe(true);
    }
    expect(result!.src).toBe(entries.at(-1)!.split(" ")[0]);

    const files = (await readdir(cacheDir)).sort();
    expect(files).toHaveLength(5);
    const meta = await sharp(path.join(cacheDir, files.find((f) => f.endsWith(".640.webp"))!)).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(320);
  });

  it("produces the same paths across runs and reuses cached variants", async () => {
    const first = await createImageOptimizer({ publicDir, cacheDir }).optimize("/images/wide.png");
    const variant = path.join(cacheDir, path.basename(first!.src));
    const before = (await stat(variant)).mtimeMs;
    const second = await createImageOptimizer({ publicDir, cacheDir }).optimize("/images/wide.png");
    expect(second).toEqual(first);
    expect((await stat(variant)).mtimeMs).toBe(before);
  });

  it("honours explicit widths for fixed-size images", async () => {
    const result = await createImageOptimizer({ publicDir, cacheDir }).optimize("/images/logo.png", {
      widths: [48, 96],
    });
    expect(result!.srcset).toMatch(/\.48\.webp 48w, .*\.96\.webp 96w$/);
  });

  it("decodes percent-encoded local paths", async () => {
    const result = await createImageOptimizer({ publicDir, cacheDir }).optimize(
      `/uploads/${encodeURIComponent("圖片")}.png`
    );
    expect(result).toMatchObject({ width: 300, height: 200 });
  });

  it("returns null for URLs it does not optimise", async () => {
    const optimizer = createImageOptimizer({ publicDir, cacheDir });
    expect(await optimizer.optimize("/images/partners/logo.svg")).toBeNull();
    expect(await optimizer.optimize("https://www.tfrd.org.tw/Logo.png")).toBeNull();
  });

  it("fails loudly when a local image is missing", async () => {
    const optimizer = createImageOptimizer({ publicDir, cacheDir });
    await expect(optimizer.optimize("/images/missing.jpg")).rejects.toThrow(/missing\.jpg/);
  });

  it("refuses paths that escape the public directory", async () => {
    const optimizer = createImageOptimizer({ publicDir, cacheDir });
    await expect(optimizer.optimize("/images/../../secret.png")).rejects.toThrow(/outside/);
  });

  it("downloads CMS storage images and fails the build when the fetch fails", async () => {
    const body = await sharp({
      create: { width: 900, height: 600, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer();
    const fetchImpl = vi.fn(async (url: string) =>
      url.endsWith("ok.jpg")
        ? new Response(new Uint8Array(body), { status: 200 })
        : new Response("nope", { status: 404 })
    );
    const optimizer = createImageOptimizer({ publicDir, cacheDir, fetch: fetchImpl as unknown as typeof fetch });
    const ok = await optimizer.optimize("https://member.usher.org.tw/storage/articles/ok.jpg");
    expect(ok).toMatchObject({ width: 900, height: 600 });
    expect(ok!.srcset).toContain("ok.");
    await expect(
      optimizer.optimize("https://member.usher.org.tw/storage/articles/gone.jpg")
    ).rejects.toThrow(/404/);
  });
});

describe("findVariantRefs", () => {
  it("collects unique variant file names from src, srcset and inline styles", () => {
    const html =
      '<img src="/_img/a.abc.640.webp" srcset="/_img/a.abc.384.webp 384w, /_img/a.abc.640.webp 640w">' +
      "<div style=\"background-image: url('/_img/bg.def.1920.webp')\"></div>" +
      '<img src="/images/a.jpg">';
    expect(findVariantRefs(html).sort()).toEqual(["a.abc.384.webp", "a.abc.640.webp", "bg.def.1920.webp"]);
  });
});
