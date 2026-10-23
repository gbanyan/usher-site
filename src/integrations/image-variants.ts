import { copyFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { IMAGE_CACHE_DIR, IMAGE_OUTPUT_PREFIX, findVariantRefs } from "../lib/images";

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/**
 * Publishes the responsive image variants generated during prerendering
 * (src/lib/images.ts writes them to the cache) by copying exactly the ones
 * referenced from the built HTML into dist/_img/. A referenced variant that is
 * missing from the cache fails the build. In dev the cache is served directly.
 */
export function imageVariants(): AstroIntegration {
  const outSegment = IMAGE_OUTPUT_PREFIX.replace(/^\/|\/$/g, "");
  return {
    name: "usher-image-variants",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? "";
          if (!url.startsWith(IMAGE_OUTPUT_PREFIX)) return next();
          const name = path.posix.basename(url.split("?")[0]);
          const file = path.join(IMAGE_CACHE_DIR, name);
          stat(file).then(
            () => {
              res.setHeader("Content-Type", "image/webp");
              createReadStream(file).pipe(res);
            },
            () => next()
          );
        });
      },
      "astro:build:done": async ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        const refs = new Set<string>();
        for (const file of await walk(distDir)) {
          if (!file.endsWith(".html")) continue;
          for (const ref of findVariantRefs(await readFile(file, "utf8"))) refs.add(ref);
        }
        const outDir = path.join(distDir, outSegment);
        await mkdir(outDir, { recursive: true });
        const missing: string[] = [];
        let bytes = 0;
        await Promise.all(
          [...refs].map(async (name) => {
            const from = path.join(IMAGE_CACHE_DIR, name);
            try {
              await copyFile(from, path.join(outDir, name));
              const { size } = await stat(from);
              bytes += size;
            } catch {
              missing.push(name);
            }
          })
        );
        if (missing.length > 0) {
          throw new Error(`[image-variants] ${missing.length} referenced variants missing from ${IMAGE_CACHE_DIR}: ${missing.slice(0, 10).join(", ")}`);
        }
        logger.info(`copied ${refs.size} image variants (${(bytes / 1024 / 1024).toFixed(1)} MiB) to /${outSegment}/`);
      },
    },
  };
}
