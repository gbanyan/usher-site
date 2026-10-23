export interface PageFacts { title: string; h1: string; canonical: string; text: string }
export type ParityField = "text" | "title" | "h1" | "canonical";
export interface AllowEntry { path: string; field: ParityField; reason: string }

const EMAIL_TOKEN = "<EMAIL>";

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&larr;/g, "\u2190").replace(/&rarr;/g, "\u2192").replace(/&hellip;/g, "\u2026")
    .replace(/&mdash;/g, "\u2014").replace(/&ndash;/g, "\u2013").replace(/&copy;/g, "\u00a9")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&");
}

/** Strip tags, decode entities, collapse whitespace and normalise email addresses. */
function toText(html: string): string {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(stripped)
    .replace(/\s+/g, " ")
    // Cloudflare email obfuscation placeholder vs the real address.
    .replace(/\[email[\s ]*protected\]/gi, EMAIL_TOKEN)
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, EMAIL_TOKEN)
    .trim();
}

/** Decode a Cloudflare data-cfemail hex string: first byte is the XOR key. Returns undefined if malformed. */
export function decodeCfEmail(hex: string): string | undefined {
  if (!/^(?:[0-9a-f]{2}){2,}$/i.test(hex)) return undefined;
  const bytes = hex.match(/../g)!.map((h) => parseInt(h, 16));
  const key = bytes[0];
  return Buffer.from(bytes.slice(1).map((b) => b ^ key)).toString("utf8");
}

