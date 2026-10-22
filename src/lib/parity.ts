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

export function extractPageFacts(html: string): PageFacts {
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

/** Returns the reason when (path, field) is allowlisted, otherwise undefined. */
export function isAllowed(allow: AllowEntry[], path: string, field: ParityField): string | undefined {
  for (const e of allow) {
    if (e.field !== field) continue;
    if (e.path.endsWith("*") ? path.startsWith(e.path.slice(0, -1)) : e.path === path) return e.reason;
  }
  return undefined;
}
