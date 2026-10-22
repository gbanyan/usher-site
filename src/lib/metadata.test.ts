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
  it("uses an absolute English title, en_US and alternates", () => {
    const meta = buildHomeMetadata("en");
    expect(meta.title).toBe("Taiwan Usher Syndrome and Deafblind Association");
    expect(meta.absoluteTitle).toBe(true);
    expect(meta.locale).toBe("en_US");
    expect(meta.siteName).toBe("Taiwan Usher Syndrome and Deafblind Association");
    expect(meta.canonical).toBe("https://www.usher.org.tw/en");
    expect(meta.alternates).toEqual({
      "zh-TW": "https://www.usher.org.tw/",
      en: "https://www.usher.org.tw/en",
    });
  });
  it("zh-TW home uses default title and zh_TW", () => {
    const meta = buildHomeMetadata("zh-TW");
    expect(meta.locale).toBe("zh_TW");
    expect(meta.canonical).toBe("https://www.usher.org.tw/");
    expect(meta.absoluteTitle).toBe(true);
  });
});
