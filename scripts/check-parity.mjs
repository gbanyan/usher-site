// Usage: npm run check:parity <oldBase> <newBase>
// Compares status, redirect location and page facts for each URL on both sites.
// Env: VERCEL_AUTOMATION_BYPASS_SECRET -> x-vercel-protection-bypass header for the NEW base.
// Allowlist: scripts/parity-allow.json. Status/location differences can never be allowed.
//
// NOTE (allowlist maintenance): pages whose only text difference is an Asia/Taipei date shift
// are approved, but must be added to parity-allow.json per page after the first run.
// Do not over-allow with prefixes.
import { readFileSync } from "node:fs";
import {
  compareEmails, compareFacts, extractEmails, extractPageFacts, fieldOf, isAllowed, mediaType, normalizeLocation,
  pageProblems, statusEquivalent, unexpectedStatus,
} from "../src/lib/parity.ts";

const [oldBase, newBase] = process.argv.slice(2).map((s) => s?.replace(/\/+$/, ""));
if (!oldBase || !newBase) {
  console.error("usage: check-parity <oldBase> <newBase>");
  process.exit(2);
}
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 4;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const allow = JSON.parse(readFileSync(new URL("./parity-allow.json", import.meta.url), "utf8"));

async function get(base, path, isNew) {
  const headers = isNew && bypass ? { "x-vercel-protection-bypass": bypass } : {};
  try {
    const res = await fetch(base + path, {
      redirect: "manual", headers, signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const type = res.headers.get("content-type") ?? "";
    let facts = null, emails = null, problems = [];
    if (res.status === 200 && type.includes("text/html")) {
      const html = await res.text();
      facts = extractPageFacts(html); emails = extractEmails(html); problems = pageProblems(html);
    } else await res.body?.cancel().catch(() => {});
    return {
      status: res.status, location: normalizeLocation(res.headers.get("location")),
      type: mediaType(type), facts, emails, problems,
    };
  } catch (e) {
    return { status: 0, location: "", type: "", facts: null, emails: null, problems: [], error: String(e?.name ?? e) };
  }
}

async function urlList() {
  const res = await fetch(`${oldBase}/sitemap.xml`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`old sitemap.xml: HTTP ${res.status}`);
  const fromSitemap = [...(await res.text()).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((m) => normalizeLocation(m[1].replace(/&amp;/g, "&")));
  const extra = [
    "/blog", "/notice", "/message", "/research", "/logo_represent",
    "/news/", "/About", "/blog/20240406-usher-working-group.html", "/blog/document-694e4dd6",
    "/this-page-does-not-exist-parity-check",
  ];
  return [...new Set([...fromSitemap, ...extra])];
}

async function checkOne(path) {
  const [o, n] = await Promise.all([get(oldBase, path, false), get(newBase, path, true)]);
  const hard = []; // never allowable
  const diffs = []; // { field, text }
  if (!statusEquivalent(o.status, n.status)) hard.push(`status ${o.status} vs ${n.status}`);
  if (o.location !== n.location) hard.push(`location "${o.location}" vs "${n.location}"`);
  for (const [side, r] of [["old", o], ["new", n]]) {
    const u = unexpectedStatus(path, r.status);
    if (u) hard.push(`${side}: ${u}`);
    for (const p of r.problems) hard.push(`${side}: 200 HTML page has ${p}`);
  }
  if (o.status === 200 && n.status === 200 && o.type !== n.type) hard.push(`content-type "${o.type}" vs "${n.type}"`);
  if (o.emails && n.emails) hard.push(...compareEmails(o.emails, n.emails));
  if (o.error) hard.push(`old error ${o.error}`);
  if (n.error) hard.push(`new error ${n.error}`);
  if (o.facts && n.facts) {
    for (const d of compareFacts(o.facts, n.facts)) diffs.push({ field: fieldOf(d), text: d });
  } else if (!!o.facts !== !!n.facts) hard.push("page facts present on only one side");
  const bad = diffs.filter((d) => !isAllowed(allow, path, d.field));
  const ok = diffs.filter((d) => isAllowed(allow, path, d.field));
  return { path, o, n, hard, bad, ok };
}

const paths = await urlList();
const results = new Array(paths.length);
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < paths.length) { const i = next++; results[i] = await checkOne(paths[i]); }
}));

const cell = (r) => `${r.o.status}/${r.n.status}`;
let failing = 0, allowed = 0;
console.log("URL | status old/new | location | differing fields");
for (const r of results) {
  const fields = [...new Set([...r.bad, ...r.ok].map((d) => d.field))];
  const status = r.hard.length || r.bad.length ? "DIFF" : r.ok.length ? "allowed" : "ok";
  const loc = r.o.location || r.n.location ? `${r.o.location || "-"} -> ${r.n.location || "-"}` : "-";
  console.log(`${status.padEnd(7)} ${r.path} | ${cell(r)} | ${loc} | ${fields.join(",") || "-"}`);
  if (r.hard.length || r.bad.length) failing++;
  else if (r.ok.length) allowed++;
}
console.log("\nDifferences:");
for (const r of results) for (const h of r.hard) console.log(`  ${r.path}: ${h}`);
for (const r of results) for (const d of r.bad) console.log(`  ${r.path}: ${d.text}`);
console.log("\nAllowed differences:");
for (const r of results) for (const d of r.ok) console.log(`  ${r.path} [${d.field}]: ${isAllowed(allow, r.path, d.field)}`);
console.log(`\n${results.length} urls: ${results.length - failing - allowed} identical, ${allowed} allowed-only, ${failing} with differences`);
process.exit(failing ? 1 : 0);