const PLACEHOLDER_ONE = /\[email(?:[\s\u00a0]|&#160;|&nbsp;)*protected\]/i;

/** Replace Cloudflare-obfuscated addresses with the real ones; undecodable ones keep the placeholder. */
export function decodeCfEmails(html: string): string {
  return html
    .replace(/<(\w+)\b[^>]*\bdata-cfemail="([0-9a-f]+)"[^>]*>[\s\S]*?<\/\1>/gi, (m, _t, hex) => decodeCfEmail(hex) ?? m)
    .replace(/<a\b[^>]*email-protection#([0-9a-f]+)[^>]*>([\s\S]*?)<\/a>/gi, (m, hex, inner) => {
      const addr = decodeCfEmail(hex);
      return addr && PLACEHOLDER_ONE.test(inner.replace(/<[^>]*>/g, "")) ? addr : m;
    });
}

export function extractPageFacts(rawHtml: string): PageFacts {
  const html = decodeCfEmails(rawHtml);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const mainHtml = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(html)?.[1] ?? "";
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(mainHtml || html)?.[1] ?? "";
  let canonical = "";
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (/rel\s*=\s*["']?canonical["']?/i.test(tag)) {
      canonical = decodeEntities(/href\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? "");
      break;
    }
  }
  return { title: toText(title), h1: toText(h1), canonical, text: toText(mainHtml) };
}

export function compareFacts(a: PageFacts, b: PageFacts): string[] {
  const out: string[] = [];
  if (a.title !== b.title) out.push(`title: "${a.title}" vs "${b.title}"`);
  if (a.h1 !== b.h1) out.push(`h1: "${a.h1}" vs "${b.h1}"`);
  if (a.canonical !== b.canonical) out.push(`canonical: "${a.canonical}" vs "${b.canonical}"`);
  // Whitespace is insignificant: inline tags and JSX text nodes introduce spurious spaces.
  const ta = a.text.replace(/\s+/g, ""), tb = b.text.replace(/\s+/g, "");
  if (ta !== tb) {
    let i = 0;
    while (i < ta.length && i < tb.length && ta[i] === tb[i]) i++;
    const ctx = (s: string) => s.slice(Math.max(0, i - 40), i + 40);
    out.push(`text differs at ${i} (whitespace ignored): "${ctx(ta)}" vs "${ctx(tb)}"`);
  }
  return out;
}

export function fieldOf(diff: string): ParityField {
  return diff.split(/[:\s]/, 1)[0] as ParityField;
}

/** Reduce a Location header to path + query; absolute URLs lose their origin. */
export function normalizeLocation(loc: string | null | undefined): string {
  if (!loc) return "";
  try {
    const u = new URL(loc, "http://x.invalid");
    return u.pathname + u.search;
  } catch { return loc; }
}

const PERMANENT = new Set([301, 308]);
export function statusEquivalent(a: number, b: number): boolean {
  return a === b || (PERMANENT.has(a) && PERMANENT.has(b));
}

export interface Redirectish { status: number; location: string }

/**
 * The only status differences that may be approved (never via the allowlist file):
 * a trailing-slash URL that moved from 301/308 to 307 with the same target, and a
 * `.html` URL that moved from 404 to a 307 onto the extensionless path.
 */
export function isApprovedStatusDifference(path: string, old: Redirectish, neu: Redirectish): boolean {
  if (neu.status !== 307) return false;
  if (path.length > 1 && path.endsWith("/")) {
    return PERMANENT.has(old.status) && old.location !== "" && old.location === neu.location;
  }
  if (path.endsWith(".html")) {
    return old.status === 404 && neu.location === path.slice(0, -".html".length);
  }
  return false;
}

/** Problem with the target of an approved redirect, given its status on the new site. */
export function approvedTargetProblem(targetStatus: number, target = ""): string | null {
  return targetStatus === 200 ? null : `approved redirect target ${target} returned ${targetStatus}`;
}

/** Returns the reason when (path, field) is allowlisted, otherwise undefined. */
export function isAllowed(allow: AllowEntry[], path: string, field: ParityField): string | undefined {
  for (const e of allow) {
    if (e.field !== field) continue;
    if (e.path.endsWith("*") ? path.startsWith(e.path.slice(0, -1)) : e.path === path) return e.reason;
  }
  return undefined;
}

/** URLs that are verified to be 404 on production; a 404 is acceptable only for these. */
export const EXPECTED_404 = new Set([
  "/this-page-does-not-exist-parity-check",
  "/About",
  "/blog/document-694e4dd6",
  "/blog/20240406-usher-working-group.html",
]);

/** URLs listed in the old sitemap must answer 200 on both sides (except verified-404 probes). */
export function sitemapProblem(path: string, status: number): string | undefined {
  if (status === 200 || (status === 404 && EXPECTED_404.has(path))) return undefined;
  return `sitemap URL answered ${status}, expected 200`;
}

/** Hard problem for a response status on one side (404, 5xx, network failure), if any. */
export function unexpectedStatus(path: string, status: number): string | undefined {
  if (status === 404 && EXPECTED_404.has(path)) return undefined;
  if (status === 0 || status === 404 || status >= 500) return `unexpected status ${status}`;
  return undefined;
}

/** Problems that make a 200 HTML page's comparison meaningless (no <main>, empty text). */
export function pageProblems(html: string): string[] {
  if (!/<main\b[^>]*>[\s\S]*<\/main>/i.test(html)) return ["no <main> element"];
  return extractPageFacts(html).text === "" ? ["empty <main> text"] : [];
}

export interface EmailFacts { real: string[]; placeholders: number }

/** Real (clear-text) addresses, sorted and de-duplicated, plus the count of Cloudflare placeholders. */
export function extractEmails(rawHtml: string): EmailFacts {
  const html = decodeCfEmails(rawHtml);
  const mainHtml = /<main\b[^>]*>([\s\S]*)<\/main>/i.exec(html)?.[1] ?? "";
  const raw = decodeEntities(mainHtml.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " "));
  const placeholders = (raw.match(/\[email[\s ]*protected\]/gi) ?? []).length;
  const clear = raw.replace(/\[email[\s ]*protected\]/gi, " ");
  const real = [...new Set((clear.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).map((e) => e.toLowerCase()))].sort();
  return { real, placeholders };
}

/** Hard differences in contact addresses; Cloudflare placeholders on the old side hide addresses, not a diff. */
export function compareEmails(oldE: EmailFacts, newE: EmailFacts): string[] {
  const out: string[] = [];
  for (const e of oldE.real) if (!newE.real.includes(e)) out.push(`email ${e} on old is missing on new`);
  if (oldE.placeholders === 0) {
    for (const e of newE.real) if (!oldE.real.includes(e)) out.push(`email ${e} on new does not appear on old`);
  } else if (newE.real.length + oldE.real.length < oldE.placeholders) {
    out.push(`old has ${oldE.placeholders} obfuscated address(es) but new shows only ${newE.real.length}`);
  }
  return out;
}

/** Media type of a content-type header, without parameters. */
export function mediaType(ct: string | null | undefined): string {
  return (ct ?? "").split(";")[0].trim().toLowerCase();
}
