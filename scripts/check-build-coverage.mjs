#!/usr/bin/env node
/**
 * Post-build coverage check over dist/ (the build uses live CMS data, so this
 * does not compare against content-snapshots). Exits 1 with a list on failure:
 *   a) every <loc> in dist/sitemap.xml has a matching dist file (skipped while
 *      the sitemap does not exist yet);
 *   b) every internal href to a detail route resolves to dist/<route>.html;
 *   c) each article section has at least one detail page.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST = path.join(process.cwd(), "dist");
const LINK_SECTIONS = ["blog", "notice", "story", "guides", "related-news", "document"];
const REQUIRED_SECTIONS = ["blog", "notice", "story", "guides", "related-news"];
const DETAIL_HREF = new RegExp(`href="(/(?:${LINK_SECTIONS.join("|")})/[^"#?]+)`, "g");

async function exists(p) {
  try {
    await stat(p);
    return true;
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

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function routeToFile(route) {
  const clean = route.replace(/\/+$/, "") || "/";
  return clean === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${clean}.html`);
}

async function resolves(route) {
  const decoded = safeDecode(route);
  return (await exists(routeToFile(decoded))) || (await exists(path.join(DIST, decoded, "index.html")));
}

async function main() {
  if (!(await exists(DIST))) {
    console.error(`No build output at ${DIST}.`);
    process.exit(1);
  }
  const failures = [];

  // (a) sitemap
  const sitemap = path.join(DIST, "sitemap.xml");
  if (await exists(sitemap)) {
    const xml = await readFile(sitemap, "utf8");
    for (const [, loc] of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
      let route;
      try {
        route = new URL(loc).pathname;
      } catch {
        failures.push(`sitemap: invalid <loc> ${loc}`);
        continue;
      }
      if (!(await resolves(route))) failures.push(`sitemap: ${loc} has no dist file`);
    }
  } else {
    console.log("check-build-coverage: dist/sitemap.xml absent, skipping sitemap check.");
  }

  // (b) internal detail hrefs
  const htmlFiles = (await walk(DIST)).filter(
    (f) => f.endsWith(".html") && !f.includes(`${path.sep}_pagefind${path.sep}`)
  );
  const missing = new Map();
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const [, href] of html.matchAll(DETAIL_HREF)) {
      if (!(await resolves(href))) {
        const pages = missing.get(href) ?? new Set();
        pages.add(path.relative(DIST, file));
        missing.set(href, pages);
      }
    }
  }
  for (const [href, pages] of missing) {
    failures.push(`broken link ${href} (from ${[...pages].slice(0, 3).join(", ")})`);
  }

  // (c) each section has detail pages
  for (const section of REQUIRED_SECTIONS) {
    const dir = path.join(DIST, section);
    const count = (await exists(dir))
      ? (await readdir(dir)).filter((f) => f.endsWith(".html")).length
      : 0;
    if (count === 0) failures.push(`no detail pages generated for /${section}/`);
    else console.log(`check-build-coverage: /${section}/ ${count} detail pages`);
  }

  if (failures.length > 0) {
    console.error("check-build-coverage FAILED:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("check-build-coverage: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
