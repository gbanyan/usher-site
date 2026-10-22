import type { Category, ContentType } from "./types";

/**
 * Shared configuration for the five article sections (blog, notice,
 * related-news and the blog-derived story/guides categories). Drives listing
 * pages, detail pages and metadata so the per-type strings live in one place.
 */

export type ArticleSectionType =
  | "blog"
  | "notice"
  | "related_news"
  | "story"
  | "guides";

export interface ArticleSectionConfig {
  label: string;
  path: string;
  fallbackDescription: string;
  relatedHeading: string;
  /**
   * story and guides are blog articles filtered by a CMS category slug.
   * A detail page is only valid when the article carries this category, and
   * related articles are filtered to the same category.
   */
  categorySlug?: string;
  /**
   * Listing that breadcrumbs and "back" links point to when it differs from
   * the detail path prefix (blog and notice share the merged /news listing).
   */
  listing?: { label: string; path: string };
}

/** Merged listing for notices and regular blog posts (活動與公告). */
export const NEWS_LISTING = {
  label: "活動與公告",
  path: "/news",
  description: "協會活動紀錄、會務公告與倡議進度",
} as const;

const NEWS_LISTING_LINK = {
  label: NEWS_LISTING.label,
  path: NEWS_LISTING.path,
};

export const ARTICLE_SECTION_CONFIG: Record<
  ArticleSectionType,
  ArticleSectionConfig
> = {
  blog: {
    label: "部落格",
    path: "/blog",
    fallbackDescription: "協會成員分享的生活經驗與心得",
    relatedHeading: "相關文章",
    listing: NEWS_LISTING_LINK,
  },
  notice: {
    label: "事務公告",
    path: "/notice",
    fallbackDescription: "協會重要公告與通知事項",
    relatedHeading: "相關公告",
    listing: NEWS_LISTING_LINK,
  },
  related_news: {
    label: "相關報導",
    path: "/related-news",
    fallbackDescription: "與尤塞氏症相關的新聞報導與媒體報導",
    relatedHeading: "相關報導",
  },
  story: {
    label: "病友故事",
    path: "/story",
    fallbackDescription: "病友與家屬的真實經驗分享",
    relatedHeading: "相關文章",
    categorySlug: "story",
  },
  guides: {
    label: "建議與指引",
    path: "/guides",
    fallbackDescription: "尤塞氏症相關照護、資源與實務建議",
    relatedHeading: "相關文章",
    categorySlug: "guides",
  },
};

export function getListingLink(config: ArticleSectionConfig): {
  label: string;
  path: string;
} {
  return config.listing ?? { label: config.label, path: config.path };
}

/**
 * The /news listing shows every notice plus blog posts that are not curated
 * into the story/guides sections.
 */
export function isNewsArticle(article: {
  content_type: ContentType;
  categories?: Category[];
}): boolean {
  if (article.content_type === "notice") return true;
  if (article.content_type !== "blog") return false;
  const categorySlugs =
    article.categories?.map((category) => category.slug) ?? [];
  return !categorySlugs.includes("guides") && !categorySlugs.includes("story");
}
