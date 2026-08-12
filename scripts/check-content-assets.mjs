#!/usr/bin/env node
/**
 * Verify that every asset referenced by committed content-snapshots resolves
 * to a real file under public/ — the check that keeps a content refresh from
 * deploying 404s when an asset was deleted or renamed.
 *
 * Why this exists: content-snapshots are the mirror of CMS content. CMS
 * articles reference both local assets (served from public/, e.g.
 * /images/..., /uploads/..., /materiel/..., /attachment/...) and absolute
 * URLs (https://member.usher.org.tw/storage/..., remote partner logos) which
 * Next.js never serves locally. Referencing a local path that no longer
 * exists under public/ breaks that image or download in production.
 *
 * Usage:
 *   node scripts/check-content-assets.mjs            # verify only (exit 1 on missing)
 *   node scripts/check-content-assets.mjs --report-unreferenced
 *
 * The default run is the guard: it fails (exit 1) if any content reference
 * is missing, so CI / pre-push can gate on it. --report-unreferenced prints
 * read-only candidates for future cleanup and never fails on them.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SNAPSHOTS_DIR = path.join(ROOT, "content-snapshots");
const PUBLIC_DIR = path.join(ROOT, "public");

// Subdirectories of public/ that CMS content may reference through relative
// paths. This deliberately excludes routing links (/blog, /document, /api...).
const ASSET_PREFIXES = [
  "images",
  "attachment",
  "attachments",
  "materiel",
  "uploads",
  "fonts",
  "og-default",
  "favicon", // root-level favicon.ico (referenced by layout.tsx; no dir prefix)
];

// Relative asset reference: a leading /, one of the prefixes above, and an
// asset extension. Query strings and enclosing brackets are not captured.
const ASSET_RE = new RegExp(
  String.raw`(?<=^|[^A-Za-z0-9])\/(?:${ASSET_PREFIXES.join("|")})[A-Za-z0-9_./-]*\.(?:png|jpe?g|webp|gif|svg|pdf|ai|psb|ico|woff2|docx?|pptx?)(?:[?#][^)"'\s]*)?`,
  "gi"
);

function sanitizeFilename(filename) {
  return String(filename).replace(/[^A-Za-z0-9._-]+/g, "_");
}

async function exists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function relativeAssetCandidates(text) {
  const seen = new Set();
  for (const raw of text.match(ASSET_RE) ?? []) {
    let candidate = raw;
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      // keep raw
    }
    seen.add(candidate);
  }
  return [...seen];
}

function collectJson(root, sink) {
  // Sink is a growing list of { path, data } — kept flat, not recursive.
  return (async function collect(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collect(full);
      } else if (entry.name.endsWith(".json")) {
        let data;
        try {
          data = JSON.parse(await readFile(full, "utf8"));
        } catch {
          continue;
        }
        sink.push({ file: full, data });
      }
    }
  })(root);
}

/**
 * Reconstruct snapshot-mode attachment paths the same way src/lib/api.ts
 * does (getAttachmentDownloadUrl) and keep them in the "referenced" set so
 * public/attachments/ downloads are not misreported as dead.
 */
async function referencedAttachmentPaths(records) {
  const refs = new Set();
  for (const record of records) {
    const detail = record.data.data ?? {};
    const attachments = Array.isArray(detail.attachments) ? detail.attachments : [];
    if (!attachments.length) continue;
    const slug = detail.slug;
    for (const attachment of attachments) {
      const safe = sanitizeFilename(attachment.original_filename ?? "attachment");
      const rel = `/attachments/${slug}/${attachment.id}-${safe}`;
      refs.add(rel);
    }
  }
  return refs;
}

async function main() {
  const reportUnreferenced = process.argv.includes("--report-unreferenced");

  const records = [];
  await collectJson(SNAPSHOTS_DIR, records);

  // 1. Literal relative asset references found in content strings.
  const contentRefs = new Set();
  const contentChunks = [];
  for (const record of records) {
    const chunk = await readFile(record.file, "utf8");
    contentChunks.push(chunk);
    for (const ref of relativeAssetCandidates(chunk)) contentRefs.add(ref);
  }

  // 2. Attachment paths reconstructed from metadata.
  const attachmentRefs = await referencedAttachmentPaths(records);
  const checkPaths = [...contentRefs, ...attachmentRefs];

  const missing = [];
  const checked = new Set();
  for (const ref of checkPaths) {
    if (checked.has(ref)) continue;
    checked.add(ref);
    const rel = ref.startsWith("/") ? ref.slice(1) : ref;
    if (!(await exists(path.join(PUBLIC_DIR, rel)))) {
      missing.push(ref);
    }
  }

  console.log(
    `Checked ${checked.size} unique content references (${contentChunks.length} snapshot files).`
  );

  if (missing.length) {
    console.log("\nMISSING references (would 404 in production):");
    for (const ref of missing) {
      const rel = ref.startsWith("/") ? ref.slice(1) : ref;
      const hintFile = path.join(PUBLIC_DIR, rel);
      console.log(`  ${ref}`);
      console.log(`    expected: ${hintFile}`);
      console.log(
        `    restore:  git log --all --oneline -1 -- "${rel}"  (then git checkout <rev> -- "${rel}")`
      );
    }
    console.log(`\n${missing.length} missing — fix before deploying.`);
    process.exitCode = 1;
  } else {
    console.log("All content references resolve to real files. OK");
  }

  if (!reportUnreferenced) return;

  // 3. Read-only candidates: public/ files no content, source, or config text
  // references. Ignores built search output; treats the reconstructed
  // attachment paths as references.
  const referenced = new Set([
    ...contentRefs,
    ...attachmentRefs,
    ...(await collectSourceReferences()),
  ]);

  const publicFiles = (await walk(PUBLIC_DIR)).filter(
    (f) => !f.includes(`${path.sep}_pagefind${path.sep}`)
  );
  const unreferenced = [];
  for (const file of publicFiles) {
    const rel = `/${file.replace(PUBLIC_DIR, "").replace(/\\/g, "/").replace(/^\//, "")}`;
    if (referenced.has(rel)) continue;
    const { size } = await stat(file);
    unreferenced.push({ rel, size });
  }

  console.log("\nUnreferenced candidates under public/ (read-only report):");
  if (!unreferenced.length) {
    console.log("  (none)");
    return;
  }
  for (const { rel, size } of unreferenced.sort((a, b) => b.size - a.size)) {
    console.log(`  ${rel}  ${size} B`);
  }
  console.log(`\n${unreferenced.length} files; verify against git history before deleting.`);
}

/**
 * Collect every text file under src/, scripts/ plus repo docs so that
 * code-referenced assets are not flagged as unreferenced. Returns relative
 * asset paths found in their text.
 */
async function collectSourceReferences() {
  const roots = ["src", "scripts", "docs", "next.config.ts", "README.md", "CLAUDE.md"];
  const texts = [];
  for (const root of roots) {
    const full = path.join(ROOT, root);
    try {
      const st = await stat(full);
      if (st.isFile()) {
        texts.push(await readFile(full, "utf8"));
      } else {
        for (const file of await walk(full)) {
          if (/\.(tsx?|css|mjs|md|json)$/.test(file)) {
            texts.push(await readFile(file, "utf8"));
          }
        }
      }
    } catch {
      // root missing
    }
  }
  const refs = new Set();
  for (const text of texts) {
    for (const ref of relativeAssetCandidates(text)) refs.add(ref);
  }
  return refs;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
