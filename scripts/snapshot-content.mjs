#!/usr/bin/env node
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const CONTENT_TYPES = ["blog", "notice", "document", "related_news"];
const PAGE_SLUGS = [
  "about",
  "contact",
  "structure",
  "message",
  "logo-represent",
];

function sanitizeFilename(filename) {
  return String(filename).replace(/[^A-Za-z0-9._-]+/g, "_");
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("--")) return null;
  return val;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const apiBase =
  getArg("--api") ||
  process.env.SNAPSHOT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8001/api/v1";

const snapshotDir =
  getArg("--out") ||
  process.env.CONTENT_SNAPSHOT_DIR ||
  path.join(process.cwd(), "content-snapshots");

const downloadAttachments = !hasFlag("--skip-attachments");

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res.json();
}

async function writeJson(rel, data) {
  const full = path.join(snapshotDir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function downloadFile(url, destAbsPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText} (${url})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destAbsPath), { recursive: true });
  await writeFile(destAbsPath, buf);
}

async function main() {
  console.log(`API: ${apiBase}`);
  console.log(`Snapshots: ${snapshotDir}`);
  console.log(
    `Attachments: ${downloadAttachments ? "download" : "skip"}`
  );

  // Homepage (not wrapped in { data }).
  const homepage = await fetchJson(`${apiBase}/homepage`);
  await writeJson("homepage.json", homepage);

  // Categories (wrapped in { data }).
  const categories = await fetchJson(`${apiBase}/categories`);
  await writeJson("categories.json", categories);

  // Pages.
  for (const slug of PAGE_SLUGS) {
    const page = await fetchJson(`${apiBase}/pages/${slug}`);
    await writeJson(path.join("pages", `${slug}.json`), page);
  }

  // Article lists + details (and optionally attachment downloads).
  for (const type of CONTENT_TYPES) {
    const list = await fetchJson(`${apiBase}/articles?type=${type}&per_page=500`);
    await writeJson(path.join("articles", `list-${type}.json`), list);

    const slugs = Array.isArray(list?.data) ? list.data.map((a) => a.slug) : [];
    for (const slug of slugs) {
      const detail = await fetchJson(`${apiBase}/articles/${slug}`);
      await writeJson(path.join("articles", "by-slug", `${slug}.json`), detail);

      if (!downloadAttachments) continue;
      const attachments = detail?.data?.attachments || [];
      for (const att of attachments) {
        const safeName = sanitizeFilename(att.original_filename || "attachment");
        const url = `${apiBase}/articles/${slug}/attachments/${att.id}/download`;
        const dest = path.join(
          process.cwd(),
          "public",
          "attachments",
          slug,
          `${att.id}-${safeName}`
        );
        await downloadFile(url, dest);
      }
    }
  }

  console.log("Snapshot complete.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

