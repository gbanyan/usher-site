import { describe, expect, it } from "vitest";
import { buildSitemapEntries, renderSitemapXml } from "./sitemap";
import type { ArticleSummary, PublicDocumentSummary } from "./types";

const SITE = "https://www.usher.org.tw";

function article(slug: string, categories: string[] = [], published_at: string | null = "2024-05-01T00:00:00Z") {
  return {
    slug,
    published_at,
    categories: categories.map((c) => ({ slug: c })),
  } as unknown as ArticleSummary;
}

const fixture = {
  siteUrl: SITE,
  articles: {
    blog: [article("plain"), article("a-story", ["story"]), article("a-guide", ["guides"])],
    notice: [article("n1")],
    related_news: [article("r1", [], null)],
  },
  documents: [
    {
      slug: "doc-1",
      published_at: "2024-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      current_version: { uploaded_at: "2024-06-01T00:00:00Z" },
    } as unknown as PublicDocumentSummary,
  ],
};

describe("buildSitemapEntries", () => {
  const entries = buildSitemapEntries(fixture);
  const urls = entries.map((e) => e.url);

  it("lists /news and /faq but not redirected paths", () => {
    expect(urls).toContain(`${SITE}/news`);
    expect(urls).toContain(`${SITE}/faq`);
    for (const p of ["/blog", "/notice", "/message"]) expect(urls).not.toContain(`${SITE}${p}`);
  });

  it("puts story and guides articles under their section paths", () => {
    expect(urls).toContain(`${SITE}/story/a-story`);
    expect(urls).toContain(`${SITE}/guides/a-guide`);
    expect(urls).toContain(`${SITE}/blog/plain`);
    expect(urls).not.toContain(`${SITE}/blog/a-story`);
    expect(urls).not.toContain(`${SITE}/blog/a-guide`);
    expect(urls).toContain(`${SITE}/notice/n1`);
    expect(urls).toContain(`${SITE}/related-news/r1`);
  });

  it("uses getDocumentUpdatedAt for document lastModified", () => {
    const doc = entries.find((e) => e.url === `${SITE}/document/doc-1`);
    expect(doc?.lastModified).toBe("2024-06-01T00:00:00.000Z");
    expect(doc?.priority).toBe(0.6);
  });

  it("emits hreflang alternates for / and /en", () => {
    expect(entries.find((e) => e.url === `${SITE}/`)?.alternates).toEqual({ en: `${SITE}/en` });
    expect(entries.find((e) => e.url === `${SITE}/en`)?.alternates).toEqual({ "zh-TW": `${SITE}/` });
  });
});

describe("renderSitemapXml", () => {
  it("renders valid sitemap XML with escaped URLs", () => {
    const xml = renderSitemapXml([{ url: "https://x/a?b&c", changeFrequency: "weekly", priority: 0.8 }]);
    expect(xml).toContain("a?b&amp;c");
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).not.toContain("<lastmod>");
  });

  it("renders alternates as xhtml:link", () => {
    const xml = renderSitemapXml([
      { url: "https://x/", changeFrequency: "weekly", priority: 1, alternates: { en: "https://x/en" } },
    ]);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://x/en" />');
  });
});
