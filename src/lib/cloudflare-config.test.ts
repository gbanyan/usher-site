import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
// Strip // and /* */ comments outside of strings, then parse as JSON.
function parseJsonc(s: string) {
  let out = "", i = 0, inStr = false;
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (inStr) { out += c; if (c === "\\") out += s[++i]; else if (c === '"') inStr = false; i++; continue; }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === "/" && d === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { i = s.indexOf("*/", i + 2) + 2; continue; }
    out += c; i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const config = parseJsonc(read("wrangler.jsonc"));

it("serves ./dist as static assets without a Worker script", () => {
  expect(config.name).toBe("usher-site");
  expect(config.main).toBeUndefined();
  expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(config.assets.directory).toBe("./dist");
});
it("drops trailing slashes and serves the 404 page", () => {
  expect(config.assets.html_handling).toBe("drop-trailing-slash");
  expect(config.assets.not_found_handling).toBe("404-page");
});

const REDIRECTS = [["/blog","/news"],["/notice","/news"],["/message","/about"],["/research","/document"],["/logo_represent","/logo-represent"]];
const rules = read("public/_redirects").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
it("has the five permanent redirects plus their trailing-slash variants", () => {
  expect(rules).toHaveLength(10);
});
it.each(REDIRECTS)("redirects %s (and %s/) to %s with 308", (s, d) => {
  expect(rules).toContainEqual(`${s} ${d} 308`);
  expect(rules).toContainEqual(`${s}/ ${d} 308`);
});

it("caches hashed assets immutably and sets baseline security headers", () => {
  const headers = read("public/_headers");
  const block = (path: string) => headers.split(/\n\s*\n/).find((b) => b.startsWith(path + "\n")) ?? "";
  for (const p of ["/_astro/*", "/_img/*"]) {
    expect(block(p)).toContain("Cache-Control: public, max-age=31536000, immutable");
  }
  const all = block("/*");
  expect(all).toContain("X-Content-Type-Options: nosniff");
  expect(all).toContain("Referrer-Policy: strict-origin-when-cross-origin");
  expect(all).toContain("X-Frame-Options: SAMEORIGIN");
});
