import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildArticleMetadata,
  buildHomeMetadata,
  buildPageMetadata,
} from "./metadata";

beforeEach(() => {
  vi.stubEnv("SITE_URL", "https://www.usher.org.tw");
});
afterEach(() => vi.unstubAllEnvs());

describe("buildPageMetadata", () => {
  it("returns canonical from SITE_URL + path", () => {
    expect(buildPageMetadata("常見問題", "desc", "/faq").canonical).toBe(
      "https://www.usher.org.tw/faq"
    );
  });
  it("falls back to NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://old.example");
    expect(buildPageMetadata("t", "d", "/faq").canonical).toBe(
      "https://old.example/faq"
    );
  });
});

describe("buildArticleMetadata", () => {
  it("strips markdown from the description and uses the featured image", () => {
    const meta = buildArticleMetadata(
      {
        title: "文章",
        meta_description: null,
        excerpt: "**粗體** 與 [連結](https://x.test)",
        featured_image_url: "/images/a.jpg",
        published_at: "2026-01-01",
      },
      "/blog/a",
      "fallback"
    );
    expect(meta.description).not.toMatch(/[*\[\]()]/);
    expect(meta.description).toContain("粗體");
    expect(meta.image).toBe("/images/a.jpg");
    expect(meta.ogType).toBe("article");
    expect(meta.publishedTime).toBe("2026-01-01");
    expect(meta.canonical).toBe("https://www.usher.org.tw/blog/a");
  });
});

describe("buildHomeMetadata", () => {
  it("en: absolute title, locale, site name, alternates, no og:url", () => {
    const meta = buildHomeMetadata("en");
    expect(meta.title).toBe("Taiwan Usher Syndrome and Deafblind Association");
    expect(meta.absoluteTitle).toBe(true);
    expect(meta.locale).toBe("en_US");
    expect(meta.siteName).toBe("Taiwan Usher Syndrome and Deafblind Association");
    expect(meta.ogType).toBe("website");
    expect(meta.ogUrl).toBeUndefined();
    expect(meta.canonical).toBe("https://www.usher.org.tw/en");
    expect(meta.alternates).toEqual({
      "zh-TW": "https://www.usher.org.tw",
      en: "https://www.usher.org.tw/en",
    });
  });
  it("zh-TW: bare absolute title, no trailing slash, production-only tags", () => {
    const meta = buildHomeMetadata("zh-TW");
    expect(meta.title).toBe("台灣尤塞氏症暨視聽弱協會");
    expect(meta.absoluteTitle).toBe(true);
    expect(meta.canonical).toBe("https://www.usher.org.tw");
    expect(meta.ogUrl).toBe("https://www.usher.org.tw");
    expect(meta.description).toContain("（Usher Syndrome）");
    expect(meta.ogDescription).toBeDefined();
    expect(meta.ogDescription).not.toContain("Usher Syndrome");
    expect(meta.ogType).toBeUndefined();
    expect(meta.locale).toBeUndefined();
    expect(meta.siteName).toBeUndefined();
    expect(meta.alternates).toBeUndefined();
  });
  it("normal pages emit og:url and og:type but no locale/site name", () => {
    const meta = buildPageMetadata("創立目的", "d", "/about");
    expect(meta.ogUrl).toBe("https://www.usher.org.tw/about");
    expect(meta.ogType).toBe("website");
    expect(meta.locale).toBeUndefined();
    expect(meta.siteName).toBeUndefined();
    expect(meta.alternates).toBeUndefined();
  });
});
