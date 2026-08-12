import { describe, expect, it } from "vitest";
import type {
  Article,
  ArticleDetailResponse,
  ArticleSummary,
} from "./types";
import {
  extractContactContent,
  mapLegacyArticleDetailToPublicDocument,
  mapLegacyArticleSummaryToPublicDocument,
  normalizeArticleSummary,
  normalizeFeaturedImageUrl,
} from "./transform";

const API_URL = "https://member.usher.org.tw/api/v1";

function makeSummary(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return {
    id: 1,
    title: "測試文章",
    slug: "test-article",
    summary: null,
    excerpt: "摘要",
    content_type: "document",
    content_type_label: "協會文件",
    featured_image_url: null,
    featured_image_alt: null,
    author_name: null,
    is_pinned: false,
    published_at: "2026-08-01T12:00:00+08:00",
    categories: [],
    tags: [],
    ...overrides,
  };
}

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    ...makeSummary(),
    content: "# 內容",
    meta_description: null,
    meta_keywords: null,
    view_count: 0,
    attachments: [],
    ...overrides,
  };
}

function makeDetailResponse(
  overrides: Partial<Article> = {}
): ArticleDetailResponse {
  return {
    data: makeArticle(overrides),
    related: [],
  };
}

describe("normalizeFeaturedImageUrl", () => {
  it("maps leading-slash migrated paths under /images", () => {
    expect(normalizeFeaturedImageUrl("/migrated-images/blog/pic.jpg")).toBe(
      "/images/blog/pic.jpg"
    );
  });

  it("maps bare migrated paths under /images", () => {
    expect(normalizeFeaturedImageUrl("migrated-images/blog/pic.jpg")).toBe(
      "/images/blog/pic.jpg"
    );
  });

  it("leaves other URLs and null untouched", () => {
    expect(
      normalizeFeaturedImageUrl("https://member.usher.org.tw/storage/a.jpg")
    ).toBe("https://member.usher.org.tw/storage/a.jpg");
    expect(normalizeFeaturedImageUrl(null)).toBeNull();
  });
});

describe("normalizeArticleSummary", () => {
  it("normalizes the featured image and keeps the rest", () => {
    const result = normalizeArticleSummary(
      makeSummary({ featured_image_url: "/migrated-images/a.jpg" })
    );
    expect(result.featured_image_url).toBe("/images/a.jpg");
    expect(result.slug).toBe("test-article");
  });
});

describe("mapLegacyArticleSummaryToPublicDocument", () => {
  it("maps article fields into a public document", () => {
    const article = makeSummary({
      summary: "說明",
      categories: [{ id: 9, name: "病友經驗", slug: "category-9", description: null }],
    });

    const document = mapLegacyArticleSummaryToPublicDocument(article, API_URL);

    expect(document.title).toBe("測試文章");
    expect(document.access_level_label).toBe("公開");
    expect(document.status_label).toBe("啟用");
    expect(document.category?.name).toBe("病友經驗");
    expect(document.links.api_url).toBe(
      `${API_URL}/articles/test-article`
    );
    expect(document.links.download_url).toBeNull();
  });
});

describe("mapLegacyArticleDetailToPublicDocument", () => {
  const resolver = (
    slug: string,
    id: number,
    filename?: string
  ) => `/attachments/${slug}/${id}-${filename}`;

  it("maps attachments into versions with the first as current", () => {
    const response = makeDetailResponse({
      attachments: [
        {
          id: 11,
          original_filename: "章程.pdf",
          mime_type: "application/pdf",
          file_size: 2048,
          description: "現行版本",
        },
        {
          id: 10,
          original_filename: "章程-old.pdf",
          mime_type: "application/pdf",
          file_size: 1024,
          description: null,
        },
      ],
    });

    const { data } = mapLegacyArticleDetailToPublicDocument(response, {
      apiUrl: API_URL,
      resolveDownloadUrl: resolver,
    });

    expect(data.version_count).toBe(2);
    expect(data.current_version?.version_number).toBe("1.0");
    expect(data.current_version?.is_current).toBe(true);
    expect(data.versions[1].version_number).toBe("2.0");
    expect(data.versions[1].is_current).toBe(false);
    expect(data.current_version?.download_url).toBe(
      "/attachments/test-article/11-章程.pdf"
    );
    expect(data.links.download_url).toBe("/attachments/test-article/11-章程.pdf");
  });

  it("maps related articles into public documents", () => {
    const response: ArticleDetailResponse = {
      data: makeArticle(),
      related: [makeSummary({ slug: "related-1" })],
    };

    const { related } = mapLegacyArticleDetailToPublicDocument(response, {
      apiUrl: API_URL,
      resolveDownloadUrl: resolver,
    });

    expect(related[0].slug).toBe("related-1");
  });
});

describe("extractContactContent", () => {
  it.each([
    "## 捐款管道\n\n（待建立金流）",
    "## 捐款管道\n\n(待建立金流）",
    "## 捐款管道\n\n（待建立金流)",
    "## 捐款管道\n\n(待建立金流)",
  ])("detects the donation placeholder and drops the section (%#)", (content) => {
    const result = extractContactContent(content);
    expect(result.donationPending).toBe(true);
    expect(result.content).not.toContain("待建立金流");
    expect(result.content).not.toContain("捐款管道");
  });

  it("passes real content through untouched", () => {
    const content = "## 捐款管道\n\n請匯款至本會帳戶。";
    const result = extractContactContent(content);
    expect(result.donationPending).toBe(false);
    expect(result.content).toBe(content);
  });
});
