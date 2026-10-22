import { describe, expect, it } from "vitest";
import {
  ARTICLE_SECTION_CONFIG,
  getListingLink,
  isNewsArticle,
} from "./article-sections";

const cat = (slug: string) => ({ id: 1, name: slug, slug, description: null });

describe("getListingLink", () => {
  it("sends blog and notice back to the merged news listing", () => {
    expect(getListingLink(ARTICLE_SECTION_CONFIG.blog)).toEqual({
      label: "活動與公告",
      path: "/news",
    });
    expect(getListingLink(ARTICLE_SECTION_CONFIG.notice)).toEqual({
      label: "活動與公告",
      path: "/news",
    });
  });

  it("keeps other sections on their own listing", () => {
    expect(getListingLink(ARTICLE_SECTION_CONFIG.story)).toEqual({
      label: "病友故事",
      path: "/story",
    });
    expect(getListingLink(ARTICLE_SECTION_CONFIG.related_news)).toEqual({
      label: "相關報導",
      path: "/related-news",
    });
  });

  it("does not change detail paths", () => {
    expect(ARTICLE_SECTION_CONFIG.blog.path).toBe("/blog");
    expect(ARTICLE_SECTION_CONFIG.notice.path).toBe("/notice");
  });
});

describe("isNewsArticle", () => {
  it("includes every notice", () => {
    expect(
      isNewsArticle({ content_type: "notice", categories: [cat("story")] })
    ).toBe(true);
  });

  it("includes plain blog posts", () => {
    expect(
      isNewsArticle({ content_type: "blog", categories: [cat("category-306")] })
    ).toBe(true);
  });

  it("includes blog posts without categories", () => {
    expect(isNewsArticle({ content_type: "blog" })).toBe(true);
  });

  it("excludes story and guides blog posts", () => {
    expect(
      isNewsArticle({ content_type: "blog", categories: [cat("story")] })
    ).toBe(false);
    expect(
      isNewsArticle({ content_type: "blog", categories: [cat("guides")] })
    ).toBe(false);
  });

  it("excludes related news", () => {
    expect(isNewsArticle({ content_type: "related_news" })).toBe(false);
  });
});
