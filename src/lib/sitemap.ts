import type { ArticleSummary, PublicDocumentSummary } from "./types";
import { getDocumentUpdatedAt } from "./transform";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
  alternates?: Record<string, string>;
}

interface StaticRoute {
  path: string;
  priority: number;
  changeFrequency: string;
}

// /blog, /notice and /message are redirects, so they are deliberately absent.
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/en", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.9, changeFrequency: "monthly" },
  { path: "/news", priority: 0.8, changeFrequency: "weekly" },
  { path: "/document", priority: 0.8, changeFrequency: "weekly" },
  { path: "/related-news", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/story", priority: 0.8, changeFrequency: "weekly" },
  { path: "/structure", priority: 0.7, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/logo-represent", priority: 0.7, changeFrequency: "yearly" },
];

const CURATED = ["guides", "story"];

export interface SitemapInput {
  articles: Record<"blog" | "notice" | "related_news", ArticleSummary[]>;
  documents: PublicDocumentSummary[];
  siteUrl: string;
  /** Fallback lastmod for entries without a date; defaults to build time. */
  now?: Date;
}

function toIso(value: string | null | undefined, now: Date): string {
  return (value ? new Date(value) : now).toISOString();
}

export function buildSitemapEntries(input: SitemapInput): SitemapEntry[] {
  const { articles, documents, siteUrl } = input;
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();

  const entries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: nowIso,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.path === "/"
      ? { alternates: { en: `${siteUrl}/en` } }
      : route.path === "/en"
        ? { alternates: { "zh-TW": `${siteUrl}/` } }
        : {}),
  }));

  const addArticle = (prefix: string, a: ArticleSummary) =>
    entries.push({
      url: `${siteUrl}${prefix}/${a.slug}`,
      lastModified: toIso(a.published_at, now),
      changeFrequency: "monthly",
      priority: 0.6,
    });

  const hasCategory = (a: ArticleSummary, slug: string) =>
    a.categories?.some((c) => c.slug === slug) ?? false;

  for (const a of articles.blog) {
    if (CURATED.some((slug) => hasCategory(a, slug))) continue;
    addArticle("/blog", a);
  }
  for (const a of articles.notice) addArticle("/notice", a);
  for (const a of articles.related_news) addArticle("/related-news", a);
  for (const a of articles.blog) if (hasCategory(a, "guides")) addArticle("/guides", a);
  for (const a of articles.blog) if (hasCategory(a, "story")) addArticle("/story", a);

  for (const d of documents) {
    entries.push({
      url: `${siteUrl}/document/${d.slug}`,
      lastModified: toIso(getDocumentUpdatedAt(d), now),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      const lines = ["<url>", `<loc>${escapeXml(e.url)}</loc>`];
      for (const [lang, href] of Object.entries(e.alternates ?? {})) {
        lines.push(
          `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`
        );
      }
      if (e.lastModified) lines.push(`<lastmod>${escapeXml(e.lastModified)}</lastmod>`);
      lines.push(`<changefreq>${escapeXml(e.changeFrequency)}</changefreq>`);
      lines.push(`<priority>${e.priority}</priority>`, "</url>");
      return lines.join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}
