#!/usr/bin/env node
/**
 * Static accessibility invariants over the built output (run AFTER
 * `npm run build`). This is the lightweight CI gate — not a full axe scan,
 * which remains a documented to-do — but it fails the build on structural
 * regressions that are cheap to detect and expensive to ship:
 *
 *   1. At most one <h1> per page (pages with PageHeader or the homepage hero
 *      own the single h1; content headings are demoted by MarkdownRenderer).
 *   2. Every page expose a skip-to-content link targeting #main-content.
 *   3. The global 4px high-contrast focus ring is present in the compiled CSS.
 *
 * Scope: `next build` output under .next. Redirect stubs (research) and the
 * global error boundary (_global-error) render outside the root layout and
 * are exempt.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const HTML_DIR = path.join(ROOT, ".next", "server", "app");
const CSS_DIR = path.join(ROOT, ".next", "static", "chunks");

const EXEMPT_PAGES = new Set(["research.html", "_global-error.html"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

const H1_RE = /<h1[\s>]/g;
const FOCUS_RULE = "outline:4px solid var(--color-accent)";
const FOCUS_OFFSET = "outline-offset:4px";

async function main() {
  if (!(await exists(HTML_DIR))) {
    console.error(`No build output at ${HTML_DIR}. Run npm run build first.`);
    process.exit(1);
  }

  const pages = (await walk(HTML_DIR)).filter(
    (f) => f.endsWith(".html") && !EXEMPT_PAGES.has(path.basename(f))
  );

  const failures = [];
  const check = (label, ok, detail) => {
    if (ok) return;
    failures.push(`${label}: ${detail}`);
  };

  for (const file of pages) {
    const rel = path.relative(HTML_DIR, file).replace(/\\/g, "/");
    const html = await readFile(file, "utf8");

    const h1Count = (html.match(H1_RE) ?? []).length;
    check(
      "single-h1",
      h1Count <= 1,
      `${rel} has ${h1Count} <h1> elements`
    );

    const skipLink =
      /class="skip-to-content"/.test(html) && /href="#main-content"/.test(html);
    const mainContent = /id="main-content"/.test(html);
    if (!skipLink || !mainContent) {
      check(
        "skip-link",
        false,
        `${rel} ${skipLink ? "" : "missing skip-to-content link"} ${mainContent ? "" : "missing #main-content target"}`
      );
    }
  }

  // Compiled CSS: search all output chunks for the global focus ring.
  if (!(await exists(CSS_DIR))) {
    failures.push("compiled-css: .next/static/chunks not found");
  } else {
    const chunks = (await walk(CSS_DIR)).filter((f) => f.endsWith(".css"));
    const css = (await Promise.all(chunks.map((f) => readFile(f, "utf8")))).join("\n");
    if (!css.includes(":focus-visible")) {
      failures.push("focus-ring: no :focus-visible rule in compiled CSS");
    }
    if (!css.includes(FOCUS_RULE)) {
      failures.push(`focus-ring: missing "${FOCUS_RULE}"`);
    }
    if (!css.includes(FOCUS_OFFSET)) {
      failures.push(`focus-ring: missing "${FOCUS_OFFSET}"`);
    }
  }

  console.log(
    `Checked ${pages.length} built pages for structural accessibility invariants.`
  );

  if (!failures.length) {
    console.log("All static accessibility checks passed.");
    return;
  }

  console.warn("\nFAILED:");
  for (const f of failures) console.warn(`  - ${f}`);
  if (process.env.GITHUB_ACTIONS === "true") {
    // Group violations by page for the Actions log.
    for (const f of failures) console.warn(`::error title=check:a11y::${f}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
